const RecommendationService = require('./recommendations');
const cache = require('./cache');
const { searchPlacesByCity } = require('../data/places');

// Top cities to pre-cache on server start
const POPULAR_CITIES = [
    'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Granada',
    'Córdoba', 'Toledo', 'Bilbao', 'Málaga', 'San Sebastián',
    'Paris', 'London', 'Rome', 'Amsterdam', 'Lisbon',
    'Tokyo', 'New York', 'Berlin', 'Prague', 'Vienna'
];

async function warmupCache(geminiApiKey) {
    const svc = new RecommendationService(geminiApiKey);
    let warmed = 0;

    console.log(`🔥 Warming cache for ${POPULAR_CITIES.length} cities...`);

    for (const city of POPULAR_CITIES) {
        const key = `${city.toLowerCase()}:all`;
        if (cache.get(key)) { warmed++; continue; }

        // Cities in local DB: cache instantly, no API call
        const local = searchPlacesByCity(city);
        if (local) {
            cache.set(key, local);
            warmed++;
            continue;
        }

        // For cities not in local DB, skip Gemini during warmup to avoid quota burn
        // They'll be fetched on first real request and then cached
    }

    console.log(`✅ Cache warmed: ${warmed}/${POPULAR_CITIES.length} cities ready`);
}

module.exports = { warmupCache, POPULAR_CITIES };
