# TripRecommendator — Roadmap

## ✅ Completado
- Diseño oscuro moderno (dark theme con accent púrpura)
- Filtros por categoría (Cultura, Gastronomía, Naturaleza, Historia, Ocio)
- Skeleton loading
- Botón "Marcar visitado" explícito con toggle
- Caché en memoria (10 min TTL)
- Rate limiting (10 req/min por IP)
- SESSION_SECRET desde variable de entorno
- Gemini flash con prompt de 6 lugares reales con coordenadas
- Overpass API con AbortController (timeout 4s por mirror)
- DB local extendida: 17 ciudades (ES + internacional)
- Fix routing Vercel (todo a server.js, maxDuration: 30)
- **#1 Pre-caché ciudades populares** al arrancar el servidor
- **#2 Contexto de búsqueda** (época, duración, tipo de viajero) → prompt Gemini adaptado

---

## 📋 Pendiente

### #3 — Wikipedia para descripciones reales
**Objetivo:** Enriquecer cada lugar devuelto con descripción real de Wikipedia y su imagen oficial.

**Implementación:**
- `services/wikipedia.js` — consulta `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
- Buscar primero en español (`es.wikipedia.org`), fallback a inglés
- Llamar tras obtener lugares de Gemini/DB, en paralelo con `Promise.all`
- Reemplazar descripción si Wikipedia devuelve extracto más largo
- Usar `thumbnail.source` como imagen si Unsplash falla

**Archivos a tocar:** `services/wikipedia.js` (nuevo), `services/recommendations.js`

**Esfuerzo:** ~2h | **Coste:** gratis

---

### #4 — Streaming de resultados
**Objetivo:** Mostrar cards conforme llegan en lugar de esperar todas. Mejora percepción x3.

**Implementación:**
- Backend: cambiar `/api/search` a `text/event-stream` con `res.write()`
- Enviar cada lugar como `data: {JSON}\n\n` en cuanto Gemini lo devuelve
- Frontend: `EventSource` o `fetch` + `ReadableStream` reader
- Mostrar skeleton → reemplazar card a card conforme llegan
- Fallback: si el browser no soporta streaming, usar el endpoint actual

**Archivos a tocar:** `routes/search.js`, `public/app.js`

**Esfuerzo:** ~3h | **Coste:** gratis

---

### #5 — Google Places API
**Objetivo:** Reemplazar Gemini+Overpass con datos reales de Google (rating real, fotos oficiales, horarios).

**Implementación:**
- Endpoint: `https://maps.googleapis.com/maps/api/place/textsearch/json?query={city}+tourist+attractions`
- Añadir `services/googlePlaces.js`
- Devuelve: nombre, coordenadas, rating, foto, horario de apertura
- Usar como nueva fuente en `_fetchRecommendations` antes que Gemini
- Fotos: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={ref}&key={key}`

**Archivos a tocar:** `services/googlePlaces.js` (nuevo), `services/recommendations.js`, `.env`

**Esfuerzo:** ~4h | **Coste:** gratis hasta 5k req/mes, luego $17/1k

**Requisito:** Google Cloud account + Places API habilitada

---

### #6 — Redis con Upstash (caché persistente entre deploys)
**Objetivo:** El caché actual es en memoria y se pierde en cada deploy de Vercel. Redis sobrevive.

**Implementación:**
- Crear cuenta en [upstash.com](https://upstash.com) (tier gratuito: 10k req/día)
- Instalar `@upstash/redis`: `npm install @upstash/redis`
- Reemplazar `services/cache.js` con cliente Upstash
- TTL: 30 min para ciudades populares, 10 min para el resto
- Añadir env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

**Archivos a tocar:** `services/cache.js`, `vercel.json` (env vars), `.env`

**Esfuerzo:** ~1h | **Coste:** gratis hasta 10k req/día

```js
// services/cache.js con Upstash
const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

---

## 🔮 Ideas futuras

- **Autenticación real con DB** — guardar visitas en PostgreSQL (Neon.tech, gratis) en vez de localStorage
- **Búsqueda por radio** — "lugares cerca de mí" usando geolocalización del browser
- **Itinerario generado** — dado N días, Gemini genera un plan día a día
- **Compartir viaje** — URL única con las recomendaciones guardadas
- **PWA** — app instalable en móvil con caché offline
