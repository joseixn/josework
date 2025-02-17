(()=>{
    document.addEventListener('DOMContentLoaded', () => {
        if(document.body.classList.contains('single')) {
            mapboxgl.accessToken = window.MAPBOX_API_KEY;

            const mapContainer = document.querySelector('section.map');
            const lat = mapContainer.getAttribute('data-lat');
            const lng = mapContainer.getAttribute('data-lng');
            const map = new mapboxgl.Map({
                container: mapContainer, // container ID
                center: [lng, lat], // starting position [lng, lat]. Note that lat must be set between -90 and 90
                zoom: 16 // starting zoom
            });
            map.on('style.load', () => {
                map.setConfigProperty('basemap', 'theme', 'monochrome');
                map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);

                const marker = new mapboxgl.Marker({
                    element: document.createElement('div'),
                    className: 'mbx-marker'
                })
                    .setLngLat([lng, lat])
                    .addTo(map);
                    
            });
        }
    });
})();