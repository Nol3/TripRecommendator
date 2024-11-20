require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use(session({ 
    secret: 'your-secret-key', 
    resave: false, 
    saveUninitialized: false 
}));
app.use(passport.initialize());
app.use(passport.session());

// GitHub OAuth configuration
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
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
app.get('/auth/github', passport.authenticate('github'));

// Corregir la sintaxis del callback
app.get('/auth/github/callback', 
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
                           "image": "URL de una imagen representativa (usa placeholder si no hay imagen)",
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
            console.log('JSON parseado:', jsonData); // Añadir log
            if (!Array.isArray(jsonData)) {
                throw new Error('La respuesta no es un array');
            }
            res.json(jsonData);
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