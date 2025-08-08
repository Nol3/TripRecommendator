require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const RecommendationService = require('./services/recommendations');

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

// Inicializar el servicio de recomendaciones
const recommendationService = new RecommendationService(process.env.GEMINI_API_KEY);
console.log('✅ Servicio de recomendaciones inicializado');

// Authentication middleware (currently unused but kept for future use)
// const isAuthenticated = (req, res, next) => {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     res.status(401).json({ error: 'No autenticado' });
// };

app.get('/api/auth/status', (req, res) => {
    const authCookie = req.cookies?.auth;
    const sessionUser = req.session?.user;

    res.json({
        authenticated: Boolean(authCookie || sessionUser),
        user: sessionUser || null
    });
});

app.get('/api/auth/logout', (req, res) => {
    console.log('🚪 Intentando cerrar sesión...');

    // Limpiar todas las cookies relacionadas con la autenticación
    res.clearCookie('connect.sid');
    res.clearCookie('auth');
    res.clearCookie('userId');

    // Destruir la sesión
    req.session.destroy((err) => {
        if (err) {
            console.error('❌ Error al destruir sesión:', err);
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }

        console.log('✅ Sesión destruida correctamente');

        // Logout de passport
        req.logout((err) => {
            if (err) {
                console.error('❌ Error en passport logout:', err);
            }

            // Enviar respuesta JSON en lugar de redirect para mejor manejo en el frontend
            res.json({
                success: true,
                message: 'Sesión cerrada correctamente'
            });
        });
    });
});

// Endpoint de debug para verificar variables de entorno
app.get('/api/debug/env', (req, res) => {
    res.json({
        NODE_ENV: process.env.NODE_ENV,
        GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID ? 'Configurado' : 'No configurado',
        GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET ? 'Configurado' : 'No configurado',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Configurado' : 'No configurado',
        UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY ? 'Configurado' : 'No configurado',
        CALLBACK_URL: process.env.CALLBACK_URL,
        recommendationService_initialized: recommendationService ? 'Sí' : 'No'
    });
});

// Endpoint de prueba para el sistema de recomendaciones
app.get('/api/debug/recommendations', async (req, res) => {
    try {
        const testQuery = req.query.q || 'Madrid';
        console.log('🧪 Probando recomendaciones para:', testQuery);

        const places = await recommendationService.getRecommendations(testQuery);
        const placesWithImages = await recommendationService.addImagesToPlaces(places);

        res.json({
            success: true,
            query: testQuery,
            places: placesWithImages,
            message: 'Sistema de recomendaciones funciona correctamente'
        });
    } catch (error) {
        console.error('❌ Error en prueba de recomendaciones:', error);
        res.status(500).json({
            error: 'Error al probar sistema de recomendaciones',
            details: error.message,
            stack: error.stack
        });
    }
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
        console.log('🔍 Búsqueda recibida:', req.body);

        if (!req.body.query) {
            console.log('❌ Query no proporcionada');
            return res.status(400).json({ error: 'Query is required' });
        }

        // Usar el nuevo servicio de recomendaciones
        const places = await recommendationService.getRecommendations(req.body.query);

        if (!places || places.length === 0) {
            return res.status(404).json({
                error: 'No se encontraron recomendaciones para esta búsqueda'
            });
        }

        // Agregar imágenes a los lugares
        const placesWithImages = await recommendationService.addImagesToPlaces(places);

        console.log('✅ Recomendaciones generadas:', placesWithImages.length, 'lugares');
        res.json(placesWithImages);

    } catch (error) {
        console.error('❌ Error general en búsqueda:', error);
        console.error('📋 Stack trace:', error.stack);
        res.status(500).json({
            error: 'Error al procesar la búsqueda',
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
