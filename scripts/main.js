$(function() {
    $(".js-lightbox-fade").cblightbox({
        'margin': [60, 60],
        'animationDuration': 250,
        'slideDuration': 250,
        'zoom': false,
        'animationEffect': 'fade'
    });

    $(".js-lightbox").cblightbox({
        'margin': [20, 20],
        'animationDuration': 1000,
        'slideDuration': 500,
        'zoom': true,
        'animationEffect': 'zoom'
    });


});
