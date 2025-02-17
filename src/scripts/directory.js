(()=>{
    document.addEventListener('DOMContentLoaded', () => {
        if(document.body.classList.contains('post-type-archive-directory')) {
            const map = document.querySelector('.posts-holder .map');
            if(map){
                mapboxgl.accessToken = window.MAPBOX_API_KEY;
                const postsScroller = document.querySelector('.posts-holder .posts');
                const posts = [...document.querySelectorAll('.posts-holder .post')];
                const mapInstance = new mapboxgl.Map({
                    container: map, // container ID
                    center: [-0.08412491102728836, 51.502002937317116], // starting position [lng, lat]. Note that lat must be set between -90 and 90
                    zoom: 14.57 // starting zoom
                });

                mapInstance.on('style.load', () => {
                    mapInstance.setConfigProperty('basemap', 'theme', 'monochrome');
                    mapInstance.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
                   
                });

                const geoJson = {
                    type: 'FeatureCollection',
                    features: posts.map(post=>{
                        const lat = post.getAttribute('data-lat');
                        const lng = post.getAttribute('data-lng');
                        const tag = post.querySelector('.tags a');
                        const color = tag ? getComputedStyle(tag).getPropertyValue('--term-color'):'red';
                        return {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: [Number(lng), Number(lat)]
                            },
                            properties: {
                                color,
                                id: post.getAttribute('data-id'),
                                // title: post.querySelector('.title').textContent,
                                // description: post.querySelector('.excerpt').textContent
                            }
                        }
                    })
                };
                console.log(JSON.stringify(geoJson));
                window.map = mapInstance;
                mapInstance.on('load', ()=>{
                    mapInstance.addSource('posts', {
                        type: 'geojson',
                        cluster: true,
                        clusterMaxZoom: 16, // Max zoom to cluster points on
                        clusterRadius: 25, // Radius of each cluster when clustering points (defaults to 50)
                        data: geoJson
                    });
                    mapInstance.addLayer({
                        id: 'clusters',
                        type: 'circle',
                        source: 'posts',
                        filter: ['has', 'point_count'],
                        paint: {
                            // Use step expressions (https://docs.mapbox.com/style-spec/reference/expressions/#step)
                            // with three steps to implement three types of circles:
                            //   * Blue, 20px circles when point count is less than 100
                            //   * Yellow, 30px circles when point count is between 100 and 750
                            //   * Pink, 40px circles when point count is greater than or equal to 750
                            'circle-color': 'rgba(234, 255, 6, 1)',
                            'circle-radius': 20
                        }
                    });

                    mapInstance.addLayer({
                        id: 'cluster-count',
                        type: 'symbol',
                        source: 'posts',
                        filter: ['has', 'point_count'],
                        layout: {
                            'text-field': ['get', 'point_count_abbreviated'],
                            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                            'text-size': 12
                        }
                    });
            
                    mapInstance.addLayer({
                        id: 'unclustered-point',
                        type: 'circle',
                        source: 'posts',
                        filter: ['!', ['has', 'point_count']],
                        paint: {
                            'circle-color': ['get', 'color'],
                            'circle-radius': 6,
                            // 'circle-stroke-width': 1,
                            // 'circle-stroke-color': '#fff'
                        }
                    });

                    // inspect a cluster on click
                    mapInstance.on('click', 'clusters', (e) => {
                        const features = mapInstance.queryRenderedFeatures(e.point, {
                            layers: ['clusters']
                        });
                        const clusterId = features[0].properties.cluster_id;
                        mapInstance.getSource('posts').getClusterExpansionZoom(
                            clusterId,
                            (err, zoom) => {
                                if (err) return;

                                mapInstance.easeTo({
                                    center: features[0].geometry.coordinates,
                                    zoom: zoom
                                });
                            }
                        );
                    });

                    // When a click event occurs on a feature in
                    // the unclustered-point layer, open a popup at
                    // the location of the feature, with
                    // description HTML from its properties.
                    mapInstance.on('click', 'unclustered-point', (e) => {
                        const coordinates = e.features[0].geometry.coordinates.slice();
                        const mag = e.features[0].properties.mag;
                        const tsunami =
                            e.features[0].properties.tsunami === 1 ? 'yes' : 'no';

                        // Ensure that if the map is zoomed out such that
                        // multiple copies of the feature are visible, the
                        // popup appears over the copy being pointed to.
                        if (['mercator', 'equirectangular'].includes(mapInstance.getProjection().name)) {
                            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                            }
                        }

                        const scrollTo = e.features[0].properties.id;
                        const elm = postsScroller.querySelector(`[data-id="${scrollTo}"]`);
                        if(elm){
                            postsScroller.scrollTo({
                                top: elm.offsetTop,
                                behavior: 'smooth'
                            });
                        }
                        
                    });

                    mapInstance.on('mouseenter', 'clusters', () => {
                        mapInstance.getCanvas().style.cursor = 'pointer';
                    });
                    mapInstance.on('mouseleave', 'clusters', () => {
                        mapInstance.getCanvas().style.cursor = '';
                    });
                });
            }
        }
    });
})();