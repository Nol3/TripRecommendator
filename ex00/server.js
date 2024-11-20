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
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GeminiApiKey);

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
app.get('/auth/github/callback', 
    passport.authenticate('github', { 
        successRedirect: '/',
        failureRedirect: '/login' 
    })
);

// Proteger la ruta de búsqueda
app.post('/api/search', isAuthenticated, async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Cambiado a gemini-pro
        const prompt = `Recomienda destinos turísticos basados en: ${req.body.query}. 
                       Responde con un array JSON que contenga objetos con: 
                       id, title, description, image, rating, lat, lng`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
            const jsonData = JSON.parse(text);
            res.json(jsonData);
        } catch (parseError) {
            res.json([]);
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});