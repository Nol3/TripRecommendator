const { searchPlacesByCity, getRandomPlaces } = require('../data/places');
const { getCoordinates, generatePlacesFromCoordinates } = require('./geocoding');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class RecommendationService {
    constructor(geminiApiKey = null) {
        this.genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
    }

    async getRecommendations(query) {
        console.log('🔍 Buscando recomendaciones para:', query);

        // 1. Intentar buscar en la base de datos local
        const localResults = searchPlacesByCity(query);
        if (localResults) {
            console.log('✅ Encontrados en base de datos local');
            return localResults;
        }

        // 2. Intentar geocoding para lugares desconocidos
        console.log('🌍 Intentando geocoding...');
        const coordinates = await getCoordinates(query);
        if (coordinates) {
            console.log('✅ Coordenadas obtenidas:', coordinates);
            const generatedPlaces = await generatePlacesFromCoordinates(query, coordinates);
            return generatedPlaces;
        }

        // 3. Intentar con Gemini si está disponible
        if (this.genAI) {
            console.log('🤖 Intentando con Gemini...');
            try {
                const geminiResults = await this.getGeminiRecommendations(query);
                if (geminiResults) {
                    return geminiResults;
                }
            } catch (error) {
                console.log('❌ Error con Gemini:', error.message);
            }
        }

        // 4. Fallback: lugares aleatorios
        console.log('🎲 Usando lugares aleatorios como fallback');
        return getRandomPlaces();
    }

    async getGeminiRecommendations(query) {
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

            const prompt = `Como experto en viajes, recomiéndame 3 lugares específicos para visitar en: ${query}
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

            // Limpiar la respuesta de Gemini
            let cleanText = text.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/```json\n?/, '').replace(/```\n?/, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```\n?/, '').replace(/```\n?/, '');
            }

            const jsonData = JSON.parse(cleanText);
            return jsonData;

        } catch (error) {
            console.error('Error con Gemini:', error);
            return null;
        }
    }

    async addImagesToPlaces(places) {
        if (!places || places.length === 0) return places;

        const processedPlaces = await Promise.all(places.map(async (place) => {
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
                console.error('Error fetching image for:', place.title, error);
                return {
                    ...place,
                    image: `https://source.unsplash.com/800x600/?${encodeURIComponent(place.title)}`
                };
            }
        }));

        return processedPlaces;
    }
}

module.exports = RecommendationService;