/*
 * CBLightbox 3.8.0 jQuery
 * 2019-04-19
 * Copyright christin Bombelka
 * https://github.com/ChristinBombelka/cblightbox
 */

(function($){
	var caption,
		type,
		tpl,
		runningTimeout,
		closing;

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
			captionPosition : 'outside', // inside/outside
			animationEffect : 'fade', //fade/zoom
			animationDuration : 250,
			slideDuration: 250,
			zoomOffset: 0,
			afterInit: $.noop,
			afterFit: $.noop,
		}

		function error(container){
			$('<div class="cb-lightbox-error">Sorry, this image can\'t loaded!</div>').appendTo(container.find('.cb-lightbox-content'));

			container
				.removeClass('cb-lightbox-is-loading')
				.addClass('cb-lightbox-error-show');
		}

		function setTranslate(el, values){
			var str = '',
				css = {};

			if(values.top !== undefined && values.left !== undefined){
				str = values.left  + 'px, ' + values.top + 'px';
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

		function animateEnd(el, to){
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

		function animate(el, to, duration, animationEnd){
			el.css('transition-duration', duration + 'ms');

			setTranslate(el, to);

			clearTimeout(el.data('timer'));

			el.data('timer', setTimeout(function(){
				animateEnd(el, to);
			}, duration + 20));
		}

		function initDraggable(userX, userY){
	    	if($(".cb-lightbox").hasClass("cb-lightbox-is-zoomed") || $('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
	    		return;
	    	}

	    	if(closing){
	    		return;
	    	}

	    	clearTimeout(runningTimeout);

	    	$(".cb-lightbox").addClass("cb-lightbox-is-zoomed")
	    	$(".cb-lightbox-slide").addClass("cb-lightbox-draggable-init");

	        var slide = $('.cb-lightbox-slide'),
				$s = slide.closest('.cb-lightbox').data('settings'),
	        	image = slide.find(".cb-lightbox-image"),
	        	clickX = userX / slide.width(),
				clickY = userY / slide.height();

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

			animate(slide, {
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

    		animate(slide, {
    			toWidth: slide.data('fitWidth'),
				toHeight: slide.data('fitHeight'),
				top: slide.data('fitTop'),
				left: slide.data('fitLeft'),
				scaleX: scaleWidth,
				scaleY: scaleHeight
			}, duration);

    		container.removeClass("cb-lightbox-is-zoomed")
    		slide.removeClass("cb-lightbox-draggable-init");
	    }

	    function updateCaption(item){
			$(".cb-lightbox-caption").remove();

			caption = item.data("caption");
			if(caption){
				$("<div class='cb-lightbox-caption'>"+ caption +"</div>").appendTo($(".cb-lightbox-info"));
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
			    }, 100);
			}
		}

		function getSlide(source, i, item, fitAndShow){

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

			updateCaption(item);

			wrapImage.appendTo(slide);
			slide.appendTo($('.cb-lightbox-slides'));
			slide.data('type', type);
			slide.addClass('cb-lightbox-hide-image');

			$('.cb-lightbox-error').remove();
			$('.cb-lightbox-content').removeClass('cb-lightbox-error-show');

			if(type == "image"){

				var previewImage = item.find('img'),
					$img = $('<img />'),
					elementPlaceholder = $('<img />');

				if(previewImage.length && previewImage.attr('src').substr(0, 21) != 'data:image/png;base64'){
					placeholderImage = item.find('img').attr('src');
				}else{
					placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
				}

				$img
					.addClass('cb-lightbox-image')
					.appendTo(wrapImage);

				elementPlaceholder
					.addClass('cb-lightbox-image-placeholder')
					.attr('src', placeholderImage)
					.appendTo(wrapImage);

				getImageSize(item, $img, function(width, height){
					$img.data({
						'width': width,
						'height': height,
					});
				});

				container.addClass('cb-lightbox-is-loading');

				$img.one('error', function(){
					$img.remove();
					elementPlaceholder.remove();
					error(container);
				}).one('load', function(e){

					slide.removeClass('cb-lightbox-hide-image');

					setTimeout(function(){
						elementPlaceholder.hide();
						container.removeClass('cb-lightbox-is-loading');
					}, Math.min( 300, Math.max( 1000, $img.data('height') / 1600 )));
				}).attr('src', source);

				if(($img[0].complete || $img[0].readyState == 'complete') && $img[0].naturalWidth && $img[0].naturalHeight){
					elementPlaceholder.hide();
					container.removeClass('cb-lightbox-is-loading');
					slide.removeClass('cb-lightbox-hide-image');
				}

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
				var values = fitImage(slide);

				setTranslate(slide, {
					width: values.width,
					height: values.height,
					top: values.top,
					left: values.left,
					opacity: 0
				});

				setTimeout(function(){
					animate(slide, {
						opacity: 1,
					},  $s.slideDuration);
				}, 20);
			}
			
			return slide;
		}

		function open(item, $s){
			var source = item.attr('href'),
				slide = getSlide(source, false, item),
				container = $('.cb-lightbox');

			animate(container, false, $s.slideDuration);

			if(slide && $s.animationEffect == 'zoom'){
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

				animate(slide, {
					top: values.top,
					left: values.left,
					scaleX: values.scaleX,
					scaleY: values.scaleY
				}, $s.animationDuration);

			}else if(slide && $s.animationEffect == 'fade'){

				var values = fitImage(slide);

				setTranslate(slide, {
					width: values.width,
					height: values.height,
					top: values.top,
					left: values.left,
					opacity: 0
				});

				setTimeout(function(){
					animate(slide, {
						opacity: 1,
					}, $s.animationDuration);
				}, 10);
			}

			setTimeout(function(){
				container.addClass('cb-lightbox-is-open');
			});
		}

		function close(){
			clearTimeout(runningTimeout);

			closing = true;

			var el = $(".cb-lightbox-is-selected"),
				previewImage = el.find('img'),
				container = $('.cb-lightbox'),
				$s = container.data('settings'),
				slide = container.find('.cb-lightbox-slide');

			if(!previewImage.length){
				previewImage = el;
			}

			animate(container, false, $s.animationDuration);

			container
				.removeClass('cb-lightbox-is-open')
				.addClass('cb-lightbox-is-closing');

			if($s.animationEffect == 'zoom' && el.is(':visible')){
				var	scaleWidth =  previewImage.width() / slide.width(),
					scaleHeight = previewImage.height() / slide.height(),
					offsetTop = previewImage.offset().top - $(window).scrollTop();
					offsetLeft = previewImage.offset().left;

				animate(slide, {
					top: offsetTop,
					left: offsetLeft,
					scaleX: scaleWidth,
					scaleY: scaleHeight,
				}, $s.animationDuration);

			}else if($s.animationEffect == 'fade'){
				
				animate(slide, {
					opacity: 0,
				}, $s.animationDuration);

				$('.cb-lightbox').removeClass('cb-lightbox-is-open');
			}

			setTimeout(function(){
				detroyDraggable();
				$(".cb-lightbox").remove();
				$("html").removeClass("cb-lightbox-lock cb-lightbox-margin");
				el.removeClass('cb-lightbox-is-selected');
				closing = false;
			}, $s.animationDuration);
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
		    	image = slide.find('.cb-lightbox-image');
		    	lastoffset = slide.data('lastTransform');

		    if(!lastoffset){
		    	return;
		    }

		    if(lastoffset.x > $s.zoomOffset[3] && image.width() > $(window).width()){
		    	moveX = $s.zoomOffset[3];
		    }else if(Math.abs(lastoffset.x) - $s.zoomOffset[1] > image.width() - $(window).width() && image.width() > $(window).width()){
		    	moveX = $(window).width() - image.width() - $s.zoomOffset[1];
		    }else{
		    	moveX = lastoffset.x;
		    }

		    if(lastoffset.y > $s.zoomOffset[0] && image.height() > $(window).height()){
		    	moveY = $s.zoomOffset[0];
		    }else if(Math.abs(lastoffset.y) - $s.zoomOffset[2] > image.height() - $(window).height() && image.height() > $(window).height()){
		    	moveY = $(window).height() - image.height() - $s.zoomOffset[2];
		    }
		    else{
		    	moveY = lastoffset.y;
		    }	

		    if(lastoffset.x != moveX || lastoffset.y != moveY){
		    	animate(slide, {
		    		top: moveY,
		    		left: moveX,
		    	}, 250);
		    }
	    }

	    function slideTo(direction){
	    	var container = $(".cb-lightbox"),
				$s = container.data('settings'),
	    		group = container.data('group'),
				images = $('a[data-group="'+ group +'"]');

			if(container.hasClass('cb-lightbox-is-zoomed')){
				return;
			}

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

			var slide = $('.cb-lightbox-slide'),
				wrapImage = slide.find('.cb-lightbox-slide-image');

			slide.removeClass('cb-lightbox-slide-current').addClass('cb-lightbox-image-remove');

			animate(wrapImage, {
				opacity: 0,
			}, $s.slideDuration);

			setTimeout(function(){
				slide.remove();
			}, $s.slideDuration);

			container.find('.cb-counter-current').text(_this_index + 1);

			new_image = images.eq(_this_index);
			source = new_image.attr('href');

			getSlide(source, _this_index, new_image, true);
	    }

	    function getDistance( point2, point1, coordinate ) {
			if ( !point1 || !point2 ) {
				return 0;
			}

			if ( coordinate === 'x' ) {
				return point2 - point1;

			} else if ( coordinate === 'y' ) {
				return point2 - point1;
			}

			return Math.sqrt( Math.pow( point2 - point1, 2 ) + Math.pow( point2 - point1, 2 ) );
		};

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

			captionTpl = $('<div class="cb-lightbox-info"></div>');

			if($s.captionPosition == 'inside'){
				captionTpl.appendTo(tpl.find(".cb-lightbox-slide"));
			}else{
				captionTpl.appendTo(tpl.find(".cb-lightbox-content"));
			}

			if(grouplength > 1 && $s.counter){
				var counter = $('<div class="cb-lightbox-counter"></div>');

				$('<span class="cb-counter-current"></span> / <span class="cb-counter-total"></span>').appendTo(counter);

				counter.find(".cb-counter-total").text($('a[data-group="'+ group +'"]').length);
				counter.find(".cb-counter-current").text(_this_index + 1);

				tpl.find(".cb-lightbox-info").append(counter);
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

			if ($.type($s.margin) === "number" ) {
                margin = [ $s.margin, $s.margin, $s.margin, $s.margin ];
            }

            if ($s.margin.length == 2) {
                margin = [$s.margin[0], $s.margin[1], $s.margin[0], $s.margin[1]];
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
				userYTouch = 0,
				startTime,
				endX,
				endY,
				distanceX,
				distanceY;

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


			$(document).on("mousedown touchstart", '.cb-lightbox-draggable', function(e){

				clickTimer = true;
				setTimeout(function(){
					clickTimer = false;
				}, 300);

				if(closing){
					return;
				}

				startTime = new Date().getTime();

				if(e.type == "mousedown"){
					if(e.which != 1){
						return false;
					}
				}else{
					userXTouch = e.originalEvent.touches[0].clientX - $(this).offset().left;
					userYTouch = e.originalEvent.touches[0].clientY - $(this).offset().top;
				}

				if(!$(".cb-lightbox").hasClass("cb-lightbox-is-zoomed")){
					return false;
				}

				e.preventDefault();

			    var slide = $(this),
			    	$s = slide.closest('.cb-lightbox').data('settings'),
			    	image = slide.find('.cb-lightbox-image');

			    var lastOffset = slide.data('lastTransform'),
			    	lastOffsetX = lastOffset ? lastOffset.x : 0,
			        lastOffsetY = lastOffset ? lastOffset.y : 0;

			    if(e.type == "touchstart"){
			    	startX = e.originalEvent.touches[0].pageX - lastOffsetX;
					startY = e.originalEvent.touches[0].pageY - lastOffsetY;
			    }else{
			    	startX = e.pageX - lastOffsetX,
			    	startY = e.pageY - lastOffsetY;
			    }

			    $(document).bind("mousemove.cb-lightbox touchmove.cb-lightbox", function(e){
			    	if(e.type == "touchmove"){
			    		var newX = e.originalEvent.touches[0].pageX - startX,
				            newY = e.originalEvent.touches[0].pageY - startY;
			    	}else{
				        var newX = e.pageX - startX,
				            newY = e.pageY - startY;
			        }

			        //check element is dragging
			        if(lastOffsetX != newX && lastOffsetY != newY){
						slide.addClass("cb-lightbox-is-dragging");
						clickTimer = false;
			        }

			        if(image.width() < $(window).width()){
			        	newX = ($(window).width() - image.width()) / 2;
			        }else if(newX > $s.zoomOffset[3]){
			        	newX = ((newX - $s.zoomOffset[3]) / 3) + $s.zoomOffset[3];
			        }else if(Math.abs(newX) - $s.zoomOffset[1] > image.width() - $(window).width() && image.width() > $(window).width()){
			        	var maxX = $(window).width() - image.width();

			        	newX = ((-Math.abs(newX + $s.zoomOffset[1]) - maxX) / 3) + maxX - $s.zoomOffset[1];
			        }


			        if(image.height() < $(window).height()){
			        	newY = ($(window).height() - image.height()) / 2;
			        }else if(newY > $s.zoomOffset[0]){
			        	newY = ((newY - $s.zoomOffset[0]) / 3) + $s.zoomOffset[0];
			        }else  if(Math.abs(newY) - $s.zoomOffset[2] > image.height() - $(window).height() && image.height() > $(window).height()){
			        	var maxY = $(window).height() - image.height();

			        	newY = ((-Math.abs(newY + $s.zoomOffset[2]) - maxY) / 3) + maxY - $s.zoomOffset[2];
			        }

			        endX = newX;
			        endY = newY;

			        distanceX = getDistance(newX, lastOffsetX, 'x');
			        distanceY = getDistance(newY, lastOffsetY, 'y');

			        setTranslate(slide, {
			        	top: newY,
			        	left: newX
			        });
			    });
			});

			$(document).on("mouseup", function(e){

				if(e.type == "mouseup" && !$("html").hasClass("cb-lightbox-touch")){
					e.preventDefault();

					var item = $(".cb-lightbox-draggable");
					
					$(this).unbind("mousemove.cb-lightbox");
					
					if(e.which != 1 || $('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
						return false;
					}

					if(!$(e.target).closest('.cb-lightbox-slide').hasClass("cb-lightbox-draggable")){
						$(this).unbind("mousemove.cb-lightbox");
						return false
					}
					
					if(clickTimer){
						//handle after click

						if(!item.hasClass("cb-lightbox-is-dragging")){

							if(closing){
								return;
							}

							//move to click position
							var userX = e.offsetX,
								userY = e.offsetY;

						   	if($(".cb-lightbox").hasClass("cb-lightbox-is-zoomed")){
						   		detroyDraggable();
						   	}else{
								initDraggable(userX, userY);
						   	}

						}else{
						    $(this).off("mousemove.cb-lightbox");
						}

					}else{
						//handle all other

						if($('.cb-lightbox-is-zoomed').length){

							var dMs  = Math.max( (new Date().getTime() ) - startTime, 1),
								speed = 500;

							// Speed in px/ms
							var velocityX = distanceX / dMs * 0.5,
								velocityY = distanceY / dMs * 0.5;

								newOffsetX = endX + (velocityX * speed);
								newOffsetY = endY + (velocityY * speed);

							animate(item, {
								left: newOffsetX,
								top: newOffsetY
							}, 500);

					        setTimeout(function(){
					        	reposition();
					        }, 520);
						}	
					}

					item.removeClass("cb-lightbox-is-dragging");					
				}
			});

			$(document).on("touchend", function(e){
				var item = $(".cb-lightbox-draggable");
				$(this).unbind("mousemove.cb-lightbox");

				if(clickTimer == false && item.hasClass("cb-lightbox-is-dragging")){
					reposition();
				}

				if(!item.hasClass("cb-lightbox-is-dragging") && $(e.target).closest('.cb-lightbox-slide').hasClass("cb-lightbox-draggable")){
					$(".cb-lightbox").toggleClass("cb-lightbox-is-zoomed");

				   	if($(e.target).closest('.cb-lightbox-slide').hasClass("cb-lightbox-draggable") && !item.hasClass("cb-lightbox-draggable-init")){
				   		initDraggable(userXTouch, userYTouch);
				   	}else{
						detroyDraggable();
				   	}
				}

				item.removeClass("cb-lightbox-is-dragging");
			});

			$(window).on("resize", function(){
				if(!$("html").hasClass("cb-lightbox-touch")){
					detroyDraggable(true);
				}

				if($('.cb-lightbox').length){
					var slide = $('.cb-lightbox-slide'), 
						values = fitImage(slide);

					animate(slide, {
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

			item.on("click", function(event){
				event.preventDefault();

				init(item, settings);
			});
		});
	}
})(jQuery);
