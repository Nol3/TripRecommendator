// Global variable to track current authenticated user
let currentUser = null;

/**
 * Visit Tracking Utility Functions
 * Helper functions for tracking user visits to places using localStorage
 */

/**
 * Retrieves the list of visited places for a specific username
 * @param {string} username - The username to get visits for
 * @returns {Array} Array of visited place objects
 */
function getVisited(username) {
    return JSON.parse(localStorage.getItem('visited:' + username) || '[]');
}

/**
 * Saves the visited places array to localStorage for a specific username
 * @param {string} username - The username to save visits for
 * @param {Array} arr - Array of visited place objects to save
 */
function saveVisited(username, arr) {
    localStorage.setItem('visited:' + username, JSON.stringify(arr));
}

/**
 * Tracks a visit to a place for a specific username
 * Avoids duplicate entries by checking if the place ID already exists
 * @param {string} username - The username to track the visit for
 * @param {Object} placeObj - The place object to track (must have an 'id' property)
 */
function trackVisit(username, placeObj) {
    const list = getVisited(username);
    if (!list.find(p => p.id === placeObj.id)) {   // avoid duplicates
        list.push({...placeObj, ts: Date.now()});
        saveVisited(username, list);
    }
}

// Default places data available globally
const defaultPlaces = [
    { id: 1, title: 'Barcelona', description: 'Ciudad cosmopolita con arquitectura única', image: './assets/barcelona.jpg', rating: 4.8, lat: 41.3851, lng: 2.1734 },
    { id: 2, title: 'Madrid', description: 'Capital cultural con museos de clase mundial', image: './assets/madrid.jpg', rating: 4.7, lat: 40.4168, lng: -3.7038 },
    { id: 3, title: 'Valencia', description: 'Ciudad de las artes y las ciencias', image: './assets/valencia.jpg', rating: 4.6, lat: 39.4699, lng: -0.3763 }
];

// Reusable helper function to update navigation for logged out state
function updateNavForLoggedOutState() {
    // Clear current user
    currentUser = null;
    const navLinks = document.querySelector('.nav-links');
    navLinks.innerHTML = `
        <a href="/api/auth/github" class="btn btn-secondary">
            <img src="assets/github.svg" alt="GitHub" width="20" height="20">
            Iniciar con GitHub
        </a>
    `;
    // Mostrar el formulario de búsqueda para todos los usuarios
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.style.display = 'flex';
    }
    // Show default places for logged out users
    const recommendationsContainer = document.getElementById('recommendations');
    if (recommendationsContainer && window.displayRecommendations) {
        window.displayRecommendations(defaultPlaces);
    }
}

// Function to update visited button text with current count
function updateVisitedButtonText() {
    if (currentUser && currentUser.username) {
        const btnVisited = document.getElementById('btnVisited');
        if (btnVisited) {
            const visitedCount = getVisited(currentUser.username).length;
            const visitedButtonText = visitedCount > 0 ? `Mis Lugares Visitados (${visitedCount})` : 'Mis Lugares Visitados';
            btnVisited.textContent = visitedButtonText;
        }
    }
}

// Reusable logout function at top-level scope
function logout() {
    console.log('🚪 Intentando cerrar sesión...');

    // Close any open modals before logging out
    const visitedModal = document.getElementById('visitedModal');
    const mapModal = document.getElementById('map-modal');
    if (visitedModal && visitedModal.style.display === 'block') {
        visitedModal.style.display = 'none';
        console.log('✅ Visited modal closed during logout');
    }
    if (mapModal && mapModal.style.display === 'block') {
        mapModal.style.display = 'none';
        console.log('✅ Map modal closed during logout');
    }

    // Clear current user and auth tokens/session data
    currentUser = null;
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Update UI (hide auth-only buttons, show "Login with GitHub")
    updateNavForLoggedOutState();

    // Perform logout API call
    fetch('/api/auth/logout')
        .then(response => {
            console.log('📡 Respuesta del logout:', response);
            if (response.ok) {
                return response.json();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        })
        .then(data => {
            console.log('✅ Logout exitoso:', data);
        })
        .catch(error => {
            console.error('❌ Error durante logout:', error);
        })
        .finally(() => {
            // Redirect to home (reload page to ensure clean state)
            window.location.reload();
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const recommendationsContainer = document.getElementById('recommendations');
    const mapModal = document.getElementById('map-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModal = document.querySelector('.close');
    let map;

    // Use the global defaultPlaces array
    const places = defaultPlaces;

    async function searchWithGemini(query) {
        try {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.textContent = 'Buscando lugares...';
            recommendationsContainer.innerHTML = '';
            recommendationsContainer.appendChild(loadingIndicator);

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Datos recibidos:', data);

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Hubo un error al buscar lugares. Por favor, intenta de nuevo.';
            recommendationsContainer.innerHTML = '';
            recommendationsContainer.appendChild(errorDiv);
            return [];
        } finally {
            const loadingIndicator = recommendationsContainer.querySelector('.loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }

    async function checkAuthStatus() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const loginStatus = urlParams.get('login');
            const userData = urlParams.get('user');

            if (loginStatus === 'success' && userData) {
                const user = JSON.parse(decodeURIComponent(userData));
                // Set currentUser with username from the authenticated user
                currentUser = {
                    username: user.login || user.username || user.name
                };

                // Pre-load visited list length for UI enhancement
                const visitedCount = getVisited(currentUser.username).length;
                const visitedButtonText = visitedCount > 0 ? `Mis Lugares Visitados (${visitedCount})` : 'Mis Lugares Visitados';

                const navLinks = document.querySelector('.nav-links');
                navLinks.innerHTML = `
                    <span class="user-info">
                        ${user.avatar_url ? `<img src="${user.avatar_url}" alt="Profile" class="profile-pic">` : ''}
                        ${user.name || user.login}
                    </span>
                    <button class="btn btn-secondary" id="btnVisited">${visitedButtonText}</button>
                    <button class="btn btn-secondary" id="logout-btn"></button>
                `;
                searchForm.style.display = 'flex';
                window.history.replaceState({}, document.title, '/');

                // Agregar event listener al botón de logout
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        logout();
                    });
                }

                const btnVisited = document.getElementById('btnVisited');
                if (btnVisited) {
                    btnVisited.addEventListener('click', (e) => {
                        e.preventDefault();
                        showVisitedPlaces();
                    });
                }
                return;
            }

            const response = await fetch('/api/auth/status');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const navLinks = document.querySelector('.nav-links');
            if (data.authenticated) {
                // Set currentUser with username from the authenticated user
                currentUser = {
                    username: data.user?.username || data.user?.displayName || data.user?.login || 'Usuario'
                };

                // Pre-load visited list length for UI enhancement
                const visitedCount = getVisited(currentUser.username).length;
                const visitedButtonText = visitedCount > 0 ? `Mis Lugares Visitados (${visitedCount})` : 'Mis Lugares Visitados';

                navLinks.innerHTML = `
                    <span class="user-info">
                        ${data.user?.photo ? `<img src="${data.user.photo}" alt="Profile" class="profile-pic">` : ''}
                        ${data.user?.displayName || data.user?.username || 'Usuario'}
                    </span>
                    <button class="btn btn-secondary" id="btnVisited">${visitedButtonText}</button>
                    <button class="btn btn-secondary" id="logout-btn">Cerrar sesión</button>
                `;
                searchForm.style.display = 'flex';
                displayRecommendations(places);

                // Agregar event listener al botón de logout
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        logout();
                    });
                }

                const btnVisited = document.getElementById('btnVisited');
                if (btnVisited) {
                    btnVisited.addEventListener('click', (e) => {
                        e.preventDefault();
                        showVisitedPlaces();
                    });
                }
            } else {
                updateNavForLoggedOutState();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            updateNavForLoggedOutState();
        }
    }

    checkAuthStatus();

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = searchInput.value;
        const results = await searchWithGemini(query);
        displayRecommendations(results);
    });

    function displayRecommendations(places) {
        recommendationsContainer.innerHTML = '';

        if (!Array.isArray(places) || places.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.setAttribute('role', 'alert');
            noResults.textContent = 'No se encontraron destinos. Por favor, intenta con otra búsqueda.';
            recommendationsContainer.appendChild(noResults);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'recommendations-grid';
        grid.setAttribute('role', 'list');

        places.forEach(place => {
            const currentPlace = place;
            const card = document.createElement('article');
            card.className = 'card';
            card.setAttribute('role', 'listitem');

            const fallbackImage = `https://picsum.photos/400/200?random=${place.id}`; //placeholder image
            const imgUrl = place.image || fallbackImage;

            card.innerHTML = `
                <img src="${imgUrl}"
                     alt="Vista de ${place.title}"
                     loading="lazy"
                     onerror="this.src='${fallbackImage}'"
                     class="card-image">
                <div class="card-content">
                    <h3>${place.title}</h3>
                    <div class="rating" aria-label="Valoración: ${place.rating} de 5 estrellas">
                        ⭐ ${place.rating}
                    </div>
                    <p>${place.description}</p>
                    <button class="btn btn-primary show-map"
                            data-lat="${place.lat}"
                            data-lng="${place.lng}"
                            aria-label="Ver ${place.title} en el mapa">
                        Ver en el mapa
                    </button>
                </div>
            `;

            const mapButton = card.querySelector('.show-map');
            mapButton.addEventListener('click', () => showMap(currentPlace));

            grid.appendChild(card);
        });

        recommendationsContainer.appendChild(grid);
    }

    function showMap(place) {
        mapModal.style.display = 'block';
        modalTitle.textContent = place.title;

        if (!map) {
            map = L.map('map', {
                keyboard: true,
                zoomControl: true
            }).setView([place.lat, place.lng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
        } else {
            map.setView([place.lat, place.lng], 13);
        }

        L.marker([place.lat, place.lng]).addTo(map)
            .bindPopup(place.title)
            .openPopup();

        // Track visit automatically if user is authenticated
        if (currentUser && currentUser.username) {
            const placeData = {
                id: place.id,
                name: place.title,
                lat: place.lat,
                lng: place.lng
            };
            trackVisit(currentUser.username, placeData);
            // Update the visited button text to reflect new count
            updateVisitedButtonText();
        }
    }

    closeModal.addEventListener('click', () => {
        mapModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === mapModal) {
            mapModal.style.display = 'none';
        }
        if (e.target === visitedModal) {
            visitedModal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (mapModal.style.display === 'block') {
                mapModal.style.display = 'none';
            }
            if (visitedModal && visitedModal.style.display === 'block') {
                visitedModal.style.display = 'none';
            }
        }
    });

    const visitedModal = document.getElementById('visitedModal');
    const closeVisited = document.getElementById('closeVisited');

    closeVisited.addEventListener('click', () => {
        visitedModal.style.display = 'none';
    });

    function showVisitedPlaces() {
        const visitedList = document.getElementById('visitedList');
        const visitedPlaces = getVisited(currentUser.username);

        visitedList.innerHTML = ''; // Clear existing list

        if (visitedPlaces.length > 0) {
            visitedPlaces.forEach(place => {
                const li = document.createElement('li');
                const formattedDate = new Date(place.ts).toLocaleString();
                li.innerHTML = `${place.name} - ${formattedDate} <a href="#" class="view-on-map" data-lat="${place.lat}" data-lng="${place.lng}" data-title="${place.name}">Ver en mapa</a>`;
                li.querySelector('.view-on-map').addEventListener('click', (e) => {
                    e.preventDefault();
                    visitedModal.style.display = 'none'; // Close this modal
                    showMap({lat: place.lat, lng: place.lng, title: place.name, id: place.id});
                });
                visitedList.appendChild(li);
            });
        } else {
            visitedList.innerHTML = '<li>No has visitado ningún lugar todavía.</li>';
        }

        visitedModal.style.display = 'block';
    }

    displayRecommendations(places);

    // Expose displayRecommendations globally for logout function
    window.displayRecommendations = displayRecommendations;
});
