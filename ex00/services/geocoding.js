const { default: fetch } = require('node-fetch');

// Servicio de geocoding usando OpenStreetMap Nominatim (gratuito)
async function getCoordinates(place) {
    try {
        const query = encodeURIComponent(place);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'TripRecommendator/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
        }

        return null;
    } catch (error) {
        console.error('Error en geocoding:', error);
        return null;
    }
}

// Función para generar lugares basados en coordenadas
async function generatePlacesFromCoordinates(place, coordinates) {
    const basePlaces = [
        {
            id: Date.now() + 1,
            title: `${place} - Centro Histórico`,
            description: `Explora el centro histórico de ${place} con sus calles más emblemáticas`,
            rating: 4.5,
            lat: coordinates.lat,
            lng: coordinates.lng,
            category: "histórico"
        },
        {
            id: Date.now() + 2,
            title: `${place} - Plaza Principal`,
            description: `Visita la plaza principal de ${place}, corazón de la ciudad`,
            rating: 4.4,
            lat: coordinates.lat + 0.001,
            lng: coordinates.lng + 0.001,
            category: "cultura"
        },
        {
            id: Date.now() + 3,
            title: `${place} - Mirador`,
            description: `Disfruta de las mejores vistas panorámicas de ${place}`,
            rating: 4.3,
            lat: coordinates.lat - 0.001,
            lng: coordinates.lng - 0.001,
            category: "naturaleza"
        }
    ];

    return basePlaces;
}

module.exports = {
    getCoordinates,
    generatePlacesFromCoordinates
};