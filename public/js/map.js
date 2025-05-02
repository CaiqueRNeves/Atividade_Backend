document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o elemento do mapa existe
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    
    try {
        // Exibir mensagem de carregamento
        mapContainer.innerHTML = `
            <div class="text-center p-5">
                <h3 class="mb-3">Mapa de Pontos Turísticos de Belém</h3>
                <p class="mb-4">Carregando mapa...</p>
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
            </div>
        `;
        
        // Verificar se a API do Google Maps está disponível
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            throw new Error('Google Maps API não está disponível');
        }
        
        // Coordenadas de Belém
        const belemCoordinates = { lat: -1.4557, lng: -48.4902 };
        
        // Criar o mapa
        const map = new google.maps.Map(mapContainer, {
            center: belemCoordinates,
            zoom: 13,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });
        
        // Adicionar marcador para Belém
        new google.maps.Marker({
            position: belemCoordinates,
            map: map,
            title: 'Belém do Pará'
        });
        
        // Lista de pontos turísticos
        const touristSpots = [
            {
                name: 'Mercado Ver-o-Peso',
                position: { lat: -1.4518, lng: -48.5039 },
                type: 'attraction'
            },
            {
                name: 'Estação das Docas',
                position: { lat: -1.4496, lng: -48.5014 },
                type: 'restaurant'
            },
            {
                name: 'Basílica de Nazaré',
                position: { lat: -1.4521, lng: -48.4789 },
                type: 'attraction'
            },
            {
                name: 'Mangal das Garças',
                position: { lat: -1.4678, lng: -48.5039 },
                type: 'attraction'
            },
            {
                name: 'Museu Emílio Goeldi',
                position: { lat: -1.4523, lng: -48.4736 },
                type: 'attraction'
            }
        ];
        
        // Adicionar marcadores para os pontos turísticos
        touristSpots.forEach(spot => {
            const marker = new google.maps.Marker({
                position: spot.position,
                map: map,
                title: spot.name
            });
            
            // Adicionar janela de informação
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="text-align: center; padding: 10px;">
                        <h5 style="margin-bottom: 5px;">${spot.name}</h5>
                        <p style="margin-bottom: 5px;">Tipo: ${spot.type}</p>
                        <a href="/tour/search?location=${encodeURIComponent(spot.name)}" 
                           style="display: inline-block; padding: 5px 10px; background-color: #16a085; color: white; text-decoration: none; border-radius: 4px;">
                           Ver Tours
                        </a>
                    </div>
                `
            });
            
            // Abrir janela de informação ao clicar no marcador
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
        });
        
    } catch (error) {
        console.error('Erro ao inicializar o mapa:', error);
        
        // Exibir mensagem de erro
        mapContainer.innerHTML = `
            <div class="text-center p-5">
                <h3 class="mb-3">Ops! Algo deu errado.</h3>
                <p class="mb-4">Esta página não carregou o Google Maps corretamente.</p>
                <p>Consulte o console JavaScript para ver detalhes técnicos.</p>
            </div>
        `;
    }
});