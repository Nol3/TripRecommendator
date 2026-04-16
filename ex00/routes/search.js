const express = require('express');
const RecommendationService = require('../services/recommendations');

const router = express.Router();
const recommendationService = new RecommendationService(process.env.GEMINI_API_KEY);

// Simple in-memory rate limiter: max 10 requests per minute per IP
const rateLimitMap = new Map();
function rateLimit(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const max = 10;

    const entry = rateLimitMap.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
        entry.count = 1;
        entry.start = now;
    } else {
        entry.count += 1;
    }
    rateLimitMap.set(ip, entry);

    if (entry.count > max) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Espera un momento.' });
    }
    next();
}

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
    ]);
}

router.post('/', rateLimit, async (req, res) => {
    const { query, category } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const sanitizedQuery = query.trim().slice(0, 200);

    try {
        const places = await withTimeout(
            recommendationService.getRecommendations(sanitizedQuery, category),
            20000
        );

        if (!places || places.length === 0) {
            return res.status(404).json({ error: 'No se encontraron recomendaciones' });
        }

        const placesWithImages = await withTimeout(
            recommendationService.addImagesToPlaces(places, sanitizedQuery),
            8000
        );
        res.json(placesWithImages);
    } catch (error) {
        console.error('Search error:', error.message);
        if (error.message.includes('Timeout')) {
            return res.status(504).json({ error: 'La búsqueda tardó demasiado. Inténtalo de nuevo.' });
        }
        res.status(500).json({ error: 'Error al procesar la búsqueda' });
    }
});

module.exports = router;
