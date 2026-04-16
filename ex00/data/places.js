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
    "córdoba": [
        {
            id: 25,
            title: "Mezquita-Catedral de Córdoba",
            description: "Obra maestra del arte islámico y cristiano, Patrimonio de la Humanidad",
            rating: 4.9,
            lat: 37.8791,
            lng: -4.7794,
            category: "histórico"
        },
        {
            id: 26,
            title: "Barrio de la Judería",
            description: "Antiguo barrio judío medieval con calles blancas y la Sinagoga",
            rating: 4.7,
            lat: 37.8802,
            lng: -4.7819,
            category: "histórico"
        },
        {
            id: 27,
            title: "Alcázar de los Reyes Cristianos",
            description: "Fortaleza medieval con jardines y fuentes espectaculares",
            rating: 4.6,
            lat: 37.8765,
            lng: -4.7845,
            category: "histórico"
        }
    ],
    "toledo": [
        {
            id: 28,
            title: "Catedral Primada de Toledo",
            description: "Catedral gótica del siglo XIII con el Transparente barroco",
            rating: 4.8,
            lat: 39.8571,
            lng: -4.0241,
            category: "histórico"
        },
        {
            id: 29,
            title: "Alcázar de Toledo",
            description: "Fortaleza medieval con vistas panorámicas de la ciudad",
            rating: 4.6,
            lat: 39.8583,
            lng: -4.0196,
            category: "histórico"
        },
        {
            id: 30,
            title: "Barrio Judío y Sinagoga del Tránsito",
            description: "Barrio medieval con la mejor sinagoga mudéjar de España",
            rating: 4.5,
            lat: 39.8554,
            lng: -4.0268,
            category: "histórico"
        }
    ],
    "bilbao": [
        {
            id: 31,
            title: "Museo Guggenheim Bilbao",
            description: "Icónico museo de arte contemporáneo de titanio junto a la ría",
            rating: 4.8,
            lat: 43.2689,
            lng: -2.9341,
            category: "cultura"
        },
        {
            id: 32,
            title: "Casco Viejo de Bilbao",
            description: "Siete calles históricas con pintxos, comercios y la Catedral",
            rating: 4.6,
            lat: 43.2569,
            lng: -2.9232,
            category: "histórico"
        },
        {
            id: 33,
            title: "Mercado de la Ribera",
            description: "Mayor mercado cubierto de Europa con gastronomía vasca",
            rating: 4.5,
            lat: 43.2572,
            lng: -2.9217,
            category: "gastronomía"
        }
    ],
    "san sebastián": [
        {
            id: 34,
            title: "Playa de la Concha",
            description: "Una de las mejores playas urbanas de Europa con paseo marítimo",
            rating: 4.9,
            lat: 43.3183,
            lng: -1.9812,
            category: "naturaleza"
        },
        {
            id: 35,
            title: "Parte Vieja",
            description: "Casco antiguo con los mejores bares de pintxos del País Vasco",
            rating: 4.8,
            lat: 43.3237,
            lng: -1.9754,
            category: "gastronomía"
        },
        {
            id: 36,
            title: "Monte Urgull",
            description: "Monte con el Castillo de la Mota y vistas panorámicas de la bahía",
            rating: 4.6,
            lat: 43.3247,
            lng: -1.9784,
            category: "naturaleza"
        }
    ],
    "málaga": [
        {
            id: 37,
            title: "Alcazaba de Málaga",
            description: "Palacio-fortaleza árabe del siglo XI con vistas al mar Mediterráneo",
            rating: 4.7,
            lat: 36.7213,
            lng: -4.4154,
            category: "histórico"
        },
        {
            id: 38,
            title: "Museo Picasso Málaga",
            description: "Museo dedicado al artista malagueño con más de 200 obras",
            rating: 4.6,
            lat: 36.7220,
            lng: -4.4175,
            category: "cultura"
        },
        {
            id: 39,
            title: "Centro Pompidou Málaga",
            description: "Arte contemporáneo internacional en el corazón del puerto",
            rating: 4.5,
            lat: 36.7152,
            lng: -4.4177,
            category: "cultura"
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
    ],
    "tokyo": [
        { id: 50, title: "Templo Senso-ji", description: "Templo budista más antiguo de Tokio en el barrio de Asakusa", rating: 4.8, lat: 35.7148, lng: 139.7967, category: "histórico" },
        { id: 51, title: "Shibuya Crossing", description: "El cruce peatonal más transitado y famoso del mundo", rating: 4.7, lat: 35.6595, lng: 139.7005, category: "ocio" },
        { id: 52, title: "Jardines del Palacio Imperial", description: "Jardines del Palacio Imperial con fosos y torres históricas", rating: 4.6, lat: 35.6852, lng: 139.7528, category: "naturaleza" }
    ],
    "new york": [
        { id: 53, title: "Central Park", description: "Pulmón verde de Manhattan con lagos, senderos y el Met", rating: 4.8, lat: 40.7851, lng: -73.9683, category: "naturaleza" },
        { id: 54, title: "Estatua de la Libertad", description: "Símbolo de libertad en la isla Liberty con vistas a Manhattan", rating: 4.7, lat: 40.6892, lng: -74.0445, category: "histórico" },
        { id: 55, title: "MoMA", description: "Museo de Arte Moderno con Picasso, Warhol y Klimt", rating: 4.7, lat: 40.7614, lng: -73.9776, category: "cultura" }
    ],
    "amsterdam": [
        { id: 56, title: "Rijksmuseum", description: "Museo nacional con Rembrandt y Vermeer", rating: 4.8, lat: 52.3600, lng: 4.8852, category: "cultura" },
        { id: 57, title: "Casa de Ana Frank", description: "Museo en la casa donde se escondió Ana Frank durante la WWII", rating: 4.7, lat: 52.3752, lng: 4.8839, category: "histórico" },
        { id: 58, title: "Canales de Ámsterdam", description: "Red de canales del siglo XVII Patrimonio UNESCO", rating: 4.6, lat: 52.3676, lng: 4.9041, category: "arquitectura" }
    ],
    "lisbon": [
        { id: 59, title: "Torre de Belém", description: "Torre manuelina del siglo XVI en la desembocadura del Tajo", rating: 4.7, lat: 38.6916, lng: -9.2160, category: "histórico" },
        { id: 60, title: "Barrio de Alfama", description: "Barrio histórico con fado, miradouros y el Castillo de São Jorge", rating: 4.8, lat: 38.7139, lng: -9.1334, category: "histórico" },
        { id: 61, title: "Monasterio de los Jerónimos", description: "Monasterio manuelino Patrimonio UNESCO con las tumbas de Vasco de Gama", rating: 4.8, lat: 38.6977, lng: -9.2069, category: "histórico" }
    ]
};

function normalize(str) {
    return str.toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // strip accents
}

const aliases = {
    'cordoba': 'córdoba',
    'malaga': 'málaga',
    'san sebastian': 'san sebastián',
    'donostia': 'san sebastián',
    'roma': 'rome',
    'roma': 'rome',
    'tokio': 'tokyo',
    'nueva york': 'new york',
    'nyc': 'new york',
    'amsterdam': 'amsterdam',
    'lisboa': 'lisbon',
    'londre': 'london',
    'londres': 'london',
};

function searchPlacesByCity(city) {
    const norm = normalize(city);
    const resolved = normalize(aliases[norm] || norm);

    // Exact match (with and without accents)
    for (const [key, places] of Object.entries(placesDatabase)) {
        if (normalize(key) === resolved) return places;
    }

    // Partial match
    for (const [key, places] of Object.entries(placesDatabase)) {
        const normKey = normalize(key);
        if (normKey.includes(resolved) || resolved.includes(normKey)) {
            return places;
        }
    }

    return null;
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