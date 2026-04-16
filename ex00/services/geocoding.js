const { default: fetch } = require('node-fetch');

async function getCoordinates(place) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'TripRecommendator/2.0' } });
        if (!res.ok) throw new Error(`Nominatim ${res.status}`);
        const data = await res.json();
        if (!data.length) return null;
        return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            display_name: data[0].display_name
        };
    } catch (err) {
        console.error('Geocoding error:', err.message);
        return null;
    }
}

// Overpass API query: tourist attractions, museums, viewpoints within 5km
function buildOverpassQuery(lat, lng) {
    const radius = 3000;
    return `[out:json][timeout:10];(node["tourism"~"attraction|museum|viewpoint|gallery"](around:${radius},${lat},${lng});node["historic"~"monument|castle|ruins|memorial"](around:${radius},${lat},${lng});way["tourism"~"attraction|museum"](around:${radius},${lat},${lng});way["historic"~"monument|castle"](around:${radius},${lat},${lng}););out center 15;`;
}

// Score a POI: prefer those with real names, descriptions and tourism tags
function scorePoi(el) {
    const tags = el.tags || {};
    let score = 0;
    if (tags.name) score += 10;
    if (tags.tourism)  score += 5;
    if (tags.historic) score += 4;
    if (tags.wikipedia || tags.wikidata) score += 6;
    if (tags.description) score += 3;
    if (tags['name:es']) score += 2;
    return score;
}

function categoryFromTags(tags) {
    if (!tags) return 'cultura';
    if (tags.tourism === 'museum' || tags.amenity === 'arts_centre') return 'cultura';
    if (tags.tourism === 'viewpoint') return 'naturaleza';
    if (tags.historic) return 'historia';
    if (tags.leisure === 'park' || tags.leisure === 'garden' || tags.leisure === 'nature_reserve') return 'naturaleza';
    if (tags.amenity === 'theatre' || tags.amenity === 'cinema') return 'ocio';
    return 'cultura';
}

function descriptionFromTags(tags, name) {
    if (tags.description) return tags.description.slice(0, 150);
    if (tags.tourism === 'museum')     return `Museo ${name} — imprescindible para conocer la historia y cultura local`;
    if (tags.tourism === 'viewpoint')  return `Mirador con vistas panorámicas excepcionales de la zona`;
    if (tags.tourism === 'attraction') return `Atracción destacada y punto de interés de la ciudad`;
    if (tags.tourism === 'gallery')    return `Galería de arte con exposiciones locales e internacionales`;
    if (tags.historic === 'castle')    return `Castillo histórico con siglos de historia y arquitectura única`;
    if (tags.historic === 'monument')  return `Monumento emblemático de la ciudad y su patrimonio cultural`;
    if (tags.historic === 'ruins')     return `Ruinas históricas que narran el pasado de la civilización local`;
    if (tags.leisure === 'park')       return `Parque urbano ideal para pasear y disfrutar del entorno natural`;
    return `Lugar de interés destacado en ${name}`;
}

async function generatePlacesFromCoordinates(cityName, coordinates) {
    try {
        const query = buildOverpassQuery(coordinates.lat, coordinates.lng);
        const endpoints = [
            'https://overpass-api.de/api/interpreter',
            'https://overpass.kumi.systems/api/interpreter'
        ];
        let res;
        for (const endpoint of endpoints) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4000);
            try {
                res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `data=${encodeURIComponent(query)}`,
                    signal: controller.signal
                });
                clearTimeout(timer);
                if (res.ok) break;
                console.warn(`Overpass ${endpoint} → ${res.status}`);
            } catch (e) {
                clearTimeout(timer);
                console.warn(`Overpass ${endpoint} → ${e.message}`);
            }
        }

        if (!res.ok) throw new Error(`Overpass ${res.status}`);

        const data = await res.json();
        const elements = (data.elements || []).filter(el => el.tags?.name);

        if (elements.length < 3) {
            console.warn('Overpass returned too few results, using fallback');
            return fallbackPlaces(cityName, coordinates);
        }

        // Sort by score and deduplicate by name
        const seen = new Set();
        const sorted = elements
            .sort((a, b) => scorePoi(b) - scorePoi(a))
            .filter(el => {
                const name = el.tags.name.trim();
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            })
            .slice(0, 6);

        return sorted.map((el, i) => {
            const tags = el.tags;
            const lat = el.lat ?? el.center?.lat ?? coordinates.lat;
            const lng = el.lon ?? el.center?.lon ?? coordinates.lng;
            return {
                id: Date.now() + i,
                title: tags['name:es'] || tags.name,
                description: descriptionFromTags(tags, tags.name),
                rating: parseFloat((4.0 + Math.random() * 0.9).toFixed(1)),
                lat,
                lng,
                category: categoryFromTags(tags)
            };
        });

    } catch (err) {
        console.error('Overpass error:', err.message);
        return fallbackPlaces(cityName, coordinates);
    }
}

function fallbackPlaces(cityName, { lat, lng }) {
    return [
        { id: Date.now() + 1, title: `${cityName} — Centro histórico`, description: `Explora el corazón histórico de ${cityName}`, rating: 4.4, lat, lng, category: 'historia' },
        { id: Date.now() + 2, title: `${cityName} — Zona cultural`, description: `Arte, museos y cultura en ${cityName}`, rating: 4.3, lat: lat + 0.003, lng: lng + 0.003, category: 'cultura' },
        { id: Date.now() + 3, title: `${cityName} — Parque principal`, description: `Naturaleza y descanso en ${cityName}`, rating: 4.2, lat: lat - 0.003, lng: lng - 0.003, category: 'naturaleza' }
    ];
}

module.exports = { getCoordinates, generatePlacesFromCoordinates };
