/*
 * CBLightbox 3.10.5 jQuery
 * 2019-09-25
 * Copyright Christin Bombelka
 * https://github.com/ChristinBombelka/cblightbox
 */

(function($){
	var caption,
		opening,
		closing,
		slideing = false,
		slides,
		firstLoad,
		isDraggable = false;

	$.fn.cblightbox = function(options){

		function cleanDom(){
			return $('html').width();
		}

		function is_touch_device() {
			return (('ontouchstart' in window)  || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
		}

		if(is_touch_device()){
			$("html").addClass("cb-lightbox-touch");
		}else{
			$("html").addClass("cb-lightbox-no-touch");
		}

		function getScrollbarWidth() {
			// Creating invisible container
			const outer = document.createElement('div');
			outer.style.visibility = 'hidden';
			outer.style.overflow = 'scroll'; // forcing scrollbar to appear
			outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
			document.body.appendChild(outer);

			// Creating inner element and placing it in the container
			const inner = document.createElement('div');
			outer.appendChild(inner);

			// Calculating difference between container's full width and the child width
			const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

			// Removing temporary elements from the DOM
			outer.parentNode.removeChild(outer);

			return scrollbarWidth;
		}

		if(!$(".cb-lightbox-margin").length){
			$("<style type='text/css'>.cb-lightbox-margin{margin-right:" + getScrollbarWidth() + "px;}</style>").appendTo($("head"));
		}

		var defaults = {
			maxHeight: 9999,
			maxWidth: 9999,
			margin: 40,
			mobilemargin: 0,
			zoom : false,
			zoomDuration : 300,
			zoomOffset : 0,
			disableOnMobile: false,
			breakpoint : 800,
			counter : true,
			captionPosition : 'outside', //inside, outside
			openCloseEffect : 'fade', //fade, zoom
			openCloseDuration : 250,
			slideDuration: 250,
			slideEffect: 'fade', //slide, fade
			previewSource: false, //define preview image source on use lazyloading
			dragSlide: true,
			alignHorizontal: 'center', //center, left, right
			alignVertical: 'center', //center, top, bottom
			afterInit: $.noop,
			afterFit: $.noop,
			afterSlide: $.noop,
			beforeOpen: $.noop,
			afterOpen: $.noop,
			beforeClose: $.noop,
			afterClose: $.noop,
			onResize: $.noop,
		}

		function error(container, slide){
			$('<div class="cb-lightbox-error">Sorry, this image can\'t loaded!</div>').appendTo(slide);

			slide.find('.cb-lightbox-slide-image').remove();
			slide.removeClass('cb-lightbox-image-hide');

			var $s = container.data('settings');

			_animate(container, false, $s.openCloseDuration);
			_animate(container.find('.cb-lightbox-content'), false, $s.openCloseDuration);

			clearTimeout(container.data('watch'));
			container.removeClass('cb-lightbox-is-loading');

			setTimeout(function(){
				container.addClass('cb-lightbox-is-open');

				container
					.removeClass('cb-lightbox-is-loading')
					.addClass('cb-lightbox-error-show');
			});
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

		function initMoveMoment(slideImage){
			var $s = $('.cb-lightbox').data('settings'),
				minX = $s.zoomOffset[3],
				maxX = $(window).width() - slideImage.width() -  $s.zoomOffset[1],
				minY = $s.zoomOffset[0],
				maxY = $(window).height() - slideImage.height() -  $s.zoomOffset[2],
				startTimeX = false,
	 			startTimeY = false;
	 			completeX = false,
	 			completeY = false,
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
 			};

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

						if((Math.abs(speedX) > 0.04 || (currentPoint.x > minX || currentPoint.x < maxX)) && slideImage.data('fullWidth') > $(window).width()){
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

						if((Math.abs(speedY) > 0.04 || (currentPoint.y > minY || currentPoint.y < maxY)) && slideImage.data('fullHeight') > $(window).height()){
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
						setTranslate(slideImage, {
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

		function setTranslate(el, values){
			var str = '',
				css = {};

			if(!el.length){
				return;
			}

			if(values.top !== undefined || values.left !== undefined){
				str = (values.left === undefined ? el.position().left : values.left) + 'px, ' + (values.top === undefined ? el.position().top : values.top) + 'px';
				str = 'translate(' + str + ')';

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

		function _animateDurationSet(el, duration){
			el.css('transition-duration', duration + 'ms');
		}

		function _animateDurationRemove(el){
			el.css('transition-duration', '');
		}

		function _animateEnd(el, to){
			_animateDurationRemove(el);

			if(el.closest('.cb-lightbox').hasClass('cb-lightbox-is-closing')){
				return;
			}

			if(to.scaleX !== undefined && to.scaleY !== undefined){
				var currentSlide = $('.cb-lightbox-slide-current').find(".cb-lightbox-slide-image");

				if(to.toWidth && to.toHeight){
					to.width = to.toWidth;
					to.height = to.toHeight
				}else if($('.cb-lightbox-is-zoomed').length && el.data('fullWidth') && el.data('fullHeight')){
					to.width = el.data('fullWidth');
					to.height = el.data('fullHeight');
				}else{
					to.width = currentSlide.data('fitWidth');
					to.height = currentSlide.data('fitHeight');
				}

				to.scaleX = 1;
				to.scaleY = 1;

				setTranslate(el, to);
			}
		}

		function _animate(el, to, duration){
			_animateDurationSet(el, duration)

			setTranslate(el, to);

			clearTimeout(el.data('timer'));

			el.data('timer', setTimeout(function(){
				_animateEnd(el, to);
			}, duration + 20));
		}

		function initDraggable(slideImage, userX, userY){
	    	if($(".cb-lightbox").hasClass("cb-lightbox-is-zoomed") || $('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
	    		return;
	    	}

	    	if(closing){
	    		return;
	    	}

	    	$(".cb-lightbox").addClass("cb-lightbox-is-zoomed");
	    	slideImage.addClass("cb-lightbox-draggable-init");

	        var $s = $('.cb-lightbox').data('settings'),
	        	slide = slideImage.closest('.cb-lightbox-slide'),
	        	clickX = userX / slideImage.width(),
				clickY = userY / slideImage.height();

			captionHide($s, slide.find('.cb-lightbox-caption'));

			if(slideImage.data('fullWidth') > $(window).width()){
				var positionX = Math.max(slideImage.data('fullWidth') * clickX - ($(window).width() / 2) - $s.zoomOffset[3], -$s.zoomOffset[3]);
					positionX = -Math.min(slideImage.data('fullWidth') - $(window).width() + $s.zoomOffset[1], positionX);
			}else{
				var positionX = ($(window).width() - slideImage.data('fullWidth')) / 2;
			}

			if(slideImage.data('fullHeight') > $(window).height()){
				var positionY = Math.max(slideImage.data('fullHeight') * clickY - ($(window).height() / 2) - $s.zoomOffset[0], -$s.zoomOffset[0]),
					positionY = -Math.min(slideImage.data('fullHeight') - $(window).height() + $s.zoomOffset[2], positionY);
			}else{
				var positionY = ($(window).height() - slideImage.data('fullHeight')) / 2;
			}

			scaleWidth = slideImage.data('fullWidth') / slideImage.width();
	        scaleHeight = slideImage.data('fullHeight') / slideImage.height();

			_animate(slideImage, {
				top: positionY,
				left: positionX,
				scaleX: scaleWidth,
				scaleY: scaleHeight
			}, $s.zoomDuration);

			setTimeout(function(){
				isDraggable = true;
			}, $s.zoomDuration);
	    }

	    function detroyDraggable(slideImage, disableAnimation){
	    	var container = $(".cb-lightbox");

	    	isDraggable = false;

	    	if(!container.length || !slideImage.length){
	    		return;
	    	}

			var $s = slideImage.closest('.cb-lightbox').data('settings'),
				slide = slideImage.closest('.cb-lightbox-slide'),
				duration = $s.zoomDuration;

			if(!container.hasClass("cb-lightbox-is-zoomed")){
				return;
			}

	    	if(!slideImage.hasClass("cb-lightbox-draggable-init")){
	    		return;
	    	}

	    	var	scaleWidth = slideImage.data('fitWidth') / slideImage.width(),
	       		scaleHeight = slideImage.data('fitHeight') / slideImage.height();

	    	if(typeof disableAnimation !== 'undefined'){
	    		duration = 0;
	    		disableAnimation = false;
	    	}

    		_animate(slideImage, {
    			toWidth: slideImage.data('fitWidth'),
				toHeight: slideImage.data('fitHeight'),
				top: slideImage.data('fitTop'),
				left: slideImage.data('fitLeft'),
				scaleX: scaleWidth,
				scaleY: scaleHeight
			}, duration);

    		setTimeout(function(){
    			container.removeClass("cb-lightbox-is-zoomed");
    			captionShow(slide);
    		}, duration + 30);

    		slideImage.removeClass("cb-lightbox-draggable-init");
	    }

	    function getImageFit(slideImage){
			var container = $('.cb-lightbox'),
				$s = container.data('settings'),
				type = slideImage.data('type');

			if(type == 'image'){
				if(typeof slideImage != 'undefined'){
					imgWidth = slideImage.data('fullWidth');
					imgHeight = slideImage.data('fullHeight');
				}
				else{
					imgWidth = $(".cb-lightbox-image").width();
					imgHeight = $(".cb-lightbox-image").height();
				}
			}else{

				if(slideImage.data('fullHeight') && slideImage.data('fullWidth')){
					imgHeight = container.height();
					imgWidth = imgHeight / slideImage.data("fullHeight") * slideImage.data("fullWidth");
				}else{
					//Default 16/9
					imgHeight = container.height();
					imgWidth = imgHeight / 9 * 16;
				}
			}

			var wrapperHeight = container.height() - ($s.margin[0] + $s.margin[2]),
				wrapperWidth = container.width() - ($s.margin[1] + $s.margin[3]),
				windowHeight = window.innerHeight ? window.innerHeight : $(window).height();

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

			if($s.alignVertical == 'top'){
				positionTop = $s.margin[0];
			}else if($s.alignVertical == 'bottom'){
				positionTop = windowHeight - newImgHeight - $s.margin[2];
			}else{
				positionTop = Math.max((windowHeight - newImgHeight - captionHeight) / 2, $s.margin[0]);
			}

			if($s.alignHorizontal == 'left'){
				positionLeft = $s.margin[3];
			}else if($s.alignHorizontal == 'right'){
				positionLeft = container.width() - newImgWidth - $s.margin[1];
			}else{
				positionLeft = (container.width() - newImgWidth) / 2;
			}

			var	scaleWidth = newImgWidth / slideImage.data('holderWidth'),
   				scaleHeight = newImgHeight / slideImage.data('holderHeight');

			slideImage.data({
	 			'fitHeight': newImgHeight,
	 			'fitWidth': newImgWidth,
	 			'fitLeft': positionLeft,
	 			'fitTop': positionTop
	 		});

			if((imgWidth > $(window).width() || imgHeight > windowHeight) && $s.zoom){
				slideImage.addClass('cb-lightbox-draggable');
			}else{
				slideImage.removeClass('cb-lightbox-draggable');
			}

			if ($.isFunction($s.afterFit)) {
				$s.afterFit.call(this, container, slideImage.closest('.cb-lightbox-slide'));
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
		    var slide = $('.cb-lightbox-slide.cb-lightbox-slide-current'),
				$s = slide.closest('.cb-lightbox').data('settings'),
		    	slideImage = slide.find('.cb-lightbox-slide-image'),
		    	lastoffset = slideImage.data('lastTransform'),
		    	windowWidth = $(window).width(),
		    	windowHeight = window.innerHeight ? window.innerHeight : $(window).height(),
		    	imageWidth = slideImage.data('fullWidth'),
		    	imageHeight = slideImage.data('fullHeight');

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
		    	_animate(slideImage, {
		    		top: moveY,
		    		left: moveX,
		    	}, 250);
		    }
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

	    function captionInsidePosition(caption, slideImage){
	    	caption.css({
				bottom: ($(window).height() - slideImage.data('fitHeight')) / 2,
				left: slideImage.data('fitLeft'),
				width: slideImage.data('fitWidth'),
			});
	    }

	    function updateCaption(item, slide, $s){
	    	var caption = item.data("caption"),
				captionTpl = $("<div class='cb-lightbox-caption'>"+ caption +"</div>");

			if($s.captionPosition == 'inside'){

				slide.addClass('cb-lightbox-slide-with-caption');

				if(!slide){
					var slide = $('.cb-lightbox-slide-current');
				}

				if(slide.find('.cb-lightbox-caption').length){
					return;
				}

				captionInsidePosition(captionTpl, slide.find('.cb-lightbox-slide-image'));

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

		function watchLoading(slide){
			if(slide.length){

				if(slide.hasClass('cb-lightbox-slide-complete')){
					$('.cb-lightbox').removeClass('cb-lightbox-is-loading');

					clearTimeout($('.cb-lightbox').data('watch'));
					return;

				}else{
					$('.cb-lightbox').addClass('cb-lightbox-is-loading');
				}

				$('.cb-lightbox').data('watch', setTimeout(function(){
					watchLoading(slide);
				}, 100));
			}
		}

		function getImageSize(el, img, slide, callback) {
		    var $img = $(img);

		    if(el.data('width') && el.data('height')){
		    	callback.apply(this, [el.data('width'), el.data('height'), slide]);
		    }else{
		    	var wait = setInterval(function() {
			        var w = $img[0].naturalWidth,
			            h = $img[0].naturalHeight;
			        if (w && h) {
			            clearInterval(wait);
			            callback.apply(this, [w, h, slide]);
			        }
			    }, 100);
			}
		}

		function setImageFit(slideImage){
			var values = getImageFit(slideImage);

			setTranslate(slideImage, {
				width: values.width,
				height: values.height,
			});
		}

		function setImage(slide, source, item, p){
			var elementPlaceholder = slide.find('.cb-lightbox-image-placeholder'),
				container = $('.cb-lightbox'),
				slideImage = slide.find('.cb-lightbox-slide-image'),
				$s = container.data('settings'),
				loadingTimeout,
				loadingImage = true;

			if(typeof slides === "undefined"){
				cachedSlide = false;
			}else{
				cachedSlide = slides[slideImage.data('index')];
			}

			if(cachedSlide.image && cachedSlide.status == 'complete'){
				var $img = cachedSlide.image.clone().appendTo(slideImage);

				if($img[0].complete){
					loadingImage = false;
				}
			}

			if(loadingImage){
				if(typeof $img !== "undefined" && $img.length){
					$img.remove();
				}

				var $img = $('<img />');

				$img.addClass('cb-lightbox-image')
					.attr('src', source)
					.appendTo(slideImage);

				$img.one('error', function(){

					clearTimeout(loadingTimeout);

					$img.remove();
					elementPlaceholder.remove();
					error(container, slide);

				}).one('load', function(e){
					imageHeight = $(this).data('height') || this.naturalHeight;

					slide.removeClass('cb-lightbox-slide-hide');

					if(firstLoad){
						initPreload(container);
					}

					setTimeout(function(){

						elementPlaceholder.hide();

						slide
							.removeClass('cb-lightbox-image-hide')
							.addClass('cb-lightbox-slide-complete');

						if(slides[slideImage.data('index')]){
							slides[slideImage.data('index')].image = $img;
							slides[slideImage.data('index')].status = 'complete';
						}

					}, Math.min( 300, Math.max( 1000, imageHeight / 1600 )));
				});
			}

			getImageSize(item, $img, slideImage,  function(width, height, slideImage){
				slideImage.data({
					'fullWidth': width,
					'fullHeight': height,
				});

				setImageFit(slideImage);

				var values = getImageFit(slideImage);
				setTranslate(slideImage, {
					top: values.top,
					left: values.left,
				});
			});

			if(loadingImage == false && ($img[0].complete || $img[0].readyState == 'complete') && $img[0].naturalWidth && $img[0].naturalHeight){
				elementPlaceholder.hide();

				slide
					.removeClass('cb-lightbox-slide-hide cb-lightbox-image-hide')
					.addClass('cb-lightbox-slide-complete');

				if(firstLoad){
					initPreload(container);
				}
			}
		}

		function setSlide(item, i, p){
			if(typeof i !== "undefined"){
				$(".counter-current").text(i + 1);
			}

			var container = $('.cb-lightbox'),
				$s = container.data('settings'),
				source = item.attr('href'),
				cachedSlide = slides[i];

			if(!cachedSlide){
				cacheSlides(item, i, p);
				cachedSlide = slides[i];
			}

			container.removeClass('cb-lightbox-error-show');

			var slide = $('<div class="cb-lightbox-slide cb-lightbox-slide-' + p + ' cb-lightbox-image-hide"></div>'),
				wrapImage = $('<div class="cb-lightbox-slide-image"></div>');

			wrapImage.appendTo(slide);

			if(p == 'previews'){
				slide.prependTo($('.cb-lightbox-slides'));
			}else{
				slide.appendTo($('.cb-lightbox-slides'));
			}

			if(p == 'current'){
				clearTimeout($('.cb-lightbox').data('watch'));
				watchLoading(slide);
			}

			wrapImage.data({
				'type': cachedSlide.type,
				'index': i,
				'holderWidth': item.find('img').width(),
				'holderHeight': item.find('img').height(),
			});

			$('.cb-lightbox-error').remove();
			$('.cb-lightbox-content').removeClass('cb-lightbox-error-show');

			if(cachedSlide.type == "image"){

				var elementPlaceholder = cachedSlide.placeholder.clone().appendTo(wrapImage);

				elementPlaceholder.show();

				if((elementPlaceholder[0].complete || elementPlaceholder[0].readyState == 'complete') && elementPlaceholder[0].naturalWidth && elementPlaceholder[0].naturalHeight ) {
					slide.removeClass('cb-lightbox-slide-hide');

					setImage(slide, source, item, p);

				}else{

					elementPlaceholder.one('error', function(){
						elementPlaceholder.remove();
					}).one('load', function(){
						slide.removeClass('cb-lightbox-slide-hide');

						setImage(slide, source, item, p);

						slides[wrapImage.data('index')].placeholder = elementPlaceholder;
					});
				}

			}else if(cachedSlide.type == "iframe"){

				var iframe = cachedSlide.iframe.clone().appendTo(wrapImage);

				wrapImage
					.data({
						'fullWidth': item.data('width') ? item.data('width') : 16,
						'fullHeight': item.data('height') ? item.data('height') : 9,
					});

				iframe.on("load", function(){
					slide
						.removeClass('cb-lightbox-slide-hide cb-lightbox-image-hide')
						.addClass('cb-lightbox-slide-complete');
				});
			}

			return slide;
		}

	    function slideTo(direction, effect){
	    	if(typeof effect === "undefined"){
	    		effect = false;
	    	}

			$('.cb-lightbox-slide').removeClass('cb-lightbox-is-sliding');

	    	firstLoad = false;

		   	var container = $(".cb-lightbox"),
				$s = container.data('settings'),
	    		group = container.data('group'),
				items = $('a[data-group="'+ group +'"]'),
				oldCurrent = $('.cb-lightbox-slide.cb-lightbox-slide-current');

			if(container.hasClass('cb-lightbox-is-zoomed') || slideing || items.length <= 1){
				return;
			}

			slideing = true;

			if(direction == 'previews'){
				_this_index = _this_index - 1;

				if(_this_index < 0){
					_this = items.length - 1;
					_this_index = _this;
				}

				var newCurrent = oldCurrent.prev();

				//cache prev slide
				var _slideIndex = _this_index - 1;

				if(_slideIndex < 0){
					_this = items.length - 1;
					_slideIndex = _this;
				}

				//change current slide
				var oldCurrentDirection = 'next';

			}else if(direction == 'next'){
				_this_index = _this_index + 1;

				if(_this_index > items.length - 1){
					_this_index = 0;
				}

				var newCurrent = oldCurrent.next();

				//cache next slide
				var _slideIndex = _this_index + 1;

				if(_slideIndex > items.length - 1){
					_slideIndex = 0;
				}

				//change current slide
				var oldCurrentDirection = 'previews';
			}

			container.find('.cb-counter-current').text(_this_index + 1);

			$('.cb-lightbox-is-selected').removeClass('cb-lightbox-is-selected');
			items.eq(_this_index).addClass('cb-lightbox-is-selected');

			//remove previews slide
			$('.cb-lightbox-slide.cb-lightbox-slide-' + oldCurrentDirection).remove();

			oldCurrent
				.removeClass('cb-lightbox-slide-current')
				.addClass('cb-lightbox-slide-' + oldCurrentDirection);

			if($s.slideEffect == 'slide' || effect == 'slide'){

				if(direction == 'previews'){
					var slideOut = $(window).width();
				}else{
					var slideOut = -$(window).width();
				}

				_animate(oldCurrent, {
					left: slideOut,
					opacity: 0,
				}, $s.slideDuration);
			}else{
				_animate(oldCurrent, {
					opacity: 0,
				}, $s.slideDuration);
			}

			//check new Current exist
			if(!newCurrent.length){
				newCurrent = setSlide(items.eq(_this_index), _this_index, 'current');
			}

			cachedSlide = slides[_this_index];

			newCurrent
				.removeClass('cb-lightbox-slide-previews cb-lightbox-slide-next')
				.addClass('cb-lightbox-slide-current');

			//set new caption befor calc slide height
			updateCaption(items.eq(_this_index), newCurrent, $s);

			var newCurrentImage = newCurrent.find('.cb-lightbox-slide-image');

			values = getImageFit(newCurrentImage);

			setTranslate(newCurrentImage, {
				width: values.width,
				height: values.height,
				left: values.left,
				top: values.top,
			});

			//set current slide start position
			if($s.slideEffect == 'slide' || effect == 'slide'){
				if(direction == 'previews'){
					var slideIn = -$(window).width();
				}else{
					var slideIn = $(window).width();
				}

				setTranslate(newCurrent, {
					left: slideIn,
					opacity: 0,
				});
			}else{
				setTranslate(newCurrent, {
					left: 0,
					opacity: 0,
				});
			}

			clearTimeout($('.cb-lightbox').data('watch'));
			watchLoading(newCurrent);

			if($s.slideEffect == 'slide' || effect == 'slide'){
				setTimeout(function(){
					_animate(newCurrent, {
						top: 0,
						left: 0,
						opacity: 1,
					},  $s.slideDuration);
				});
			}else{
				setTimeout(function(){
					_animate(newCurrent, {
						opacity: 1,
					},  $s.slideDuration);
				});
			}

			captionShow(newCurrent);

			setTimeout(function(){
				if ($.isFunction($s.afterSlide)) {
			 	   $s.afterSlide.call(this, container, newCurrent);
				}
			}, $s.slideDuration + 10);

			setTimeout(function(){
				slideing = false;
			}, 200);

			//set new previews/next slide
			setSlide(items.eq(_slideIndex), _slideIndex, direction);
	    }

	    function initPreload(container){
	    	if(!firstLoad){
	    		return;
	    	}

    		var group = container.data('group'),
				items = $('a[data-group="'+ group +'"]');

			if(items.length > 1){
				//cache prev slide
				var _slideIndex = _this_index - 1;

				if(_slideIndex < 0){
					_this = items.length - 1;
					_slideIndex = _this;
				}

				var prevItem = items.eq(_slideIndex);
				var preSlide = setSlide(prevItem, _slideIndex, 'previews');

				//cache next slide
				var _slideIndex = _this_index + 1;

				if(_slideIndex > items.length - 1){
					_slideIndex = 0;
				}

				var nextItem = items.eq(_slideIndex);
				var postSlide = setSlide(nextItem, _slideIndex, 'next');
			}

			firstLoad = false;
	    }

	    function getType(source){
	    	if(source.match(/(^data:image\/[a-z0-9+\/=]*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg|ico)((\?|#).*)?$)/i) ) {
                type = 'image';
            }else if(source){
            	type = 'iframe';
            }else{
            	type = 'error';
            }

            return type;
	    }

		function cacheSlides(item, i, p){
			var container = $('.cb-lightbox'),
				$s = container.data('settings');

			if(!slides[i]){
				var source = item.attr('href'),
					placeholder = false,
					iframe = false,
					image = false,
					type = false,
					status = 'load';

				type = getType(source);

				if(type == "image"){
					previewImage = item.find('img');

					if(previewImage.length && previewImage.attr('src') && previewImage.attr('src').substr(0, 21) != 'data:image/png;base64'){
						placeholderImage = item.find('img').attr('src');
					}else if($s.previewSource){
						placeholderImage = item.find('img').attr( $s.previewSource );
					}else{
						placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
					}

					placeholder = $('<img />')
						.addClass('cb-lightbox-image-placeholder')
						.attr('src', placeholderImage);

					image = $('<img/>')
						.addClass('cb-lightbox-image')
						.attr('src', source);

					setTimeout(function(){
						if(image[0].complete){
							status = 'complete';
						}
					});

				}else if(type == "iframe"){
					var iframe = $('<iframe src="" class="cb-lightbox-image cb-lightbox-iframe" allow="autoplay, fullscreen" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen=""></iframe>');

					iframe.attr("src", source);
				}

				slides[i] = {
					index: i,
					type: type,
					placeholder: placeholder,
					image: image,
					status: status,
					iframe: iframe,
				};
			}
		}

		function open(item, i, $s){
			var source = item.attr('href'),
				slide = setSlide(item, i, 'current'),
				slideImage = slide.find('.cb-lightbox-slide-image'),
				container = $('.cb-lightbox'),
				cachedSlide = slides[i];

			setTranslate(slide, {
				top: 0,
				left: 0,
			});

			setTranslate(slideImage, {
				opacity: 0,
			});

			_animateDurationSet(container, $s.openCloseDuration);
			_animateDurationSet(container.find('.cb-lightbox-content'), $s.openCloseDuration);

			if(cachedSlide.type == 'error'){
				error(container, slide);
			}if (slideImage.data('fullHeight') === undefined) {
				//wait for imagesize;
				var wait = setInterval(function() {
					if(typeof slide === "undefined"){
						clearInterval(wait);
						return;
					}

			        if (slideImage.data('fullHeight') !== undefined) {
			            openStart();
			            clearInterval(wait);
			        }
			    }, 100);
			}else{
				openStart();
			}

			function openStart(){
				if ($.isFunction($s.beforeOpen)) {
				 	$s.beforeOpen.call(this, container, slide);
				}

				updateCaption(item, slide, $s);

				if(slide && $s.openCloseEffect == 'zoom'){
					var previewImage = item.find('img');

					if(!previewImage.length){
						previewImage = item;
					}

					var	offsetTop = previewImage.offset().top - $(window).scrollTop(),
						offsetLeft = previewImage.offset().left;

					setTranslate(slideImage, {
						width: previewImage.width(),
						height: previewImage.height(),
						top: offsetTop,
						left: offsetLeft,
						opacity: 1,
					});

					var values = getImageFit(slideImage);

					_animate(slideImage, {
						top: values.top,
						left: values.left,
						scaleX: values.scaleX,
						scaleY: values.scaleY
					}, $s.openCloseDuration);

					setTimeout(function(){
						captionShow(slide);
					}, $s.openCloseDuration + 30);

				}else if(slide && $s.openCloseEffect == 'fade'){

					var values = getImageFit(slideImage);

					setTranslate(slideImage, {
						width: values.width,
						height: values.height,
						top: values.top,
						left: values.left,
						opacity: 0
					});

					setTimeout(function(){
						_animate(slideImage, {
							opacity: 1,
						}, $s.openCloseDuration);
					}, 20);

					captionShow(slide);
				}

				container.addClass('cb-lightbox-is-opening cb-lightbox-show-info cb-lightbox-show-buttons');

				setTimeout(function(){
					if(closing){
						return;
					}

					opening = false;

					_animateDurationRemove(container);
					_animateDurationRemove(container.find('.cb-lightbox-content'));

					container.removeClass('cb-lightbox-is-opening').addClass('cb-lightbox-is-open');
				}, $s.openCloseDuration);

				setTimeout(function(){
					if ($.isFunction($s.afterOpen)) {
				 	   $s.afterOpen.call(this, container, slide);
					}

				}, $s.openCloseDuration + 30);
			}
		}

		function onScroll(event){
			event.preventDefault();
		}

		function close(){
			closing = true;

			var el = $(".cb-lightbox-is-selected"),
				previewImage = el.find('img'),
				container = $('.cb-lightbox'),
				$s = container.data('settings'),
				slide = container.find('.cb-lightbox-slide.cb-lightbox-slide-current'),
				slideImage = slide.find('.cb-lightbox-slide-image');

			clearTimeout(container.data('watch'));

			if ($.isFunction($s.beforeClose)) {
				$s.beforeClose.call(this, container, slide);
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
				var	scaleWidth =  previewImage.width() / slideImage.width(),
					scaleHeight = previewImage.height() / slideImage.height(),
					offsetTop = previewImage.offset().top - $(window).scrollTop();
					offsetLeft = previewImage.offset().left;

				captionHide($s, container.find('.cb-lightbox-caption'));

				_animate(slideImage, {
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
				detroyDraggable(slide);
				$(".cb-lightbox").remove();
				$("html").removeClass("cb-lightbox-lock cb-lightbox-margin");
				el.removeClass('cb-lightbox-is-selected');
				closing = false;

				if ($.isFunction($s.afterClose)) {
				 	$s.afterClose.call(this, container);
				}

			}, $s.openCloseDuration + 20);

			//disable scroll events
			$('.cb-lightbox')[0].removeEventListener ('mousewheel', onScroll, false);
			$('.cb-lightbox')[0].removeEventListener ('touchmove', onScroll, false);
		}

		function init(item, settings){
			var $s = settings,
				group = item.data("group"),
				grouplength = 0;

			firstLoad = true;
			opening = true;

			slides = [];

			if(typeof group !== 'undefined'){
				items = $('a[data-group="'+ group +'"]');
				grouplength = items.length;

				_this_index = item.index('a[data-group="'+ group +'"]');
			}else{

				_this_index = item.index(item, settings);
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

				$('<span class="cb-counter-current"></span><span class="cb-counter-seperator">/</span><span class="cb-counter-total"></span>').appendTo(counter);

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

			item.addClass("cb-lightbox-is-selected");

			//cache current slide
			cacheSlides(item, _this_index, 'current');

			//block scroll events
			$('.cb-lightbox')[0].addEventListener ('mousewheel', onScroll, {passive: false});
			$('.cb-lightbox')[0].addEventListener ('touchmove', onScroll, {passive: false});

			open(item, _this_index, $s);
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

			$(document).on("click", ".cb-lightbox-slide, .cb-lightbox-close", function(e){
				if($('.cb-lightbox').hasClass('cb-lightbox-is-closing')){
					return;
				}

				if(($(e.target).hasClass("cb-lightbox-slide") || $(e.target).hasClass("cb-lightbox-close")) && !$(e.target).hasClass("cb-lightbox-arrow")){
					close();
				}
			});

			$(document).on(is_touch_device() ? 'touchstart' : 'mousedown', '.cb-lightbox-slide-current', function(e){
				if(closing || opening){
					return;
				}

				var container = $('.cb-lightbox'),
					$s = container.data('settings'),
					slideImage = $(this).find('.cb-lightbox-slide-image'),
					slide = slideImage.closest('.cb-lightbox-slide'),
					imageWidth = slideImage.data('fullWidth'),
					windowWidth = $(window).width(),
					windowHeight = $(window).height(),
					moveDirection = false;

				if(e.type == "mousedown"){
					if(e.which != 1){
						return false;
					}
				}else{
					userXTouch = e.originalEvent.touches[0].clientX - $(this).offset().left;
					userYTouch = e.originalEvent.touches[0].clientY - $(this).offset().top;
				}

				if(!container.hasClass('cb-lightbox-is-zoomed') && !container.hasClass('cb-lightbox-is-single')){
					if(!$s.dragSlide || opening || isDraggable){
						return;
					}

					if(e.type == "mousedown"){
						var pageXStart = e.pageX,
							pageYStart = e.pageY;
					}else{
						var pageXStart = e.originalEvent.touches[0].pageX,
							pageYStart = e.originalEvent.touches[0].pageY;
					}

					var dragWidth = windowWidth,
						dragPosX = dragWidth - pageXStart,
						dragHeight = windowHeight,
						dragPosY = dragHeight - pageYStart;

					$(document).bind(is_touch_device() ? 'touchmove.cb-lightbox' : 'mousemove.cb-lightbox', function(e){
						if(e.type == "mousemove"){
							var pageXMove = e.pageX,
								pageYMove = e.pageY;
						}else{
							var pageXMove = e.originalEvent.touches[0].pageX,
								pageYMove = e.originalEvent.touches[0].pageY;
						}

						var dragLeft = pageXMove + dragPosX - dragWidth,
							dragTop = pageYMove + dragPosY - dragHeight;

						var angle = Math.abs((Math.atan2(dragTop, dragLeft) * 180) / Math.PI),
							direction = angle > 45 && angle < 135 ? "y" : "x";

						if(!moveDirection){
							moveDirection = direction;
						}

						if(moveDirection == 'y'){
							setTranslate(slideImage, {
					        	top: slideImage.data('fitTop') + dragTop,
					        });

							slide
				        		.addClass('cb-lightbox-is-sliding')
				        		.data('slideY', dragTop);

						}else{
							setTranslate(slide, {
					        	left: dragLeft,
					        });

					        slide
				        		.addClass('cb-lightbox-is-sliding')
				        		.data('slideX', dragLeft);
						}
					});

					return;
				}
			});

			$(document).on(is_touch_device() ? 'touchstart' : 'mousedown', '.cb-lightbox-slide-current .cb-lightbox-slide-image', function(e){
				if(!is_touch_device()){
			    	e.preventDefault();
			    }

			    if(closing || opening){
					return;
				}

				clickTimer = true;
				setTimeout(function(){
					clickTimer = false;
				}, 200);

				var container = $('.cb-lightbox'),
					$s = container.data('settings'),
					slideImage = $(this),
					slide = slideImage.closest('.cb-lightbox-slide');

				if(e.type == "mousedown"){
					if(e.which != 1){
						return false;
					}
				}else{
					userXTouch = e.originalEvent.touches[0].clientX - $(this).offset().left;
					userYTouch = e.originalEvent.touches[0].clientY - $(this).offset().top;
				}

				container.addClass('cb-lightbox-is-grabbing');

				if(!slideImage.hasClass('cb-lightbox-draggable')){
					return;
				}

			    var imageWidth = slideImage.data('fullWidth'),
					windowWidth = $(window).width(),
					windowHeight = $(window).height(),
			    	lastOffset = slideImage.data('lastTransform'),
			    	lastOffsetX = lastOffset ? lastOffset.x : 0,
			        lastOffsetY = lastOffset ? lastOffset.y : 0,
					imageHeight = slideImage.data('fullHeight'),
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
						slideImage.addClass("cb-lightbox-is-dragging");
						clickTimer = false;
			        }

			        if(!isDraggable){
			        	return;
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

			        setTranslate(slideImage, {
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
					var slide = $(".cb-lightbox-slide-current"),
						slideImage = slide.find('.cb-lightbox-slide-image');

					if(slide.hasClass('cb-lightbox-is-sliding')){
						//handle slide
						var tolerance = 40,
							resetSlide = false;

						if(slide.data('slideX')){
							if(slide.data('slideX') > 0){
								if(slide.data('slideX') > 0 + tolerance){
									slideTo('previews', 'slide');
								}else{
									resetSlide = true;
								}

							}else{
								if(slide.data('slideX') < 0 - tolerance){
									slideTo('next', 'slide');
								}else{
									resetSlide = true;
								}
							}

							slide.data('slideX', false);

							if(resetSlide){
								_animate(slide, {
									left: 0,
								}, 250);

								slide.removeClass('cb-lightbox-is-sliding');
							}

						}else if(slide.data('slideY')){
							if(Math.abs(slide.data('slideY')) > tolerance){
								close();
							}else{
								_animate(slideImage, {
									'top': slideImage.data('fitTop')
								}, 250);

								slide.removeClass('cb-lightbox-is-sliding');
							}

							slide.data('slideY', false);
						}
					}else{
						if($('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
							return false
						}

						if(clickTimer){
							//handle after click
							if(!slideImage.hasClass("cb-lightbox-is-dragging")){
								if(!slideImage.hasClass('cb-lightbox-draggable')){
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
							   		detroyDraggable(slideImage);
							   	}else{
									initDraggable(slideImage, userX, userY);
							   	}

							}else{
							    $(this).off("mousemove.cb-lightbox touchmove.cb-lightbox");
							}

						}else{
							//handle all other
							if($('.cb-lightbox-is-zoomed').length && isDraggable){
							    initMoveMoment(slideImage);
							}
						}
					}

					slideImage.removeClass("cb-lightbox-is-dragging");
				}
			});

			$(window).on("resize", function(){
				if(!$("html").hasClass("cb-lightbox-touch") && $('.cb-lightbox').hasClass('cb-lightbox-is-zoomed')){
					detroyDraggable($('.cb-lightbox-slide-current .cb-lightbox-slide-image'), true);
				}

				if($('.cb-lightbox').length){
					var $s = $('.cb-lightbox').data('settings');

					$('.cb-lightbox-slide').each(function(){
						var slide = $(this),
							slideImage = slide.find('.cb-lightbox-slide-image'),
							caption = slide.find('.cb-lightbox-caption');

						values = getImageFit(slideImage);

						setTranslate(slideImage, {
							width: values.width,
							height: values.height,
							top: values.top,
							left: values.left,
						});

						if(caption.length){
							captionInsidePosition(caption, slideImage);
						}

						if(slide.hasClass('cb-lightbox-slide-current')){
							if ($.isFunction($s.onResize)) {
								$s.onResize.call(this, $('.cb-lightbox'), slide);
							}
						}
					});
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

				if(settings.disableOnMobile && $(window).width() < settings.breakpoint){
					return;
				}

				init(item, settings);
			});
		});
	}
})(jQuery);
