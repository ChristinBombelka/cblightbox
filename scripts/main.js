$(function() {
    $(".js-lightbox").cblightbox({
        margin: [100, 60, 50, 60],
        openCloseEffect: 'zoom',
        openCloseDuration: 1000,
        slideEffect: 'slide',
        slideDuration: 300,
        zoom: true,
        zoomOffset : 0,
        captionPosition: 'outside',
        zoomButtons: true,
        zoomMap: true,
        zoomFactor: 1.5,
     });

    $(".js-lightbox-fade").cblightbox({
        margin: [60, 60],
        openCloseEffect: 'fade',
        openCloseDuration: 1000,
        slideDuration: 500,
        zoom: true,
        zoomButtons: true,
        zoomMap: true
    });
});
