document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const recommendationsContainer = document.getElementById('recommendations');
    const mapModal = document.getElementById('map-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModal = document.querySelector('.close');
    let map;

    const places = [
        { id: 1, title: 'Barcelona', description: 'Ciudad cosmopolita con arquitectura única', image: './assets/barcelona.jpg', rating: 4.8, lat: 41.3851, lng: 2.1734 },
        { id: 2, title: 'Madrid', description: 'Capital cultural con museos de clase mundial', image: './assets/madrid.jpg', rating: 4.7, lat: 40.4168, lng: -3.7038 },
        { id: 3, title: 'Valencia', description: 'Ciudad de las artes y las ciencias', image: './assets/valencia.jpg', rating: 4.6, lat: 39.4699, lng: -0.3763 }
    ];

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
                const navLinks = document.querySelector('.nav-links');
                navLinks.innerHTML = `
                    <span class="user-info">
                        ${user.avatar_url ? `<img src="${user.avatar_url}" alt="Profile" class="profile-pic">` : ''}
                        ${user.name || user.login}
                    </span>
                    <button class="btn btn-secondary" id="logout-btn">Cerrar sesión</button>
                `;
                searchForm.style.display = 'flex';
                window.history.replaceState({}, document.title, '/');

                // Agregar event listener al botón de logout
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        console.log('🚪 Intentando cerrar sesión...');
                        try {
                            const response = await fetch('/api/auth/logout');
                            if (response.ok) {
                                updateNavForLoggedOutState();
                                window.location.reload();
                            }
                        } catch (error) {
                            console.error('❌ Error durante logout:', error);
                            updateNavForLoggedOutState();
                            window.location.reload();
                        }
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
                navLinks.innerHTML = `
                    <span class="user-info">
                        ${data.user?.photo ? `<img src="${data.user.photo}" alt="Profile" class="profile-pic">` : ''}
                        ${data.user?.displayName || data.user?.username || 'Usuario'}
                    </span>
                    <button class="btn btn-secondary" id="logout-btn">Cerrar sesión</button>
                `;
                searchForm.style.display = 'flex';
                displayRecommendations(places);

                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        console.log('🚪 Intentando cerrar sesión...');
                        try {
                            const response = await fetch('/api/auth/logout');
                            console.log('📡 Respuesta del logout:', response);

                            if (response.ok) {
                                const data = await response.json();
                                console.log('✅ Logout exitoso:', data);
                                updateNavForLoggedOutState();
                                // Limpiar cualquier estado local
                                localStorage.removeItem('user');
                                sessionStorage.clear();
                                // Recargar la página para limpiar completamente el estado
                                window.location.reload();
                            } else {
                                console.error('❌ Error en logout:', response.status);
                            }
                        } catch (error) {
                            console.error('❌ Error durante logout:', error);
                            // Forzar logout local
                            updateNavForLoggedOutState();
                            window.location.reload();
                        }
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

    function updateNavForLoggedOutState() {
        const navLinks = document.querySelector('.nav-links');
        navLinks.innerHTML = `
            <a href="/api/auth/github" class="btn btn-secondary">
                <img src="assets/github.svg" alt="GitHub" width="20" height="20">
                Iniciar con GitHub
            </a>
        `;
        searchForm.style.display = 'none';
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
    }

    closeModal.addEventListener('click', () => {
        mapModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === mapModal) {
            mapModal.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mapModal.style.display === 'block') {
            mapModal.style.display = 'none';
        }
    });

    displayRecommendations(places);
});