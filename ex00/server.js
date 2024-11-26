require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// GitHub OAuth configuration
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/api/auth/github-callback';

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    proxy: true
}, (accessToken, refreshToken, profile, done) => {
    console.log('GitHub Auth Success:', profile); // Añadir log para depuración
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.key);

// Middleware para verificar autenticación
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};

// Ruta para verificar el estado de autenticación
app.get('/api/auth/status', (req, res) => {
    res.json({
        authenticated: req.isAuthenticated(),
        user: req.user ? {
            username: req.user.username,
            displayName: req.user.displayName,
            photo: req.user.photos?.[0]?.value
        } : null
    });
});

// Ruta para cerrar sesión
app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

// Routes
app.get('/api/auth/github', passport.authenticate('github'));

app.get('/api/auth/github/callback',
    passport.authenticate('github', {
        successRedirect: '/',
        failureRedirect: '/'
    })
);

// Proteger la ruta de búsqueda
app.post('/api/search', isAuthenticated, async (req, res) => {
    try {
        console.log('Búsqueda recibida:', req.body.query);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `Actúa como un experto en viajes y recomienda destinos turísticos basados en: ${req.body.query}
                       Responde SOLO con un array JSON válido (sin marcadores markdown) que contenga la siguiente estructura:
                       [
                         {
                           "id": número único,
                           "title": "nombre del destino",
                           "description": "descripción detallada en español, máximo 150 caracteres",
                           "image": "URL de una imagen representativa que no sea de wikimedia (usa placeholder si no hay imagen)",
                           "rating": número entre 1 y 5,
                           "lat": latitud,
                           "lng": longitud
                         }
                       ]
                       Limita la respuesta a 2 destinos máximo.
                       Asegúrate de que las coordenadas sean precisas.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Respuesta de Gemini:', text); // Añadir log

        try {
            const jsonData = JSON.parse(text);

            const processedData = await Promise.all(jsonData.map(async item => {
                try {
                    // Usar solo el título del lugar para la búsqueda
                    const searchQuery = item.title;
                    console.log('Búsqueda en Unsplash:', searchQuery);

                    const unsplashResponse = await fetch(
                        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`,
                        {
                            headers: {
                                'Accept-Version': 'v1',
                                'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
                            }
                        }
                    );

                    if (!unsplashResponse.ok) {
                        throw new Error(`Unsplash API error: ${unsplashResponse.statusText}`);
                    }

                    const unsplashData = await unsplashResponse.json();
                    console.log('Respuesta de Unsplash:', unsplashData); // Debug

                    const imageUrl = unsplashData.results[0]?.urls?.regular;

                    return {
                        ...item,
                        // Usar la imagen de Unsplash o mantener la URL original de Gemini como fallback
                        image: imageUrl || item.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(item.title)}`
                    };
                } catch (imgError) {
                    console.error('Error fetching image for', item.title, imgError);
                    // Mantener la imagen original de Gemini si existe
                    return {
                        ...item,
                        image: item.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(item.title)}`
                    };
                }
            }));

            res.json(processedData);
        } catch (parseError) {
            console.error('Error al parsear JSON:', parseError); // Añadir log
            res.json([]);
        }
    } catch (error) {
        console.error('Error detallado:', error); // Mejorar log de error
        res.status(500).json({
            error: 'Error al procesar la búsqueda',
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
