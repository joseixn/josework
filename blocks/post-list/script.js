(()=>{
    document.querySelectorAll('.block__anatomy-post-list').forEach((block) => {
        const loadMore = block.querySelector('.load-more');
        const posts = block.querySelector('.posts');
        const postType = block.getAttribute('data-post-type');
        const perPage = block.getAttribute('data-per-page');

        const terms = [...block.querySelectorAll('.taxonomies .taxonomy .term')];

        console.log('Load more', loadMore)

        const dateFormat = (d)=>{
            return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear().toString().padStart(2, '0')}`
        }
        let loading = false;
        let selectedTaxonomy = null;

        const loadPosts = async  (useOffset, limitTaxonomy, limitTaxonomyTerm)=>{
            if(loading){
                return;
            }
            loading = true;
            const offset = posts.querySelectorAll('.post').length;
            let url = `/wp-json/wp/v2/${postType}?per_page=${perPage}`;
            if(useOffset){
                url += `&offset=${offset}`;
            }
            if(limitTaxonomy){
                url += `&${limitTaxonomy}=${limitTaxonomyTerm}`;
            }
            const response = await fetch(url);
            const data = await response.json();

            const postsHTML = await Promise.all(data.map(async (post) => {
                const fm = post._links['wp:featuredmedia'];
                const featuredImageLink = fm && fm.length ? fm[0].href : '';
                let imageUrl;
                if(featuredImageLink){
                    const featuredImageResponse = await fetch(featuredImageLink);
                    const featuredImageData = await featuredImageResponse.json();
                    imageUrl = featuredImageData.source_url;
                }

                return `<a class="post type-events  has-thumb" href="${post.link}" data-id="${post.id}">
                    <div class="media">
                        ${imageUrl ? `<img decoding="async" src="${imageUrl}" alt="${post.title.rendered}">` : ''}
                    </div>
                    <div class="info">
                        <div class="date">${dateFormat(new Date(post.date))}</div>
                        <h4>${post.title.rendered}</h4>
                    </div>
                </a>`;
            }));
            if(useOffset) block.querySelector('.posts').innerHTML += postsHTML.join('')
            else block.querySelector('.posts').innerHTML = postsHTML.join('');
            loading = false;
        }
        if(loadMore) loadMore.addEventListener('click', async () => {
            if(selectedTaxonomy) {
                loadPosts(true, selectedTaxonomy.taxonomy, selectedTaxonomy.term);
            } 
            else {
                loadPosts(true);
            }
        });

        terms.forEach((term) => {
            term.addEventListener('click', async (e) => {
                e.preventDefault();
                if(selectedTaxonomy && selectedTaxonomy.term === term.getAttribute('data-term-id')){
                    selectedTaxonomy = null;
                    term.classList.remove('active');
                    loadPosts(false);
                    return;
                }
                terms.forEach((t) => {
                    t.classList.remove('active');
                });
                term.classList.add('active');
                 selectedTaxonomy = {
                    taxonomy: term.getAttribute('data-taxonomy'),
                    term: term.getAttribute('data-term-id')
                }
                loadPosts(false, selectedTaxonomy.taxonomy, selectedTaxonomy.term);
            });
        });

        const eventsTypePicker = block.querySelector('.events-type-picker');
        if(eventsTypePicker){
            const types = [...eventsTypePicker.querySelectorAll('li')];
            types.forEach((type) => {
                type.addEventListener('click', async (e) => {
                    type.classList.add('active');
                    types.forEach((t) => {
                        if(t !== type){
                            t.classList.remove('active');
                        }
                    });
                    const filter = type.getAttribute('data-filter');
                    const postsList = posts.querySelectorAll('.post');
                    if(filter === 'all'){
                        postsList.forEach((post) => {
                            post.classList.remove('hidden');
                        });
                    } else if(filter === 'local'){
                        postsList.forEach((post) => {
                            if(!post.querySelector('.term-remote')){
                                post.classList.remove('hidden');
                            } else {
                                post.classList.add('hidden');
                            }
                        });
                    } else {
                        postsList.forEach((post) => {
                            if(post.querySelector(`.term-remote`)){
                                post.classList.remove('hidden');
                            } else {
                                post.classList.add('hidden');
                            }
                        });
                    }
                });
            });
        }
    });
})();