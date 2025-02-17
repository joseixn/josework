(()=>{
    const blocks = document.querySelectorAll('.block__tlb-team');

    blocks.forEach((block) => {
        let selected = 0;
        const items = block.querySelectorAll('.team .member');
        const dots = block.querySelectorAll('.navigation .dots a');


        const select = (index) => {
            selected = index;
            if(selected < 0) selected = items.length - 1;
            if(selected >= items.length) selected = 0;
            items.forEach((item) => item.classList.remove('selected'));
            dots.forEach((dot) => dot.classList.remove('selected'));
            items[selected].classList.add('selected');
            dots[selected].classList.add('selected');
            const selectedItem = items[selected];
            // get scroll position 
            const scrollPosition = selectedItem.offsetLeft;
            console.log(selectedItem.offsetLeft);
            block.querySelector('.team').scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        }

        select(selected);

        const next = block.querySelector('.navigation .next');
        const prev = block.querySelector('.navigation .prev');

        next.addEventListener('click', (e) =>{
            e.preventDefault();
            select(selected + 1);
        });

        prev.addEventListener('click', (e) =>{
            e.preventDefault();
            select(selected - 1);
        });

    });

})();