// Base de datos de lugares populares por ciudad/país
const placesDatabase = {
    // España
    "madrid": [
        {
            id: 1,
            title: "Plaza Mayor",
            description: "Histórica plaza central con arquitectura barroca del siglo XVII",
            rating: 4.7,
            lat: 40.4155,
            lng: -3.7074,
            category: "histórico"
        },
        {
            id: 2,
            title: "Museo del Prado",
            description: "Museo de arte con obras maestras de Goya, Velázquez y El Greco",
            rating: 4.8,
            lat: 40.4138,
            lng: -3.6921,
            category: "cultura"
        },
        {
            id: 3,
            title: "Parque del Retiro",
            description: "Hermoso parque urbano con lagos, jardines y el Palacio de Cristal",
            rating: 4.6,
            lat: 40.4168,
            lng: -3.6886,
            category: "naturaleza"
        }
    ],
    "barcelona": [
        {
            id: 4,
            title: "Sagrada Familia",
            description: "Impresionante basílica diseñada por Antoni Gaudí",
            rating: 4.9,
            lat: 41.4036,
            lng: 2.1744,
            category: "arquitectura"
        },
        {
            id: 5,
            title: "Park Güell",
            description: "Parque público con obras de Gaudí y vistas panorámicas",
            rating: 4.7,
            lat: 41.4145,
            lng: 2.1527,
            category: "arquitectura"
        },
        {
            id: 6,
            title: "La Rambla",
            description: "Famosa avenida peatonal con artistas callejeros y mercados",
            rating: 4.5,
            lat: 41.3802,
            lng: 2.1699,
            category: "cultura"
        }
    ],
    "valencia": [
        {
            id: 7,
            title: "Ciudad de las Artes y las Ciencias",
            description: "Complejo arquitectónico futurista con museos y acuario",
            rating: 4.8,
            lat: 39.4542,
            lng: -0.3485,
            category: "arquitectura"
        },
        {
            id: 8,
            title: "Catedral de Valencia",
            description: "Catedral gótica con el Santo Cáliz y torre del Miguelete",
            rating: 4.6,
            lat: 39.4754,
            lng: -0.3754,
            category: "histórico"
        },
        {
            id: 9,
            title: "Playa de la Malvarrosa",
            description: "Hermosa playa urbana con paseo marítimo y restaurantes",
            rating: 4.4,
            lat: 39.4699,
            lng: -0.3219,
            category: "naturaleza"
        }
    ],
    "sevilla": [
        {
            id: 10,
            title: "Catedral de Sevilla",
            description: "La catedral gótica más grande del mundo con la Giralda",
            rating: 4.8,
            lat: 37.3891,
            lng: -5.9845,
            category: "histórico"
        },
        {
            id: 11,
            title: "Real Alcázar",
            description: "Palacio real con jardines árabes y arquitectura mudéjar",
            rating: 4.7,
            lat: 37.3839,
            lng: -5.9915,
            category: "histórico"
        },
        {
            id: 12,
            title: "Plaza de España",
            description: "Impresionante plaza semicircular con arquitectura regionalista",
            rating: 4.6,
            lat: 37.3772,
            lng: -5.9869,
            category: "arquitectura"
        }
    ],
    "granada": [
        {
            id: 13,
            title: "Alhambra",
            description: "Palacio nazarí con jardines y arquitectura islámica",
            rating: 4.9,
            lat: 37.1760,
            lng: -3.5976,
            category: "histórico"
        },
        {
            id: 14,
            title: "Albaicín",
            description: "Barrio histórico árabe con calles empedradas y miradores",
            rating: 4.7,
            lat: 37.1800,
            lng: -3.5900,
            category: "histórico"
        },
        {
            id: 15,
            title: "Catedral de Granada",
            description: "Catedral renacentista con capilla real y cripta",
            rating: 4.5,
            lat: 37.1765,
            lng: -3.5976,
            category: "histórico"
        }
    ],
    // Ciudades internacionales
    "paris": [
        {
            id: 16,
            title: "Torre Eiffel",
            description: "Icono de París con vistas panorámicas de la ciudad",
            rating: 4.8,
            lat: 48.8584,
            lng: 2.2945,
            category: "arquitectura"
        },
        {
            id: 17,
            title: "Museo del Louvre",
            description: "Museo más grande del mundo con la Mona Lisa",
            rating: 4.7,
            lat: 48.8606,
            lng: 2.3376,
            category: "cultura"
        },
        {
            id: 18,
            title: "Notre-Dame",
            description: "Catedral gótica en la Île de la Cité",
            rating: 4.6,
            lat: 48.8530,
            lng: 2.3499,
            category: "histórico"
        }
    ],
    "london": [
        {
            id: 19,
            title: "Big Ben",
            description: "Reloj icónico del Palacio de Westminster",
            rating: 4.7,
            lat: 51.4994,
            lng: -0.1245,
            category: "arquitectura"
        },
        {
            id: 20,
            title: "British Museum",
            description: "Museo con antigüedades de todo el mundo",
            rating: 4.6,
            lat: 51.5194,
            lng: -0.1270,
            category: "cultura"
        },
        {
            id: 21,
            title: "Tower Bridge",
            description: "Puente levadizo victoriano sobre el Támesis",
            rating: 4.5,
            lat: 51.5055,
            lng: -0.0754,
            category: "arquitectura"
        }
    ],
    "rome": [
        {
            id: 22,
            title: "Coliseo",
            description: "Anfiteatro romano más grande del mundo",
            rating: 4.8,
            lat: 41.8902,
            lng: 12.4922,
            category: "histórico"
        },
        {
            id: 23,
            title: "Vaticano",
            description: "Ciudad-estado con la Basílica de San Pedro",
            rating: 4.7,
            lat: 41.9028,
            lng: 12.4534,
            category: "histórico"
        },
        {
            id: 24,
            title: "Fontana di Trevi",
            description: "Famosa fuente barroca donde lanzar monedas",
            rating: 4.6,
            lat: 41.9009,
            lng: 12.4833,
            category: "arquitectura"
        }
    ]
};

// Función para buscar lugares por ciudad
function searchPlacesByCity(city) {
    const normalizedCity = city.toLowerCase().trim();

    // Buscar coincidencia exacta
    if (placesDatabase[normalizedCity]) {
        return placesDatabase[normalizedCity];
    }

    // Buscar coincidencias parciales
    const matches = [];
    for (const [key, places] of Object.entries(placesDatabase)) {
        if (key.includes(normalizedCity) || normalizedCity.includes(key)) {
            matches.push(...places);
        }
    }

    return matches.length > 0 ? matches.slice(0, 3) : null;
}

// Función para obtener lugares aleatorios como fallback
function getRandomPlaces() {
    const allPlaces = Object.values(placesDatabase).flat();
    const shuffled = allPlaces.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
}

module.exports = {
    placesDatabase,
    searchPlacesByCity,
    getRandomPlaces
};