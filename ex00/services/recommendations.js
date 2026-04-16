const { searchPlacesByCity, getRandomPlaces } = require('../data/places');
const { getCoordinates, generatePlacesFromCoordinates } = require('./geocoding');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cache = require('./cache');

const CATEGORIES = ['cultura', 'gastronomía', 'naturaleza', 'historia', 'ocio'];

class RecommendationService {
    constructor(geminiApiKey = null) {
        this.genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
    }

    async getRecommendations(query, category = null) {
        const cacheKey = `${query.toLowerCase()}:${category || 'all'}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            console.log('✅ Cache hit:', cacheKey);
            return cached;
        }

        let results = await this._fetchRecommendations(query);

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

    async _fetchRecommendations(query) {
        const localResults = searchPlacesByCity(query);
        if (localResults) {
            console.log('✅ Local DB hit');
            return localResults;
        }

        console.log('🌍 Geocoding...');
        const coordinates = await getCoordinates(query);
        if (coordinates) {
            return generatePlacesFromCoordinates(query, coordinates);
        }

        if (this.genAI) {
            console.log('🤖 Trying Gemini...');
            try {
                const results = await this._geminiRecommendations(query);
                if (results) return results;
            } catch (err) {
                console.error('Gemini error:', err.message);
            }
        }

        console.log('🎲 Fallback: random places');
        return getRandomPlaces();
    }

    async _geminiRecommendations(query) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        const prompt = `Eres un experto en viajes. Recomienda 6 lugares específicos para visitar en: "${query}"
Responde ÚNICAMENTE con JSON válido, sin markdown ni texto extra:
[
  {
    "id": 1,
    "title": "Nombre del lugar",
    "description": "Descripción breve (máx 150 caracteres)",
    "rating": 4.5,
    "lat": 41.3851,
    "lng": 2.1734,
    "category": "cultura"
  }
]
Categorías válidas: ${CATEGORIES.join(', ')}.
Exactamente 6 lugares con coordenadas precisas.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim()
            .replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```\n?$/, '');

        return JSON.parse(text);
    }

    async addImagesToPlaces(places) {
        if (!places || places.length === 0) return places;

        return Promise.all(places.map(async (place) => {
            try {
                const res = await fetch(
                    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(place.title)}&per_page=1&client_id=${process.env.UNSPLASH_ACCESS_KEY}`,
                    { headers: { 'Accept-Version': 'v1' } }
                );

                if (!res.ok) throw new Error(`Unsplash ${res.status}`);

                const data = await res.json();
                const imageUrl = data.results?.[0]?.urls?.regular;

                return { ...place, image: imageUrl || this._fallbackImage(place.title) };
            } catch {
                return { ...place, image: this._fallbackImage(place.title) };
            }
        }));
    }

    _fallbackImage(title) {
        return `https://picsum.photos/seed/${encodeURIComponent(title)}/800/500`;
    }
}

module.exports = RecommendationService;
