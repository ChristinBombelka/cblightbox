<?php

$images = array();

$image = new stdClass();
$image->preview = 'thumbs/Foto_154_s.jpg';
$image->image = 'images/Foto_154.jpg';
$image->caption = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. ';
$images[] = $image;

$image = new stdClass();
$image->preview = 'thumbs/Foto_156_s.jpg';
$image->image = 'images/Foto_156.jpg';
$image->caption = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr';
$images[] = $image;

$image = new stdClass();
$image->preview = 'thumbs/Foto_163_s.jpg';
$image->image = 'images/Foto_163.jpg';
$image->caption = 'tempor invidunt ut labore et';
$images[] = $image;

$images2 = array();

$image = new stdClass();
$image->preview = 'thumbs/Foto_161_s.jpg';
$image->image = 'images/Foto_161.jpg';
$image->caption = 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr';
$images2[] = $image;

$image = new stdClass();
$image->preview = 'thumbs/Foto_163_s.jpg';
$image->image = 'images/Foto_163.jpg';
$image->caption = 'tempor invidunt ut labore et';
$images2[] = $image;

?>

<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="de">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge" />
	<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, user-scalable=yes">
	<link  type="text/css" href="styles/cblightbox.css" rel="stylesheet"></link >
	<link  type="text/css" href="styles/style.css" rel="stylesheet"></link >
</head>
<body>

<div class="block">
	<div class="block-title">Images with zoom effect</div>
	<div class="images">
<?php
foreach($images as $aImage){
$imagesize = getimagesize($aImage->image);
if($imagesize[0] < $imagesize[1]){
	$orientation = 'portrait';
}else{
	$orientation = 'landscape';
}
echo '<a href="'.$aImage->image.'" class="image js-lightbox '.$orientation.'" data-group="gallery_1" data-caption="'.$aImage->caption.'" data-width="'.$imagesize[0].'" data-height="'.$imagesize[1].'"><img src="'.$aImage->preview.'"></a>';
}
?>
	</div>
</div>

<div class="block">
	<div class="block-title">Images with fade effect</div>
	<div class="images">
<?php
foreach($images2 as $aImage){
$imagesize = getimagesize($aImage->image);
if($imagesize[0] < $imagesize[1]){
	$orientation = 'portrait';
}else{
	$orientation = 'landscape';
}
echo '<a href="'.$aImage->image.'" class="image js-lightbox-fade '.$orientation.'" data-group="gallery_2" data-caption="'.$aImage->caption.'" data-width="'.$imagesize[0].'" data-height="'.$imagesize[1].'"><img src="'.$aImage->preview.'"></a>';
}
?>
	</div>
</div>

<div class="block">
	<div class="block-title">Iframe</div>
	<div class="images">
		<a href="https://www.youtube.com/embed/EUX6lXTX9zQ" class="js-lightbox" data-width="1920" data-height="1080">Iframe</a>
	</div>
</div>

<div class="block">
	<div class="block-title">Broken images</div>
	<div class="images">
		<a href="" class="image js-lightbox-fade landscape" data-group="" data-caption="" data-width="2400" data-height="1600"><img src="thumbs/Foto_161_s.jpg"></a>
	</div>
</div>

	<script type="text/javascript" src="scripts/jquery1.11.1.min.js"></script>
	<script type="text/javascript" src="scripts/cblightbox.js"></script>
	<script type="text/javascript" src="scripts/main.js"></script>
</body>
</html>
