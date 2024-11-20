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
        { id: 1, title: 'Barcelona', description: 'Ciudad cosmopolita con arquitectura única', image: 'https://via.placeholder.com/400x200.png?text=Barcelona', rating: 4.8, lat: 41.3851, lng: 2.1734 },
        { id: 2, title: 'Madrid', description: 'Capital cultural con museos de clase mundial', image: 'https://via.placeholder.com/400x200.png?text=Madrid', rating: 4.7, lat: 40.4168, lng: -3.7038 },
        { id: 3, title: 'Valencia', description: 'Ciudad de las artes y las ciencias', image: 'https://via.placeholder.com/400x200.png?text=Valencia', rating: 4.6, lat: 39.4699, lng: -0.3763 }
    ];

    async function searchWithGemini(query) {
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Error searching:', error);
            return [];
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
        places.forEach(place => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${place.image}" alt="${place.title}">
                <div class="card-content">
                    <h3>${place.title}</h3>
                    <div class="rating">⭐ ${place.rating}</div>
                    <p>${place.description}</p>
                    <button class="btn btn-primary show-map" data-id="${place.id}">Ver en el mapa</button>
                </div>
            `;
            recommendationsContainer.appendChild(card);
        });

        document.querySelectorAll('.show-map').forEach(button => {
            button.addEventListener('click', (e) => {
                const placeId = parseInt(e.target.getAttribute('data-id'));
                const place = places.find(p => p.id === placeId);
                showMap(place);
            });
        });
    }

    function showMap(place) {
        mapModal.style.display = 'block';
        modalTitle.textContent = place.title;

        if (!map) {
            map = L.map('map').setView([place.lat, place.lng], 13);
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

    // Mostrar recomendaciones iniciales
    displayRecommendations(places);
});