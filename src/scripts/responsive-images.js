const {default: parseSourceSet} = require('@prettier/parse-srcset');

(()=>{
    const holding = [];
    let styleLoaded = false;
    const style = document.querySelector('style');
    const observing = new Set();
    document.addEventListener('DOMContentLoaded', ()=>{
        styleLoaded = true;
        holding.forEach(({node,srcset})=>{
            monitorNode(node,srcset);
        });
    });

    const preloadImageAsBlobUrl = async (url)=>{
        const req = fetch(url);
        const res = await req;
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    }

    const fixNode = async (node,srcset, preload)=>{
        if(!srcset) return;
        const style = window.getComputedStyle(node);

        const srcSet = parseSourceSet(srcset);
        srcSet.sort((a,b)=>a.width?.value - b.width?.value); 
        
        const srcForWidth = (w)=>{
            for(let i = 0; i < srcSet.length; i++){
                if(srcSet[i].width && srcSet[i].width.value >= w*window.devicePixelRatio){
                    return srcSet[i].source.value;
                }
            }
            return srcSet[srcSet.length - 1].source.value;
        }

        if(style.objectFit == 'cover' || style.objectFit == 'contain'){
            const parent = node.parentElement;
            const width = parent.offsetWidth||window.innerWidth;
            node.setAttribute('data-responsive-width', width);
            let url = srcForWidth(width);
            // if(preload){
            //     url = await preloadImageAsBlobUrl(srcForWidth(width));
            // }
            node.src = url; 
        }
        else {
            const width = node.offsetWidth||window.innerWidth;
            node.setAttribute('data-responsive-width', width);
            let url = srcForWidth(width);
            // if(preload){
            //     url = await preloadImageAsBlobUrl(srcForWidth(width));
            // }
            node.src = url; 
        }
        
        
        
    }

    const monitorNode = (node, srcset)=>{
        fixNode(node,srcset);
        if(observing.has(node)) return;
        let timeout;
        const observer = new ResizeObserver(()=>{
            clearTimeout(timeout);
            timeout = setTimeout(()=>{
                fixNode(node,srcset, true);
            }, 500);
        });
        observer.observe(node);
    }
    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
    for (const mutation of mutationList) {
        for(const node of mutation.addedNodes){
            if(node.nodeName === 'IMG'){
                if(document.contains(node) && node.hasAttribute('srcset') && node.getAttribute('srcset') != ''){
                    // node.width = node.innerWidth;
                    node.removeAttribute('width');
                    node.removeAttribute('height');
                    node.removeAttribute('sizes');
                    node.removeAttribute('src');
                    const srcset = node.getAttribute('srcset');
                    node.removeAttribute('srcset');
                    node.setAttribute('data-responsive-srcset', srcset);
                    node.setAttribute('data-responsive-loaded', '');
                    if(styleLoaded){
                        monitorNode(node,srcset);
                    }
                    else {
                        holding.push({node, srcset});
                    }

                
                }
                
            }
        }
    }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(document.querySelector('html'), { childList: true, subtree: true });


    document.addEventListener('DOMContentLoaded', ()=>{
        // Later, you can stop observing
        observer.disconnect();
    });
})();


