(()=>{
    document.addEventListener('DOMContentLoaded', () => {
        const blocks = document.querySelectorAll('.block__anatomy-stats');
        blocks.forEach((block) => {
            let currentIndex = 0;
            const stats = block.querySelectorAll('.stat');

            const buttonNext = block.querySelector('.btn-next');
            const buttonPrev = block.querySelector('.btn-prev');

            const setWrapperWidth = (animate)=>{
                // get width of first 3 stats
                const first3 = Array.from(stats).slice(currentIndex, 3+currentIndex);
                const width = first3.reduce((acc, stat)=>{
                    return acc + stat.offsetWidth;
                }, 0) + ((first3.length - 1)*16);

                const holder = block.querySelector('.stats-holder');
                if(!animate) {
                    holder.style.minWidth = width + 'px';
                    holder.style.maxWidth = width + 'px';
                } else {
                    gsap.to(holder, {maxWidth: width, minWidth:width, duration: 0.5});
                }
            }
            const resizeStats = ()=>{
                stats.forEach((stat)=>{
                    const number = stat.querySelector('.number');
                    const label = stat.querySelector('.label');
                    label.style.width = Math.max(140, number.offsetWidth) + 'px';
                });

                setWrapperWidth();
    
            }

            const scrollToIndex = ()=>{
                const selectedStat = stats[currentIndex];
                const holder = block.querySelector('.stats-holder');
                const moveTo = selectedStat.offsetLeft;
                console.log(moveTo);
                gsap.to(holder, {scrollTo: {x: moveTo, y:0}, duration: 0.5});

            }

            const setVisibleButtons = (animate)=>{
                if(currentIndex === 0) {
                    if(!animate) {
                        buttonPrev.style.pointerEvents = 'none';
                        buttonPrev.style.opacity = 0;
                    }
                    else gsap.to(buttonPrev, {
                        opacity:0,
                    }, 0.5).then(()=>{
                        buttonPrev.style.pointerEvents = 'none';
                    });
                } else {
                    if(buttonPrev.style.pointerEvents === 'none') {
                        buttonPrev.style.pointerEvents = 'auto';
                        if(!animate) {
                            opacity:0;
                        }
                        else gsap.to(buttonPrev, {
                            opacity:1,
                        }, 0.5);
                    }
                }

                if(currentIndex === stats.length - 3) {
                    if(!animate) {
                        buttonNext.style.pointerEvents = 'none';
                        buttonNext.style.opacity = 0;
                    }
                    else gsap.to(buttonNext, {
                        opacity:0,
                    }, 0.5).then(()=>{
                        buttonNext.style.pointerEvents = 'none';
                    });
                } else {
                    if(buttonNext.style.pointerEvents === 'none') {
                        buttonNext.style.pointerEvents = 'auto';
                        if(!animate) {
                            opacity:0;
                        }
                        else gsap.to(buttonNext, {
                            opacity:1,
                        }, 0.5);
                    }
                }
            }
            window.addEventListener('resize', resizeStats);
            // also on font load
            document.fonts.ready.then(resizeStats);
            resizeStats();

            setVisibleButtons(false);


            const next = ()=>{
                if(currentIndex < stats.length - 3) {
                    currentIndex++;
                    setWrapperWidth(true);
                    scrollToIndex();
                    setVisibleButtons(true);
                }
            }
            const prev = ()=>{
                if(currentIndex > 0) {
                    currentIndex--;
                    setWrapperWidth(true);
                    scrollToIndex();
                    setVisibleButtons(true);
                }
            }
            buttonNext.addEventListener('click', next);
            buttonPrev.addEventListener('click', prev);
            
        });
    });
})();