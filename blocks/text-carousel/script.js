$(document).ready(()=>{
    console.log('Ready');
    
    $('.block__anatomy-text-carousel').each(function(){
        $(this).find('.slick').slick({
            slidesToShow: 1,
            autoplaySpeed: 6000,
            autoplay: true,
            dots: true,
            centerMode: true,
            arrows: false,
            variableWidth: true,
        });
    });
});