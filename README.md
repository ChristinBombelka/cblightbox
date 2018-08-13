# cblightbox

Open image in a overlayer lightbox. The Lightbox have a zoom function, to zoom into a large image.

## Get Started

 ```html
<html>
<head>
<link type="text/css" href="styles/cblightbox.css" rel="stylesheet">
</head>
<body>

<a href="image.jpg" class="js-cblightbox" data-cblightbox="gallery" data-caption="Lorm ypsum"><img src="thumb.jpg"></a>

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
    animationEffect: 'zoom',
    /*  Values: zoom, fade
     *  Open/Close animation effect
     */
    animationDuration: 500,
    /*  Values: number
     *  Open/Close animation speed in ms
     */
    animationFade: 500,
    /*  Values: number
     *  Prev/Next animation speed
     */
}
```


## Events

### lightboxIsInit

Fired when lightbox is initialized

`lightboxIsInit: function(container)`
