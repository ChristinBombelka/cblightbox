/*
 * CBLightbox 3.9.0 jQuery
 * 2019-05-19
 * Copyright Christin Bombelka
 * https://github.com/ChristinBombelka/cblightbox
 */

(function($){
	var caption,
		closing,
		slideing = false;

	$.fn.cblightbox = function(options){

		function cleanDom(){
			return $('html').width();
		}

		function is_touch_device() {
			return (('ontouchstart' in window)  || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
		}

		if(is_touch_device()){
			$("html").addClass("cb-lightbox-touch");
		}

		//calc screenBorderWidth
		if(!$(".cb-lightbox-margin").length){
			var scrollWidth = window.innerWidth - $(window).outerWidth();
			$("<style type='text/css'>.cb-lightbox-margin{margin-right:"+scrollWidth+"px;}</style>").appendTo($("head"));
		}

		var defaults = {
			maxHeight: 9999,
			maxWidth: 9999,
			margin: 40,
			mobilemargin: 0,
			zoom : false,
			zoomDuration : 300,
			zoomOffset : 0,
			breakpoint : 800,
			counter : true,
			captionPosition : 'outside', //inside, outside
			openCloseEffect : 'fade', //fade, zoom
			openCloseDuration : 250,
			slideDuration: 250,
			slideEffect: 'fade', //slide, fade
			previewSource: false, //define preview image source on use lazyloading
			dragSlide: true,
			afterInit: $.noop,
			afterFit: $.noop,
			afterSlide: $.noop,
			beforeOpen: $.noop,
			afterOpen: $.noop,
			beforeClose: $.noop,
			afterClose: $.noop,
		}

		function error(container){
			$('<div class="cb-lightbox-error">Sorry, this image can\'t loaded!</div>').appendTo(container.find('.cb-lightbox-content'));

			var $s = container.data('settings');

			_animate(container, false, $s.openCloseDuration);
			_animate(container.find('.cb-lightbox-content'), false, $s.openCloseDuration);

			setTimeout(function(){
				container.addClass('cb-lightbox-is-open');

				container
					.removeClass('cb-lightbox-is-loading')
					.addClass('cb-lightbox-error-show');
			});
		}

		function setTranslate(el, values){
			var str = '',
				css = {};

			if(values.top !== undefined || values.left !== undefined){
				str = (values.left === undefined ? el.position().left : values.left) + 'px, ' + (values.top === undefined ? el.position().top : values.top) + 'px';
				str = 'translate3d(' + str + ', 0px)';

				el.data('lastTransform', {x: values.left, y: values.top});
			}

			if(values.scaleX && values.scaleY){
				str = (str.length ? str + ' ' : '') + 'scale(' + values.scaleX + ', ' + values.scaleY + ')';
			}

			if (str.length) {
                css.transform = str;
            }

            if(values.width !== undefined){
            	css.width = values.width;
            }

            if(values.height !== undefined){
            	css.height = values.height;
            }

            if(values.opacity !== undefined){
            	css.opacity = values.opacity;
            }

           	return el.css(css);
		}

		function _animateEnd(el, to){
			el.css('transition-duration', '');

			if(el.closest('.cb-lightbox').hasClass('cb-lightbox-is-closing')){
				return;
			}

			if(to.scaleX !== undefined && to.scaleY !== undefined){
				image = el.find(".cb-lightbox-image");

				if(to.toWidth && to.toHeight){
					to.width = to.toWidth;
					to.height = to.toHeight
				}else if($('.cb-lightbox-is-zoomed').length && image.data('width') && image.data('height')){
					to.width = image.data('width');
					to.height = image.data('height');
				}else{
					to.width = $('.cb-lightbox-slide-current').data('fitWidth');
					to.height = $('.cb-lightbox-slide-current').data('fitHeight');
				}

				to.scaleX = 1;
				to.scaleY = 1;

				setTranslate(el, to);
			}
		}

		function _animate(el, to, duration){
			el.css('transition-duration', duration + 'ms');

			setTranslate(el, to);

			clearTimeout(el.data('timer'));

			el.data('timer', setTimeout(function(){
				_animateEnd(el, to);
			}, duration + 20));
		}

		function initDraggable(userX, userY){
	    	if($(".cb-lightbox").hasClass("cb-lightbox-is-zoomed") || $('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
	    		return;
	    	}

	    	if(closing){
	    		return;
	    	}

	    	$(".cb-lightbox").addClass("cb-lightbox-is-zoomed");
	    	$(".cb-lightbox-slide").addClass("cb-lightbox-draggable-init");

	        var slide = $('.cb-lightbox-slide'),
				$s = $('.cb-lightbox').data('settings'),
	        	image = slide.find(".cb-lightbox-image"),
	        	clickX = userX / slide.width(),
				clickY = userY / slide.height();

			captionHide($s, slide.find('.cb-lightbox-caption'));

			if(image.data('width') > $(window).width()){
				var positionX = Math.max(image.data('width') * clickX - ($(window).width() / 2) - $s.zoomOffset[3], -$s.zoomOffset[3]);
					positionX = -Math.min(image.data('width') - $(window).width() + $s.zoomOffset[1], positionX);
			}else{
				var positionX = ($(window).width() - image.data('width')) / 2;
			}

			if(image.data('height') > $(window).height()){
				var positionY = Math.max(image.data('height') * clickY - ($(window).height() / 2) - $s.zoomOffset[0], -$s.zoomOffset[0]),
					positionY = -Math.min(image.data('height') - $(window).height() + $s.zoomOffset[2], positionY);
			}else{
				var positionY = ($(window).height() - image.data('height')) / 2;
			}

			scaleWidth = image.data('width') / image.width();
	        scaleHeight = image.data('height') / image.height();

			_animate(slide, {
				top: positionY,
				left: positionX,
				scaleX: scaleWidth,
				scaleY: scaleHeight
			}, $s.zoomDuration);
	    }

	    function detroyDraggable(disableAnimation){
	    	var container = $(".cb-lightbox"),
	    		slide = $(".cb-lightbox-slide");

	    	if(!container.length || !slide.length){
	    		return;
	    	}

			var $s = slide.closest('.cb-lightbox').data('settings'),
				image = slide.find('.cb-lightbox-image'),
				duration = $s.zoomDuration;

			if(!container.hasClass("cb-lightbox-is-zoomed")){
				return;
			}

	    	if(!slide.hasClass("cb-lightbox-draggable-init")){
	    		return;
	    	}

	    	var	scaleWidth = slide.data('fitWidth') / image.width(),
	       		scaleHeight = slide.data('fitHeight') / image.height();

	    	if(typeof disableAnimation !== 'undefined'){
	    		duration = 0;
	    		disableAnimation = false;
	    	}

    		_animate(slide, {
    			toWidth: slide.data('fitWidth'),
				toHeight: slide.data('fitHeight'),
				top: slide.data('fitTop'),
				left: slide.data('fitLeft'),
				scaleX: scaleWidth,
				scaleY: scaleHeight
			}, duration);

    		setTimeout(function(){
    			captionShow(slide);
    		}, duration + 30);

    		container.removeClass("cb-lightbox-is-zoomed")
    		slide.removeClass("cb-lightbox-draggable-init");
	    }

	    function captionShow(slide){
	    	if(!$(".cb-lightbox").hasClass("cb-lightbox-is-zoomed")){
	    		if(typeof slide === "undefined" && !slide){
	    			var slide = $('.cb-lightbox-slide-current');
	    		}

	    		slide.find('.cb-lightbox-caption').removeClass('cb-lightbox-caption-hide');
	    	}
	    }

	    function captionHide($s, slideCaption){
	    	if($s.captionPosition == 'inside'){
	    		slideCaption.addClass('cb-lightbox-caption-hide');
	    	}
	    }

	    function updateCaption(item, slide, $s){
	    	var caption = item.data("caption"),
				captionTpl = $("<div class='cb-lightbox-caption'>"+ caption +"</div>");

			if($s.captionPosition == 'inside'){

				$(".cb-lightbox-slide").addClass('cb-lightbox-slide-with-caption');

				if(!slide){
					var slide = $('.cb-lightbox-slide-current');
				}

				var addTo = slide;

			}else{
				$(".cb-lightbox-caption").remove();

				var addTo = $(".cb-lightbox-info");
			}

			if(caption){
				var slideCaption = captionTpl.appendTo(addTo);

				captionHide($s, slideCaption);
			}
		}

		function getImageSize(el, img, callback) {
		    var $img = $(img);

		    if(el.data('width') && el.data('height')){
		    	callback.apply(this, [el.data('width'), el.data('height')]);
		    }else{
		    	var wait = setInterval(function() {
			        var w = $img[0].naturalWidth,
			            h = $img[0].naturalHeight;
			        if (w && h) {
			            clearInterval(wait);
			            callback.apply(this, [w, h]);
			        }
			    }, 50);
			}
		}

		function setImage(slide, source, item){
			var elementPlaceholder = slide.find('.cb-lightbox-image-placeholder'),
				container = $('.cb-lightbox'),
				loadingTimeout;

			var $img = $('<img />').one('error', function(){
				$img.remove();
				elementPlaceholder.remove();
				error(container);
			}).one('load', function(e){

				clearTimeout(loadingTimeout);

				slide.removeClass('cb-lightbox-hide-image');

				imageHeight = $(this).data('height') || this.naturalHeight;

				setTimeout(function(){
					elementPlaceholder.hide();
					container.removeClass('cb-lightbox-is-loading');
				}, Math.min( 300, Math.max( 1000, imageHeight / 1600 )));
			})
				.addClass('cb-lightbox-image')
				.attr('src', source)
				.appendTo(slide.find('.cb-lightbox-slide-image'));

			if(($img[0].complete || $img[0].readyState == 'complete') && $img[0].naturalWidth && $img[0].naturalHeight){
				elementPlaceholder.hide();
				container.removeClass('cb-lightbox-is-loading');
				slide.removeClass('cb-lightbox-hide-image');
			}else{
				loadingTimeout = setTimeout(function(){
					container.addClass('cb-lightbox-is-loading');
				}, 100);
			}

			getImageSize(item, $img, function(width, height){
				$img.data({
					'width': width,
					'height': height,
				});
			});
		}

		function getSlide(source, i, item, fitAndShow, direction, effect){

			if(typeof effect === "undefined"){
	    		effect = false;
	    	}

			if(typeof fitAndShow === "undefined"){
				fitAndShow = false;
			}

			if(typeof i != "undefined"){
				$(".counter-current").text(i + 1);
			}

			if(typeof item == "undefined"){
				item = $('a[href="' + source + '"]');
			}

			var container = $('.cb-lightbox'),
				$s = container.data('settings'),
				placeholderImage;

			$(".cb-lightbox-is-selected").removeClass("cb-lightbox-is-selected");
			item.addClass("cb-lightbox-is-selected");

			if(source.match(/(^data:image\/[a-z0-9+\/=]*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg|ico)((\?|#).*)?$)/i) ) {
                type = 'image';
            }else if(source){
            	type = 'iframe';
            }else{
				error(container);
				return;
			}

			var slide = $('<div class="cb-lightbox-slide cb-lightbox-slide-current"></div>'),
				wrapImage = $('<div class="cb-lightbox-slide-image"></div>');

			wrapImage.appendTo(slide);
			slide.appendTo($('.cb-lightbox-slides'));
			slide.data('type', type);
			slide.addClass('cb-lightbox-hide-image');

			updateCaption(item, slide, $s);

			$('.cb-lightbox-error').remove();
			$('.cb-lightbox-content').removeClass('cb-lightbox-error-show');

			if(type == "image"){

				var previewImage = item.find('img');

				if(previewImage.length && previewImage.attr('src') && previewImage.attr('src').substr(0, 21) != 'data:image/png;base64'){
					placeholderImage = item.find('img').attr('src');
				}else if($s.previewSource){
					placeholderImage = item.find('img').attr( $s.previewSource );
				}else{
					placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
				}

				var elementPlaceholder = $('<img />');

				elementPlaceholder
					.addClass('cb-lightbox-image-placeholder')
					.attr('src', placeholderImage)
					.appendTo(wrapImage);

				if(!elementPlaceholder[0].naturalWidth && !elementPlaceholder[0].naturalHeight && !elementPlaceholder[0].complete){
					elementPlaceholder.hide();
				}

				elementPlaceholder.one('error', function(){
					elementPlaceholder.remove();
					setImage(slide, source, item);

				}).one('load', function(){

					elementPlaceholder.fadeIn(250);
					setImage(slide, source, item);
				});

			}else if(type == "iframe"){

				slide.removeClass('cb-lightbox-hide-image');

				var iframe = $('<iframe src="" class="cb-lightbox-image cb-lightbox-iframe" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen=""></iframe>').appendTo(wrapImage);

				container.addClass('cb-lightbox-is-loading');

				iframe
					.attr("src", source)
					.data({
						'width': item.data('width') ? item.data('width') : 16  ,
						'height': item.data('height') ? item.data('height') : 9,
					});

				iframe.on("load", function(){
					container.removeClass('cb-lightbox-is-loading');
				});
			}

			if(fitAndShow){
				//wait for imagesize;
				var wait = setInterval(function() {
			        if (slide.find('.cb-lightbox-image').data('height') !== undefined) {
			            initFitAndShow();
			            clearInterval(wait);
			        }
			    }, 50);
			}

			function initFitAndShow(){
				var values = fitImage(slide);

				setTranslate(slide, {
					width: values.width,
					height: values.height,
				});

				if(slide.hasClass('cb-lightbox-image-remove')){
					_animateEnd(slide, false);

					setTranslate(slide, {
						top: values.top,
						opacity: 0,
					});

					return;
				}

				if($s.slideEffect == 'slide' || effect == 'slide'){

					var currentLeft = ($(window).width() - slide.width()) / 2;

					if(direction == 'previews'){
						var slideIn = -(slide.width() + currentLeft);
					}else{
						var slideIn = currentLeft + $(window).width();
					}

					setTranslate(slide, {
						top: values.top,
						left: slideIn,
						opacity: 0,
					});

					setTimeout(function(){
						_animate(slide, {
							left: values.left,
							opacity: 1,
						},  $s.slideDuration);
					}, 20);

					captionShow(slide);

				}else{
					setTranslate(slide, {
						top: values.top,
						left: values.left,
						opacity: 0
					});

					setTimeout(function(){
						_animate(slide, {
							opacity: 1,
						},  $s.slideDuration);
					}, 20);

					captionShow(slide);
				}

				setTimeout(function(){
					if ($.isFunction($s.afterSlide)) {
				 	   $s.afterSlide.call(this, container, slide);
					}
				}, $s.slideDuration + 30);
			}

			return slide;
		}

		function open(item, $s){
			var source = item.attr('href'),
				slide = getSlide(source, false, item, false, false),
				container = $('.cb-lightbox');

			//wait for imagesize;
			var wait = setInterval(function() {
				if(typeof slide === "undefined"){
					clearInterval(wait);
					return;
				}

		        if (slide.find('.cb-lightbox-image').data('height') !== undefined) {
		            openStart();
		            clearInterval(wait);
		        }
		    }, 50);

			function openStart(){

				if ($.isFunction($s.beforeOpen)) {
				 	$s.beforeOpen.call(this, container, slide);
				}

				_animate(container, false, $s.openCloseDuration);
				_animate(container.find('.cb-lightbox-content'), false, $s.openCloseDuration);

				container.addClass('cb-lightbox-is-opening cb-lightbox-show-info cb-lightbox-show-buttons');

				if(slide && $s.openCloseEffect == 'zoom'){
					var previewImage = item.find('img');

					if(!previewImage.length){
						previewImage = item;
					}

					var	offsetTop = previewImage.offset().top - $(window).scrollTop(),
						offsetLeft = previewImage.offset().left;

					setTranslate(slide, {
						width: previewImage.width(),
						height: previewImage.height(),
						top: offsetTop,
						left: offsetLeft,
					});

					var values = fitImage(slide);

					_animate(slide, {
						top: values.top,
						left: values.left,
						scaleX: values.scaleX,
						scaleY: values.scaleY
					}, $s.openCloseDuration);

					setTimeout(function(){
						captionShow(slide);
					}, $s.openCloseDuration + 30);

				}else if(slide && $s.openCloseEffect == 'fade'){

					var values = fitImage(slide);

					setTranslate(slide, {
						width: values.width,
						height: values.height,
						top: values.top,
						left: values.left,
						opacity: 0
					});

					setTimeout(function(){
						_animate(slide, {
							opacity: 1,
						}, $s.openCloseDuration);
					}, 20);

					setTimeout(function(){
						captionShow(slide);
					});
				}

				setTimeout(function(){
					if(closing){
						return;
					}

					container.removeClass('cb-lightbox-is-opening').addClass('cb-lightbox-is-open');
				}, $s.openCloseDuration);

				setTimeout(function(){
					if ($.isFunction($s.afterOpen)) {
				 	   $s.afterOpen.call(this, container, slide);
					}
				}, $s.openCloseDuration + 30);
			}
		}

		function close(){
			closing = true;

			var el = $(".cb-lightbox-is-selected"),
				previewImage = el.find('img'),
				container = $('.cb-lightbox'),
				$s = container.data('settings'),
				slide = container.find('.cb-lightbox-slide.cb-lightbox-slide-current');

			if ($.isFunction($s.beforeClose)) {
				$s.beforeClose.call(this, container);
			}

			if(!previewImage.length){
				previewImage = el;
			}

			_animate(container, false, $s.openCloseDuration);
			_animate(container.find('.cb-lightbox-content'), false, $s.openCloseDuration);

			container
				.removeClass('cb-lightbox-is-open cb-lightbox-is-opening cb-lightbox-show-info cb-lightbox-show-buttons')
				.addClass('cb-lightbox-is-closing');

			if($s.openCloseEffect == 'zoom' && el.is(':visible')){
				var	scaleWidth =  previewImage.width() / slide.width(),
					scaleHeight = previewImage.height() / slide.height(),
					offsetTop = previewImage.offset().top - $(window).scrollTop();
					offsetLeft = previewImage.offset().left;

				captionHide($s, container.find('.cb-lightbox-caption'));

				_animate(slide, {
					top: offsetTop,
					left: offsetLeft,
					scaleX: scaleWidth,
					scaleY: scaleHeight,
				}, $s.openCloseDuration);

			}else if($s.openCloseEffect == 'fade'){

				_animate(slide, {
					opacity: 0,
				}, $s.openCloseDuration);

				$('.cb-lightbox').removeClass('cb-lightbox-is-open');
			}

			setTimeout(function(){
				detroyDraggable();
				$(".cb-lightbox").remove();
				$("html").removeClass("cb-lightbox-lock cb-lightbox-margin");
				el.removeClass('cb-lightbox-is-selected');
				closing = false;

				if ($.isFunction($s.afterClose)) {
				 	$s.afterClose.call(this, container);
				}

			}, $s.openCloseDuration + 20);
		}

		function fitImage(slide){
			var item = $(".cb-lightbox-is-selected"),
				container = $('.cb-lightbox'),
				$s = container.data('settings'),
				img = slide.find('.cb-lightbox-image'),
				type = slide.data('type');

			if(item.find('img').length){
				itemImage = item.find('img');
			}else{
				itemImage = item;
			}

			if(type == 'image'){
				if(typeof img != 'undefined'){
					imgWidth = img.data('width');
					imgHeight = img.data('height');
				}
				else{
					imgWidth = $(".cb-lightbox-image").width();
					imgHeight = $(".cb-lightbox-image").height();
				}
			}else{

				if(item.data('height') && item.data('width')){
					imgHeight = container.height();
					imgWidth = imgHeight / item.data("height") * item.data("width");
				}else{
					//Default 16/9
					imgHeight = container.height();
					imgWidth = imgHeight / 9 * 16;
				}
			}

			var wrapperHeight = container.height() - ($s.margin[0] + $s.margin[2]),
				wrapperWidth = container.width() - ($s.margin[1] + $s.margin[3]);

			var captionHeight = 0;
			if($(".cb-lightbox-info").length){
				captionHeight = $(".cb-lightbox-info").outerHeight();
			}

			if(wrapperHeight - captionHeight < imgHeight || wrapperWidth < imgWidth ) {
				var minRatio = Math.min(1, wrapperWidth / imgWidth, (wrapperHeight - captionHeight) / imgHeight);

				newImgWidth = Math.floor(minRatio * imgWidth);
				newImgHeight = Math.floor(minRatio * imgHeight);
			}
			else{
				newImgWidth = imgWidth;
				newImgHeight = imgHeight;
			}

			positionTop = Math.max(($(window).height() - newImgHeight - captionHeight) / 2, $s.margin[0]);
			positionLeft = (container.width() - newImgWidth) / 2;

			var	scaleWidth = newImgWidth / itemImage.width(),
   				scaleHeight = newImgHeight / itemImage.height();

			slide.data({
	 			'fitHeight': newImgHeight,
	 			'fitWidth': newImgWidth,
	 			'fitLeft': positionLeft,
	 			'fitTop': positionTop
	 		});

			if((imgWidth > $(window).width() || imgHeight > $(window).height()) && $s.zoom){
				slide.addClass('cb-lightbox-draggable');
			}else{
				slide.removeClass('cb-lightbox-draggable');
			}

			if ($.isFunction($s.afterFit)) {
				$s.afterFit.call(this, container, slide);
			}

	 		return {
	 			width: newImgWidth,
	 			height: newImgHeight,
	 			top: positionTop,
	 			left: positionLeft,
	 			scaleX: scaleWidth,
	 			scaleY: scaleHeight
	 		};
		};

		function reposition(){
	    	//reset dragging position
		    var slide = $('.cb-lightbox-slide'),
				$s = slide.closest('.cb-lightbox').data('settings'),
		    	image = slide.find('.cb-lightbox-image'),
		    	lastoffset = slide.data('lastTransform'),
		    	windowWidth = $(window).width(),
		    	windowHeight = $(window).height(),
		    	imageWidth = image.data('width'),
		    	imageHeight = image.data('height');

		    if(!lastoffset){
		    	return;
		    }

		    if(lastoffset.x > $s.zoomOffset[3] && imageWidth > windowWidth){
		    	moveX = $s.zoomOffset[3];
		    }else if(Math.abs(lastoffset.x) - $s.zoomOffset[1] > imageWidth - windowWidth && imageWidth > windowWidth){
		    	moveX = windowWidth - imageWidth - $s.zoomOffset[1];
		    }else{
		    	moveX = lastoffset.x;
		    }

		    if(lastoffset.y > $s.zoomOffset[0] && imageHeight > windowHeight){
		    	moveY = $s.zoomOffset[0];
		    }else if(Math.abs(lastoffset.y) - $s.zoomOffset[2] > imageHeight - windowHeight && imageHeight > windowHeight){
		    	moveY = windowHeight - imageHeight - $s.zoomOffset[2];
		    }
		    else{
		    	moveY = lastoffset.y;
		    }

		    if(lastoffset.x != moveX || lastoffset.y != moveY){
		    	_animate(slide, {
		    		top: moveY,
		    		left: moveX,
		    	}, 250);
		    }
	    }

	    function slideTo(direction, effect){
	    	if(typeof effect === "undefined"){
	    		effect = false;
	    	}

	    	var container = $(".cb-lightbox"),
				$s = container.data('settings'),
	    		group = container.data('group'),
				images = $('a[data-group="'+ group +'"]');

			if(container.hasClass('cb-lightbox-is-zoomed') || slideing || images.length <= 1){
				return;
			}

			slideing = true;

			if(direction == 'previews'){
				_this_index = _this_index - 1;

				if(_this_index < 0){
					_this = images.length - 1;
					_this_index = _this;
				}

			}else if(direction == 'next'){
				_this_index = _this_index + 1;

				if(_this_index > images.length - 1){
					_this_index = 0;
				}
			}

			var slide = $('.cb-lightbox-slide.cb-lightbox-slide-current');
			slide.removeClass('cb-lightbox-slide-current').addClass('cb-lightbox-image-remove');

			if($s.slideEffect == 'slide' || effect == 'slide'){

				var currentLeft = ($(window).width() - slide.width()) / 2;

				if(direction == 'previews'){
					var slideOut = currentLeft + $(window).width();
				}else{
					var slideOut = -(slide.width() + currentLeft);
				}

				_animate(slide, {
					left: slideOut,
					opacity: 0,
				}, $s.slideDuration);
			}else{
				_animate(slide, {
					opacity: 0,
				}, $s.slideDuration);
			}

			setTimeout(function(){
				slide.remove();
			}, $s.slideDuration);

			container.find('.cb-counter-current').text(_this_index + 1);

			new_image = images.eq(_this_index);
			source = new_image.attr('href');

			getSlide(source, _this_index, new_image, true, direction, effect);

			setTimeout(function(){
				slideing = false;
			}, 200)
	    }

	    //global momentum variables
	    var speed = {},
	    	maxSpeedX = 10,
			maxSpeedY = 10,
	    	timeDiff,
	    	distance = {},
	    	lastPoint = {},
			currentPoint = {},
			lastTimeMouseMoved,
			mouseUp = true,
			positionInterval,
			momentTimer,
			slowDownRatio = {},
			slowDownRatioReverse = {},
 			speedDecleration = {},
 			speedDecelerationRatioAbs = {};

		function calculateAnimtionOffset(axis){
			speedDecleration[axis] = speedDecleration[axis] * (slowDownRatio[axis] + slowDownRatioReverse[axis] - slowDownRatioReverse[axis] * timeDiff / 10);
			speedDecelerationRatioAbs[axis] = Math.abs(speed[axis] * speedDecleration[axis]);
			distanceOffset = speed[axis] * speedDecleration[axis] * timeDiff;

			return distanceOffset;
		}

		function getNewBouncePosition(maxMin, current, time, duration){
			return (maxMin - current) * time / duration + current;
		}

	    function logMousePosition(){
			if(mouseUp){
				return;
			}

			//log mouse positions
	       	positionInterval = setTimeout(function(){

		         	currentT = new Date().getTime();
		         	timeDiff = currentT - lastT;

		         	distance = {
		         		x: (currentPoint.x - lastPoint.x) / 1.5,
		         		y: (currentPoint.y - lastPoint.y) / 1.5
		         	};

		         	lastPoint = {
		         		x: currentPoint.x,
		         		y: currentPoint.y
		         	};

					lastT = currentT;

				logMousePosition();
	       	}, 20);
		}

		function initMoveMoment(item){
			var $s = $('.cb-lightbox').data('settings'),
				minX = $s.zoomOffset[3],
				maxX = $(window).width() - item.width() -  $s.zoomOffset[1],
				minY = $s.zoomOffset[0],
				maxY = $(window).height() - item.height() -  $s.zoomOffset[2],
				startTimeX = false,
	 			startTimeY = false;
	 			completeX = false,
	 			completeY = false,
	 			currentImage = $('.cb-lightbox-image'),
	 			setCurrentPointX = false,
	 			setCurrentPointY = false;

 			speedDecleration = {
 				x: 1,
 				y: 1
 			};
 			//stow down
 			slowDownRatio = {
 				x: 0.95,
 				y: 0.95,
 			},
 			slowDownRatioReverse = {
				x: 1 - slowDownRatio.x,
				y: 1 - slowDownRatio.y
			};

			// Speed in px/ms velocity
			speed.x = Math.max(Math.min(distance.x / timeDiff, maxSpeedX), -maxSpeedX);
			speed.y = Math.max(Math.min(distance.y / timeDiff, maxSpeedY), -maxSpeedY);

	 		//min distence to move object
	 		if(Math.abs(distance.x) > 1 || Math.abs(distance.y) > 1){

				function moveMoment(){
					momentTimer = setTimeout(function(){

						if(startTimeX === false){
							speedX = calculateAnimtionOffset('x');
						}

						if(startTimeY === false){
							speedY = calculateAnimtionOffset('y');
						}

						if((Math.abs(speedX) > 0.04 || (currentPoint.x > minX || currentPoint.x < maxX)) && currentImage.data('width') > $(window).width()){
							//In bouncing area left/right
							if(currentPoint.x > minX || currentPoint.x < maxX){
								if(Math.abs(speedX) < 0.06){
									if(startTimeX === false){
										startTimeX = new Date().getTime();
									}

									tX = new Date().getTime() - startTimeX;

									if(tX >= 300){
										//set to end position
										if(currentPoint.x > minX){
											setCurrentPointX = minX;
										}else{
											setCurrentPointX = maxX;
										}

										speedX = 0;
										completeX = true;

									}else{
										if(currentPoint.x > minX){
											setCurrentPointX = getNewBouncePosition(minX, currentPoint.x, tX, 300);
										}else{
											setCurrentPointX = getNewBouncePosition(maxX, currentPoint.x, tX, 300);
										}
									}
								}

								slowDownRatio.x = 0.7;
							}

						}else{
							completeX = true;
						}

						if(!startTimeX){
							setCurrentPointX = currentPoint.x + speedX;
						}

						if((Math.abs(speedY) > 0.04 || (currentPoint.y > minY || currentPoint.y < maxY)) && currentImage.data('height') > $(window).height()){
							//In bouncing area top/bottom
							if(currentPoint.y > minY || currentPoint.y < maxY){

								if(Math.abs(speedY) < 0.06){
									if(startTimeY === false){
										startTimeY = new Date().getTime();
									}

									tY = new Date().getTime() - startTimeY;

									if(tY >= 300){
										//set to end position
										if(currentPoint.y > minY){
											setCurrentPointY = minY;
										}else{
											setCurrentPointY = maxY;
										}

										speedY = 0;
										completeY = true;

									}else{

										if(currentPoint.y > minY){
											setCurrentPointY = getNewBouncePosition(minY, currentPoint.y, tY, 300);
										}else{
											setCurrentPointY = getNewBouncePosition(maxY, currentPoint.y, tY, 300);
										}
									}
								}

								slowDownRatio.y = 0.7;
							}
						}else{
							completeY = true;
						}

						if(!startTimeY){
							setCurrentPointY = currentPoint.y + speedY;
						}

						//set points
						currentPoint.x = setCurrentPointX ? setCurrentPointX : currentPoint.x;
						currentPoint.y = setCurrentPointY ? setCurrentPointY : currentPoint.y;

						//move to points
						setTranslate(item, {
							left: currentPoint.x,
							top: currentPoint.y
						});

						if(completeX && completeY){
							clearTimeout(momentTimer);
							return;
						}

						moveMoment();

					}, 10);
				}

				moveMoment();

		    }else{
		    	reposition();
		    }
		}

		function init(item, settings){
			var $s = settings,
				//source = item.attr('href'),
				group = item.data("group"),
				grouplength = 0;

			if(typeof group !== 'undefined'){
				grouplength = $('a[data-group="'+ group +'"]').length;
			}

			if(typeof group !== 'undefined'){
				_this_index = item.index('a[data-group="'+ group +'"]');
			}else{
				_this_index = item.index(item);
			}

			tpl = $('<div class="cb-lightbox"></div>').append('<div class="cb-lightbox-overlay"></div><div class="cb-lightbox-content"><div class="cb-lightbox-close"></div><div class="cb-lightbox-loading"></div><div class="cb-lightbox-slides"></div></div>');
			tpl.find(".cb-lightbox-loading").append('<div class="cb-lightbox-loading-animation"></div>');

			if(grouplength > 1){
				var arrows = $('<div class="cb-lightbox-arrow-prev cb-lightbox-arrow"><span></span></div><div class="cb-lightbox-arrow-next cb-lightbox-arrow"><span></span></div>');
				arrows.appendTo(tpl.find(".cb-lightbox-content"));
			}

			var captionTpl = $('<div class="cb-lightbox-info"></div>');

	    	captionTpl.appendTo(tpl.find(".cb-lightbox-content"));

			if(grouplength > 1 && $s.counter){
				var counter = $('<div class="cb-lightbox-counter"></div>');

				$('<span class="cb-counter-current"></span> / <span class="cb-counter-total"></span>').appendTo(counter);

				counter.find(".cb-counter-total").text($('a[data-group="'+ group +'"]').length);
				counter.find(".cb-counter-current").text(_this_index + 1);

				tpl.find(".cb-lightbox-info").append(counter);
			}

			if(grouplength <= 1){
				tpl.addClass('cb-lightbox-is-single');
			}

			//lock background
			if($("body").height() > $(window).height()){
				$("html").addClass("cb-lightbox-lock cb-lightbox-margin");
			}

			//set zoomOffset
			var zoomOffset = $s.zoomOffset;

			if ($.type(zoomOffset) === "number" ) {
                zoomOffset = [ zoomOffset, zoomOffset, zoomOffset, zoomOffset ];
            }

            if (zoomOffset.length == 2) {
                zoomOffset = [zoomOffset[0], zoomOffset[1], zoomOffset[0], zoomOffset[1]];
            }

            $s.zoomOffset = zoomOffset;

            //set margins
            if ($(window).width() < $s.breakpoint) {
				var margin = $s.mobilemargin;
			}else{
				var margin = $s.margin;
			}

			if ($.type(margin) === "number" ) {
                margin = [ margin, margin, margin, margin ];
            }

            if (margin.length == 2) {
                margin = [margin[0], margin[1], margin[0], margin[1]];
            }

            $s.margin = margin;

			tpl.data({
				'group': group,
				'settings': $s
			});

			tpl.appendTo("body");

			if ($.isFunction($s.afterInit)) {
		 	   $s.afterInit.call(this, tpl);
			}

			open(item, $s);
		}

		if (!$(document).data('cb-lightbox-initialized')) {
			var clickTimer = false,
				userXTouch = 0,
				userYTouch = 0;

			$(document).on('click', '.cb-lightbox-arrow', function(){
				if($(this).hasClass('cb-lightbox-arrow-prev')){
					slideTo('previews');
				}else{
					slideTo('next');
				}
			});

			$(document).on("keyup", function(e){
				if(e.keyCode == 37){
					slideTo('previews');
				}else if(e.keyCode == 39){
					slideTo('next');
				}
			});

			$(document).on("click", ".cb-lightbox-content, .cb-lightbox-close", function(e){
				if($('.cb-lightbox').hasClass('cb-lightbox-is-closing')){
					return;
				}

				if(($(e.target).hasClass("cb-lightbox-slide") && $(".cb-lightbox").hasClass("cb-lightbox-is-zoomed")) || ($(e.target).hasClass("cb-lightbox-close") || $(e.target).hasClass("cb-lightbox-content")) && !$(e.target).hasClass("cb-lightbox-arrow")){
					close();
				}
			});

			$(document).on(is_touch_device() ? 'touchstart' : 'mousedown', '.cb-lightbox-slide-current', function(e){

				if(!is_touch_device()){
			    	e.preventDefault();
			    }

				clickTimer = true;
				setTimeout(function(){
					clickTimer = false;
				}, 200);

				var container = $('.cb-lightbox'),
					$s = container.data('settings'),
					slide = $(this),
					image = slide.find('.cb-lightbox-image'),
					imageWidth = image.data('width');

				if(closing || container.hasClass('cb-lightbox-is-single')){
					return;
				}

				if(e.type == "mousedown"){
					if(e.which != 1){
						return false;
					}
				}else{
					userXTouch = e.originalEvent.touches[0].clientX - $(this).offset().left;
					userYTouch = e.originalEvent.touches[0].clientY - $(this).offset().top;
				}

				if(!container.hasClass('cb-lightbox-is-zoomed')){
					if(!$s.dragSlide){
						return;
					}

					var dragWidth = slide.data('fitWidth'),
						dragPosX = slide.data('fitLeft') + dragWidth - e.pageX;

					$(document).bind(is_touch_device() ? 'touchmove.cb-lightbox' : 'mousemove.cb-lightbox', function(e){
						var dragLeft = e.pageX + dragPosX - dragWidth;

						setTranslate(slide, {
				        	left: dragLeft,
				        });

				        slide
				        	.addClass('cb-lightbox-is-sliding')
				        	.data('slideX', dragLeft);
					});

					return;
				}

				container.addClass('cb-lightbox-is-grabbing');

				if(!slide.hasClass('cb-lightbox-draggable')){
					return;
				}

			    var lastOffset = slide.data('lastTransform'),
			    	lastOffsetX = lastOffset ? lastOffset.x : 0,
			        lastOffsetY = lastOffset ? lastOffset.y : 0,
			        windowWidth = $(window).width(),
			    	windowHeight = $(window).height(),
					imageHeight = image.data('height'),
			    	maxX = windowWidth - imageWidth,
			    	maxY = windowHeight - imageHeight;

			    if(e.type == "touchstart"){
			    	startX = e.originalEvent.touches[0].pageX - lastOffsetX;
					startY = e.originalEvent.touches[0].pageY - lastOffsetY;
			    }else{
			    	startX = e.pageX - lastOffsetX,
			    	startY = e.pageY - lastOffsetY;
			    }

			    clearTimeout(momentTimer);
			    lastT = new Date().getTime();

			    mouseUp = false;
			    logMousePosition();

			    $(document).bind(is_touch_device() ? 'touchmove.cb-lightbox' : 'mousemove.cb-lightbox', function(e){
			    	if(e.type == "touchmove"){
			    		var newX = e.originalEvent.touches[0].pageX - startX,
				            newY = e.originalEvent.touches[0].pageY - startY;
			    	}else{
				        var newX = e.pageX - startX,
				            newY = e.pageY - startY;
			        }

			        //check element is dragging
			        if(Math.abs(lastOffsetX - newX) > 2 || Math.abs(lastOffsetY - newY) > 2){
						slide.addClass("cb-lightbox-is-dragging");
						clickTimer = false;
			        }

			        if(imageWidth < windowWidth){
			        	newX = (windowWidth - imageWidth) / 2;
			        }else if(newX > $s.zoomOffset[3]){
			        	newX = ((newX - $s.zoomOffset[3]) / 3) + $s.zoomOffset[3];
			        }else if(Math.abs(newX) - $s.zoomOffset[1] > imageWidth - windowWidth && imageWidth > windowWidth){
			        	newX = ((-Math.abs(newX + $s.zoomOffset[1]) - maxX) / 3) + maxX - $s.zoomOffset[1];
			        }

			        if(imageHeight < windowHeight){
			        	newY = (windowHeight - imageHeight) / 2;
			        }else if(newY > $s.zoomOffset[0]){
			        	newY = ((newY - $s.zoomOffset[0]) / 3) + $s.zoomOffset[0];
			        }else  if(Math.abs(newY) - $s.zoomOffset[2] > imageHeight - windowHeight && imageHeight > windowHeight){
			        	newY = ((-Math.abs(newY + $s.zoomOffset[2]) - maxY) / 3) + maxY - $s.zoomOffset[2];
			        }

			        currentPoint = {x: newX, y: newY};

			        setTranslate(slide, {
			        	top: newY,
			        	left: newX
			        });
			    });
			});

			$(document).on(is_touch_device() ? 'touchend' : 'mouseup', function(e){

				mouseUp = true;
				clearTimeout(positionInterval);
				clearTimeout(momentTimer);

				$('.cb-lightbox').removeClass('cb-lightbox-is-grabbing');
				$(this).unbind("mousemove.cb-lightbox touchmove.cb-lightbox");

				if($(e.target).hasClass('cb-lightbox-close') || $(e.target).hasClass('cb-lightbox-content') || closing){
					return;
				}

				if(e.which != 1 && e.which != 0 ){
					return
				}

				if(e.type == 'mouseup' || e.type == 'touchend'){
					var slide = $(".cb-lightbox-slide-current");

					if($('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
						return false
					}

					if(slide.hasClass('cb-lightbox-is-sliding')){
						//handle slide
						var tolerance = 40,
							resetSlide = false;

						if(slide.data('slideX') > slide.data('fitLeft')){
							if(slide.data('slideX') > slide.data('fitLeft') + tolerance){
								slideTo('previews', 'slide');
								return;

							}else{
								resetSlide = true;
							}

						}else{
							if(slide.data('slideX') < slide.data('fitLeft') - tolerance){
								slideTo('next', 'slide');
								return;

							}else{
								resetSlide = true;
							}
						}

						if(resetSlide){
							_animate(slide, {
								left: slide.data('fitLeft'),
							}, 250);

							slide.removeClass('cb-lightbox-is-sliding');
						}

					}else if(clickTimer){
						//handle after click
						if(!slide.hasClass("cb-lightbox-is-dragging")){
							if(!slide.hasClass('cb-lightbox-draggable')){
								return;
							}

							//move to click position
							if(e.type == "mouseup"){
								var userX = e.offsetX,
									userY = e.offsetY;
							}else{
								var userX = userXTouch,
									userY = userYTouch;
							}

						   	if($(".cb-lightbox").hasClass("cb-lightbox-is-zoomed")){
						   		detroyDraggable();
						   	}else{
								initDraggable(userX, userY);
						   	}

						}else{
						    $(this).off("mousemove.cb-lightbox touchmove.cb-lightbox");
						}

					}else{
						//handle all other
						if($('.cb-lightbox-is-zoomed').length){
						    initMoveMoment(slide);
						}
					}

					slide.removeClass("cb-lightbox-is-dragging");
				}
			});

			$(window).on("resize", function(){
				if(!$("html").hasClass("cb-lightbox-touch")){
					detroyDraggable(true);
				}

				if($('.cb-lightbox').length){
					var slide = $('.cb-lightbox-slide'),
						values = fitImage(slide);

					_animate(slide, {
						width: values.width,
						height: values.height,
						top: values.top,
						left: values.left,
					}, 0);
				}
			});

			$(document).data('cb-lightbox-initialized', true);
		}

		return $(this).each(function(){
			var item = $(this);

			var settings = $.extend({}, defaults, options);

			item.on("click", function(e){
				e.stopPropagation();
				e.preventDefault();

				init(item, settings);
			});
		});
	}
})(jQuery);
