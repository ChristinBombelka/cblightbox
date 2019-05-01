$(function() {
    $(".js-lightbox-fade").cblightbox({
        'margin': [60, 60],
        'openCloseEffect': 'fade',
        'openCloseDuration': 1000,
        'slideDuration': 500,
        'zoom': false,
    });

    $(".js-lightbox").cblightbox({
        'margin': [60, 100],
        'openCloseEffect': 'zoom',
        'openCloseDuration': 1000,
        'slideEffect': 'slide',
        'slideDuration': 500,
        'zoom': true,
        'zoomOffset' : 0,
        'previewSource' : 'data-original',       
    });
});
