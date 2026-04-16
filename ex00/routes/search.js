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

router.post('/', rateLimit, async (req, res) => {
    const { query, category } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const sanitizedQuery = query.trim().slice(0, 200);

    try {
        const places = await recommendationService.getRecommendations(sanitizedQuery, category);

        if (!places || places.length === 0) {
            return res.status(404).json({ error: 'No se encontraron recomendaciones' });
        }

        const placesWithImages = await recommendationService.addImagesToPlaces(places);
        res.json(placesWithImages);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Error al procesar la búsqueda', details: error.message });
    }
});

module.exports = router;
