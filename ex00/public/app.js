document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const recommendationsContainer = document.getElementById('recommendations');
    const mapModal = document.getElementById('map-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModal = document.querySelector('.close');
    let map;

    // Datos de ejemplo (en una aplicación real, estos vendrían de una API)
    const places = [
        { id: 1, title: 'Barcelona', description: 'Ciudad cosmopolita con arquitectura única', image: './assets/barcelona.jpg', rating: 4.8, lat: 41.3851, lng: 2.1734 },
        { id: 2, title: 'Madrid', description: 'Capital cultural con museos de clase mundial', image: './assets/madrid.jpg', rating: 4.7, lat: 40.4168, lng: -3.7038 },
        { id: 3, title: 'Valencia', description: 'Ciudad de las artes y las ciencias', image: './assets/valencia.jpg', rating: 4.6, lat: 39.4699, lng: -0.3763 }
    ];

    async function searchWithGemini(query) {
        try {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.textContent = 'Buscando destinos...';
            recommendationsContainer.innerHTML = '';
            recommendationsContainer.appendChild(loadingIndicator);

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });
            
            const data = await response.json();
            console.log('Datos recibidos:', data); // Añadir log

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('Error en la búsqueda:', error);
            return [];
        } finally {
            const loadingIndicator = recommendationsContainer.querySelector('.loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    }

    // Verificar estado de autenticación
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            const navLinks = document.querySelector('.nav-links');
            if (data.authenticated) {
                navLinks.innerHTML = `
                    <span class="user-info">
                        ${data.user.photo ? `<img src="${data.user.photo}" alt="Profile" class="profile-pic">` : ''}
                        ${data.user.displayName || data.user.username}
                    </span>
                    <a href="/auth/logout" class="btn btn-secondary">Cerrar sesión</a>
                `;
                searchForm.style.display = 'flex';
            } else {
                navLinks.innerHTML = `
                    <a href="/auth/github" class="btn btn-secondary">
                        <img src="assets/github.svg" alt="GitHub" width="20" height="20">
                        Iniciar con GitHub
                    </a>
                `;
                searchForm.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    // Verificar autenticación al cargar
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
            const currentPlace = place; // Guardar referencia para el evento del mapa
            const card = document.createElement('article');
            card.className = 'card';
            card.setAttribute('role', 'listitem');
            
            // Mejorar el manejo de fallback de imágenes
            const fallbackImage = `https://picsum.photos/400/200?random=${place.id}`;
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

    // Mejorar accesibilidad del teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mapModal.style.display === 'block') {
            mapModal.style.display = 'none';
        }
    });

    // Mostrar recomendaciones iniciales
    displayRecommendations(places);
});