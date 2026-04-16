const { searchPlacesByCity, getRandomPlaces } = require('../data/places');
const { getCoordinates, generatePlacesFromCoordinates } = require('./geocoding');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cache = require('./cache');

const CATEGORIES = ['cultura', 'gastronomía', 'naturaleza', 'historia', 'ocio'];

class RecommendationService {
    constructor(geminiApiKey = null) {
        this.genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
    }

    async getRecommendations(query, category = null, context = {}) {
        const contextKey = [context.season, context.duration, context.travelerType]
            .filter(Boolean).join(':');
        const cacheKey = `${query.toLowerCase()}:${category || 'all'}:${contextKey}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log('✅ Cache hit:', cacheKey);
            return cached;
        }

        let results = await this._fetchRecommendations(query, context);

        if (category && results) {
            results = results.filter(p =>
                !p.category || p.category.toLowerCase().includes(category.toLowerCase())
            );
        }

        if (results && results.length > 0) {
            cache.set(cacheKey, results);
        }

        return results;
    }

    async _fetchRecommendations(query, context = {}) {
        // 1. Local DB — only when no trip context that would change results
        const hasContext = context.season || context.duration || context.travelerType;
        if (!hasContext) {
            const localResults = searchPlacesByCity(query);
            if (localResults) {
                console.log('✅ Local DB hit');
                return localResults;
            }
        }

        // 2. Gemini — reliable, real places with real coords + context-aware
        if (this.genAI) {
            console.log('🤖 Gemini...');
            try {
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Gemini timeout')), 9000)
                );
                const results = await Promise.race([this._geminiRecommendations(query, context), timeout]);
                if (results && results.length > 0) return results;
            } catch (err) {
                console.error('Gemini error:', err.message);
            }
        }

        // 3. Overpass via OSM geocoding (fallback when no Gemini key)
        console.log('🌍 Overpass fallback...');
        const coordinates = await getCoordinates(query);
        if (coordinates) {
            return generatePlacesFromCoordinates(query, coordinates);
        }

        console.log('🎲 Random fallback');
        return getRandomPlaces();
    }

    async _geminiRecommendations(query, context = {}) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const contextLines = [];
        if (context.season)      contextLines.push(`- Época del año: ${context.season}`);
        if (context.duration)    contextLines.push(`- Duración del viaje: ${context.duration}`);
        if (context.travelerType) contextLines.push(`- Tipo de viajero: ${context.travelerType}`);
        const contextBlock = contextLines.length
            ? `\nTen en cuenta este contexto del viajero:\n${contextLines.join('\n')}\n`
            : '';

        const prompt = `Eres un experto en viajes. Recomienda 6 lugares específicos para visitar en: "${query}"${contextBlock}
Adapta las recomendaciones al contexto: si es familia prioriza parques y museos interactivos, si es pareja romantiza los lugares, si es mochilero incluye opciones económicas, según la época del año considera si los lugares están abiertos o son especialmente atractivos en esa temporada.
Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra:
[
  {
    "id": 1,
    "title": "Nombre del lugar",
    "description": "Descripción breve y específica al contexto (máx 150 caracteres)",
    "rating": 4.5,
    "lat": 41.3851,
    "lng": 2.1734,
    "category": "cultura"
  }
]
Categorías válidas: ${CATEGORIES.join(', ')}.
Exactamente 6 lugares con coordenadas GPS precisas.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim()
            .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```\n?$/, '');

        return JSON.parse(text);
    }

    async addImagesToPlaces(places, cityQuery = '') {
        if (!places || places.length === 0) return places;
        if (!process.env.UNSPLASH_ACCESS_KEY) return places.map(p => ({ ...p, image: this._fallbackImage(p.title) }));

        return Promise.all(places.map(async (place) => {
            try {
                // Search with place title; if generic, append city for better results
                const searchTerm = cityQuery
                    ? `${place.title} ${cityQuery}`
                    : place.title;

                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), 4000);

                const res = await fetch(
                    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=3&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`,
                    { headers: { 'Accept-Version': 'v1' }, signal: controller.signal }
                );
                clearTimeout(timer);

                if (!res.ok) throw new Error(`Unsplash ${res.status}`);

                const data = await res.json();
                // Pick the photo with the highest likes for quality
                const best = data.results?.sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
                const imageUrl = best?.urls?.regular;

                return { ...place, image: imageUrl || this._fallbackImage(place.title) };
            } catch {
                return { ...place, image: this._fallbackImage(place.title) };
            }
        }));
    }

    _fallbackImage(title) {
        // Picsum with deterministic seed so the same place always gets the same image
        const seed = title.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
        return `https://picsum.photos/seed/${seed}/800/500`;
    }
}

module.exports = RecommendationService;
