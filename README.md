# cblightbox

Simple and fast image lightbox. 
Features: 
- Responsive
- Image Zoom
- Image Zoom Map
- Iframe ready
- Nice open/close/slide effects

## Get Started

 ```html
<html>
<head>
<link type="text/css" href="styles/cblightbox.css" rel="stylesheet">
</head>
<body>

<a href="image.jpg" class="js-cblightbox" data-group="gallery" data-width="1000" data-height="1500" data-caption="Lorm ypsum"><img src="thumb.jpg"></a>

<script type="text/javascript" src="scripts/jquery-1.11.0.min.js"></script>
<script type="text/javascript" src="scripts/cblightbox.js"></script>
<script>
$(".js-cblightbox").cblightbox();
</script>
</body>
</html>
 ```
## Options

```js
{
    maxHeight: 9999,
    /*  Values: number
     *  Limit image height
     */
    maxWidth: 9999,
    /*   Values: number
     *   Limit image maxWidth
     */
    margin: 40,
    /*  Values: 40, [40, 40], [40, 40, 40, 40]
     *  Margin to screen border
     */
    mobilemargin: 0,
    /*  Values 10, [10, 10], [10, 10, 10, 10]
     *  Margin to screen border on mobilemargin
     */
    zoom: false,
    /*  Values: true, false
     *  Zoom into image, the image must be bigger as the screen
     */
    zoomDuration: 300,
    /*  Values: number
     *  Animation speed to zoom into images
     */
    zoomOffset: 0,
    /*  Value: number
     *   Offset Position on zoomed
     */
    zoomControlls: false,
    /* Value: true, false
     * Show zoom Buttons
     */
    zoomMap: false,
    /* Value: true, false
     * Show small image with zoom area
     */
    disableOnMobile: false,
    /*  Values: true, false
     *  Disable lightbox on "breakpoint"
     */
    breakpoint: 800,
    /*  Values: number
     *  Mobile breakpoint to use mobile margins
     */
    counter: true,
    /*  Values: true, false
     *  Display a counter with current and total slides
     */
    captionPosition: 'outside',
    /*  Values: outside, inside
     *  Caption position in Template
     */
    openCloseEffect: 'fade',
    /*  Values: zoom, fade
     *  Open/Close animation effect
     */
    openCloseDuration: 250,
    /*  Values: number
     *  Open/Close animation speed in ms
     */
    slideEffect: 'fade',
    /* Values: fade, slide
     * Slide animation effect
     */
    slideDuration: 250,
    /*  Values: number
     *  Prev/Next animation speed
     */
    previewSource: false,
    /* Values: string
     * Set preview source for lazyloaded images - previewSource: 'data-original' - this value are display when the preview image is empty or a base64 image
     */
    slideDraggable: true,
    /* Values: true, false
     * Dragging image to slide prev/next
     */
}
```


## Events

### afterInit

Fired when lightbox is initialized

`afterInit: function(container){}`

### afterFit

Fired when lightbox is fit image

`afterFit: function(container, slide){}`

### afterSlide

Fired after slide complete

`afterSlide: function(container, slide){}`

### beforeOpen

Fired before open

`beforeOpen: function(container, slide){}`

### aftereOpen

Fired after open

`aftereOpen: function(container, slide){}`

### beforeClose

Fired before close

`beforeClose: function(container){}`

### afterClose

Fired after close

`afterClose: function(container){}`

### onResize

Fired on resize window

`onResize: function(container, slide){}`