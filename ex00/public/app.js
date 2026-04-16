let currentUser = null;
let activeCategory = '';
let allPlaces = [];
let mapInstance = null;
let mapMarkers = [];

const defaultPlaces = [
    { id: 1, title: 'Barcelona', description: 'Ciudad cosmopolita con arquitectura única de Gaudí', image: './assets/barcelona.jpg', rating: 4.8, lat: 41.3851, lng: 2.1734, category: 'cultura' },
    { id: 2, title: 'Madrid', description: 'Capital cultural con museos de clase mundial', image: './assets/madrid.jpg', rating: 4.7, lat: 40.4168, lng: -3.7038, category: 'historia' },
    { id: 3, title: 'Valencia', description: 'Ciudad de las artes y las ciencias junto al mar', image: './assets/valencia.jpg', rating: 4.6, lat: 39.4699, lng: -0.3763, category: 'ocio' }
];

// ─── Visit tracking ───────────────────────────────────
function getVisited(username) {
    return JSON.parse(localStorage.getItem('visited:' + username) || '[]');
}

function saveVisited(username, arr) {
    localStorage.setItem('visited:' + username, JSON.stringify(arr));
}

function trackVisit(username, placeObj) {
    const list = getVisited(username);
    if (!list.find(p => p.id === placeObj.id)) {
        list.push({ ...placeObj, ts: Date.now() });
        saveVisited(username, list);
    }
}

function isVisited(placeId) {
    if (!currentUser) return false;
    return getVisited(currentUser.username).some(p => p.id === placeId);
}

// ─── Nav helpers ──────────────────────────────────────
function updateNavForLoggedOutState() {
    currentUser = null;
    const navLinks = document.querySelector('.nav-links');
    navLinks.innerHTML = `
        <a href="/api/auth/github" class="btn btn-github" id="login-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Iniciar sesión
        </a>
    `;
    displayRecommendations(defaultPlaces);
}

function updateNavForLoggedInState(user) {
    currentUser = { username: user.login || user.username || user.displayName || user.name || 'Usuario' };
    const visitedCount = getVisited(currentUser.username).length;
    const navLinks = document.querySelector('.nav-links');
    navLinks.innerHTML = `
        <span class="user-info">
            ${user.avatar_url || user.photo ? `<img src="${user.avatar_url || user.photo}" alt="Avatar" class="profile-pic">` : ''}
            ${user.name || user.login || user.displayName || 'Usuario'}
        </span>
        <button class="btn btn-visited" id="btnVisited">
            ${visitedCount > 0 ? `✓ Visitados (${visitedCount})` : '☑ Visitados'}
        </button>
        <button class="btn btn-secondary" id="logout-btn">Salir</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('btnVisited').addEventListener('click', showVisitedModal);
}

// ─── Logout ───────────────────────────────────────────
function logout() {
    closeAllModals();
    currentUser = null;
    localStorage.removeItem('user');
    sessionStorage.clear();
    updateNavForLoggedOutState();
    fetch('/api/auth/logout')
        .catch(err => console.error('Logout error:', err))
        .finally(() => window.location.reload());
}

// ─── Skeleton ─────────────────────────────────────────
function showSkeletons(count = 6) {
    const container = document.getElementById('recommendations');
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'recommendations-grid';
    for (let i = 0; i < count; i++) {
        grid.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="skeleton-content">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-rating"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text-short"></div>
                    <div class="skeleton skeleton-btn"></div>
                </div>
            </div>
        `;
    }
    container.appendChild(grid);
}

// ─── Display ──────────────────────────────────────────
function displayRecommendations(places, query = '') {
    allPlaces = places;
    renderFilteredPlaces();
}

function renderFilteredPlaces() {
    const container = document.getElementById('recommendations');
    const filtered = activeCategory
        ? allPlaces.filter(p => p.category && p.category.toLowerCase().includes(activeCategory))
        : allPlaces;

    container.innerHTML = '';

    if (!Array.isArray(filtered) || filtered.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <span class="no-results-icon">🗺️</span>
                <p>No se encontraron destinos${activeCategory ? ` en la categoría "${activeCategory}"` : ''}.</p>
            </div>
        `;
        return;
    }

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <span class="section-title">Destinos recomendados</span>
        <span class="results-count">${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}</span>
    `;

    const grid = document.createElement('div');
    grid.className = 'recommendations-grid';

    filtered.forEach(place => {
        const visited = isVisited(place.id);
        const fallback = `https://picsum.photos/seed/${place.id}/640/400`;
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-image-wrapper">
                <img class="card-image"
                     src="${place.image || fallback}"
                     alt="${place.title}"
                     loading="lazy"
                     onerror="this.src='${fallback}'">
                ${place.category ? `<span class="card-category">${place.category}</span>` : ''}
            </div>
            <div class="card-content">
                <h3 class="card-title">${place.title}</h3>
                <div class="card-rating">⭐ ${place.rating}</div>
                <p class="card-description">${place.description}</p>
                <div class="card-actions">
                    <button class="btn btn-primary show-map" data-id="${place.id}">
                        🗺 Ver en mapa
                    </button>
                    ${currentUser ? `
                        <button class="btn ${visited ? 'btn-visited' : 'btn-secondary'} mark-visited" data-id="${place.id}">
                            ${visited ? '✓ Visitado' : '+ Marcar visitado'}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        card.querySelector('.show-map').addEventListener('click', () => showMap(place));

        if (currentUser) {
            card.querySelector('.mark-visited').addEventListener('click', (e) => {
                toggleVisited(place, e.currentTarget);
            });
        }

        grid.appendChild(card);
    });

    container.appendChild(header);
    container.appendChild(grid);
}

function toggleVisited(place, btn) {
    if (!currentUser) return;
    const list = getVisited(currentUser.username);
    const exists = list.find(p => p.id === place.id);

    if (exists) {
        saveVisited(currentUser.username, list.filter(p => p.id !== place.id));
        btn.textContent = '+ Marcar visitado';
        btn.className = 'btn btn-secondary mark-visited';
    } else {
        trackVisit(currentUser.username, { id: place.id, name: place.title, lat: place.lat, lng: place.lng });
        btn.textContent = '✓ Visitado';
        btn.className = 'btn btn-visited mark-visited';
    }

    updateVisitedBtnCount();
}

function updateVisitedBtnCount() {
    if (!currentUser) return;
    const btn = document.getElementById('btnVisited');
    if (!btn) return;
    const count = getVisited(currentUser.username).length;
    btn.textContent = count > 0 ? `✓ Visitados (${count})` : '☑ Visitados';
}

// ─── Map ──────────────────────────────────────────────
function showMap(place) {
    const modal = document.getElementById('map-modal');
    const title = document.getElementById('modal-title');
    title.textContent = place.title;
    openModal(modal);

    if (!mapInstance) {
        mapInstance = L.map('map').setView([place.lat, place.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(mapInstance);
    } else {
        mapMarkers.forEach(m => m.remove());
        mapMarkers = [];
        mapInstance.setView([place.lat, place.lng], 13);
    }

    const marker = L.marker([place.lat, place.lng])
        .addTo(mapInstance)
        .bindPopup(`<strong>${place.title}</strong>${place.category ? `<br><small>${place.category}</small>` : ''}`)
        .openPopup();
    mapMarkers.push(marker);

    setTimeout(() => mapInstance.invalidateSize(), 100);
}

// ─── Visited Modal ────────────────────────────────────
function showVisitedModal() {
    if (!currentUser) return;
    const modal = document.getElementById('visitedModal');
    const list = document.getElementById('visitedList');
    const visited = getVisited(currentUser.username);

    list.innerHTML = visited.length === 0
        ? '<li style="padding:1.5rem; text-align:center; color:var(--text-muted)">Todavía no has marcado ningún lugar como visitado.</li>'
        : visited.map(p => `
            <li>
                <div class="visited-info">
                    <span class="visited-name">${p.name}</span>
                    <span class="visited-date">${new Date(p.ts).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}</span>
                </div>
                <button class="view-on-map"
                        data-lat="${p.lat}" data-lng="${p.lng}"
                        data-title="${p.name}" data-id="${p.id}">
                    🗺 Ver
                </button>
            </li>
        `).join('');

    list.querySelectorAll('.view-on-map').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
            showMap({ id: btn.dataset.id, title: btn.dataset.title, lat: +btn.dataset.lat, lng: +btn.dataset.lng });
        });
    });

    openModal(modal);
}

// ─── Modal helpers ────────────────────────────────────
function openModal(modal) {
    modal.classList.add('open');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}

// ─── Search ───────────────────────────────────────────
async function searchPlaces(query) {
    showSkeletons(6);
    try {
        const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, category: activeCategory || undefined })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error('Search error:', err);
        document.getElementById('recommendations').innerHTML = `
            <div class="error-message">⚠ ${err.message || 'Error al buscar lugares. Inténtalo de nuevo.'}</div>
        `;
        return [];
    }
}

// ─── Auth ─────────────────────────────────────────────
async function checkAuthStatus() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('login') === 'success' && urlParams.get('user')) {
            const user = JSON.parse(decodeURIComponent(urlParams.get('user')));
            updateNavForLoggedInState(user);
            window.history.replaceState({}, document.title, '/');
            displayRecommendations(defaultPlaces);
            return;
        }

        const res = await fetch('/api/auth/status');
        if (!res.ok) throw new Error('Auth check failed');
        const data = await res.json();

        if (data.authenticated && data.user) {
            updateNavForLoggedInState(data.user);
            displayRecommendations(defaultPlaces);
        } else {
            updateNavForLoggedOutState();
        }
    } catch {
        updateNavForLoggedOutState();
    }
}

// ─── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();

    // Search form
    document.getElementById('search-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;
        const results = await searchPlaces(query);
        if (results.length > 0) displayRecommendations(results, query);
    });

    // Category filters
    document.getElementById('category-filters').addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeCategory = chip.dataset.category;
        renderFilteredPlaces();
    });

    // Map modal close
    document.querySelector('#map-modal .close-btn').addEventListener('click', closeAllModals);

    // Visited modal close
    document.getElementById('closeVisited').addEventListener('click', closeAllModals);

    // Click outside modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeAllModals();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // Expose for nav updates
    window.displayRecommendations = displayRecommendations;
});
