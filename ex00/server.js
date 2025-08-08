require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

const CALLBACK_URL = process.env.CALLBACK_URL;

// Configurar GitHub OAuth2 solo si las credenciales están disponibles
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        proxy: true
    }, (accessToken, refreshToken, profile, done) => {
        console.log('GitHub Auth Success:', profile);
        return done(null, profile);
    }));
} else {
    console.log('⚠️  GitHub OAuth2 no configurado. La autenticación no estará disponible.');
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Configurar Gemini AI solo si la API key está disponible
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
    console.log('⚠️  Gemini API no configurada. La funcionalidad de recomendaciones no estará disponible.');
}

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'No autenticado' });
};

app.get('/api/auth/status', (req, res) => {
    const authCookie = req.cookies?.auth;
    const sessionUser = req.session?.user;

    res.json({
        authenticated: Boolean(authCookie || sessionUser),
        user: sessionUser || null
    });
});

app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        req.logout(() => {
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    });
});

app.get('/api/auth/github', passport.authenticate('github'));

app.get('/api/auth/github/callback',
    passport.authenticate('github', {
        successRedirect: '/',
        failureRedirect: '/'
    })
);

app.post('/api/search', async (req, res) => {
    try {
        if (!req.body.query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Verificar si Gemini está configurado
        if (!genAI) {
            return res.status(500).json({
                error: 'Gemini API no configurada. Por favor, configura GEMINI_API_KEY en tu archivo .env'
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Como experto en viajes, recomiéndame lugares específicos para visitar en: ${req.body.query}
                       Responde ÚNICAMENTE en formato JSON válido como este ejemplo:
                       [
                         {
                           "id": 1,
                           "title": "Nombre del lugar",
                           "description": "Breve descripción del lugar (máximo 150 caracteres)",
                           "rating": 4.5,
                           "lat": 41.3851,
                           "lng": 2.1734
                         }
                       ]
                       Incluye exactamente 3 lugares. Asegúrate de que las coordenadas sean precisas.
                       IMPORTANTE: Responde SOLO con el JSON válido, sin texto adicional, sin markdown, sin explicaciones.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Respuesta de Gemini:', text);

        // Limpiar la respuesta de Gemini para extraer solo el JSON
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/```json\n?/, '').replace(/```\n?/, '');
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/```\n?/, '').replace(/```\n?/, '');
        }

        try {
            const jsonData = JSON.parse(cleanText);

            const processedData = await Promise.all(jsonData.map(async (place) => {
                try {
                    const unsplashResponse = await fetch(
                        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(place.title)}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`,
                        {
                            headers: {
                                'Accept-Version': 'v1'
                            }
                        }
                    );

                    if (!unsplashResponse.ok) {
                        throw new Error('Error fetching from Unsplash');
                    }

                    const unsplashData = await unsplashResponse.json();
                    const imageUrl = unsplashData.results[0]?.urls?.regular;

                    return {
                        ...place,
                        image: imageUrl || `https://source.unsplash.com/800x600/?${encodeURIComponent(place.title)}`
                    };
                } catch (error) {
                    console.error('Error fetching image:', error);
                    return place;
                }
            }));

            res.json(processedData);
        } catch (parseError) {
            console.error('Error al parsear JSON:', parseError);
            res.status(500).json({ error: 'Error al procesar la respuesta' });
        }
    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({ error: 'Error al procesar la búsqueda' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
