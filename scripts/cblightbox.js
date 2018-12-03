/*
 * CBLightbox 3.7.0 jQuery
 * 2018-09-27
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
			afterInit: $.noop,
			afterFit: $.noop,
		}

		function transformImage(w, h, x, y, scaleW, scaleH, updateData){
			var slide = $('.cb-lightbox-slide-current');

			slide.css({
	        	'transform': 'translate3d(' + x + 'px, ' + y + 'px, 0px) scale(' + scaleW + ', ' + scaleH + ')',
	        });

			if(w || h){
				slide.css({
					'width': w,
			    	'height': h
				});
			}

			if(updateData){
				slide.data('lastTransform', {x: x, y: y});
			}
		}

		function initDraggable(userX, userY){
	    	if(!$("html").hasClass("cb-lightbox-dragging-active") || $('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
	    		return;
	    	}

	    	clearTimeout(runningTimeout);

	    	$(".cb-lightbox-slide").addClass("cb-lightbox-draggable-init");

	        var slide = $('.cb-lightbox-slide'),
				$s = slide.closest('.cb-lightbox').data('settings'),
	        	image = slide.find(".cb-lightbox-image"),
	        	clickX = userX / slide.width(),
				clickY = userY / slide.height();

	        slide.css('transition-duration', $s.zoomDuration + 'ms');

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

	        transformImage(false, false, positionX, positionY, scaleWidth, scaleHeight, true);

		    setTimeout(function(){
		    	slide.css('transition-duration', '');

		    	transformImage(image.data('width'), image.data('height'), positionX, positionY, 1, 1, false);

		    }, $s.zoomDuration);
	    }

	    function detroyDraggable(disableAnimation){
	    	var slide = $(".cb-lightbox-slide"),
				$s = slide.closest('.cb-lightbox').data('settings'),
				image = slide.find('.cb-lightbox-image');

	    	if(!slide.hasClass("cb-lightbox-draggable-init")){
	    		return
	    	}

	    	var	scaleWidth = slide.data('lastWidth') / image.width(),
	       		scaleHeight = slide.data('lastHeight') / image.height(),
	       		duration = 0;

	    	if(typeof disableAnimation === 'undefined'){
	    		disableAnimation = false;
	    	}

	    	if(!disableAnimation){
	    		slide.css('transition-duration', $s.zoomDuration + 'ms');
	    		duration = $s.zoomDuration;

	    		setTimeout(function(){
	    			transformImage(false, false, slide.data('lastLeft'), slide.data('lastTop'), scaleWidth, scaleHeight, false);
		    	});
	    	}

	    	setTimeout(function(){
	    		slide.css('transition-duration', '');

		    	transformImage(slide.data('lastWidth'), slide.data('lastHeight'), slide.data('lastLeft'), slide.data('lastTop'), 1, 1, false);

	    		$("html").removeClass("cb-lightbox-dragging-active");
		   		slide.removeClass("cb-lightbox-draggable-init")
		   		slide.data('lastTransform', '');

	    	}, $s.zoomDuration);
	    }

	    function updateCaption(element){
			$(".cb-lightbox-caption").remove();

			caption = element.data("caption");
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

		function error(container){
			$('<div class="cb-lightbox-error">Sorry, this image can\'t loaded!</div>').appendTo(container.find('.cb-lightbox-content'));

			container
				.removeClass('cb-lightbox-is-loading')
				.addClass('cb-lightbox-error-show');
		}

		function LoadImage(source, i, el){
			if(typeof i != 'undefined'){
				$(".counter-current").text(i + 1);
			}

			if(typeof el == 'undefined'){
				el = $('a[href="' + source + '"]');
			}

			$(".cb-lightbox-is-selected").removeClass("cb-lightbox-is-selected");
			el.addClass("cb-lightbox-is-selected");

			var container = $('.cb-lightbox'),
				$s = container.data('settings'),
				placeholderImage;

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

			updateCaption(el);

			wrapImage.appendTo(slide);
			slide.appendTo($('.cb-lightbox-slides'));
			slide.data('type', type);

			if($('.cb-lightbox-slide').length > 1 || $('.cb-lightbox-error').length){
				wrapImage
					.addClass('cb-lightbox-el-is-animating')
					.css({
						'opacity': 0,
						'transition-duration': $s.slideDuration + 'ms',
					});

				cleanDom();

				wrapImage.css({
					opacity: ''
				});
			}else{

				if($s.animationEffect == 'zoom'){
					container.find('.cb-lightbox-overlay').css({
						'opacity': 0,
						'transition-duration': $s.animationDuration + 'ms'
					});

					cleanDom();

					container.find('.cb-lightbox-overlay').css('opacity', 1);
					wrapImage.css({
						'transition-duration': $s.slideDuration + 'ms'
					});

				}else{
					container.css('opacity', 0);

					cleanDom();

					container.css({
						'opacity': '',
						'transition-duration': $s.animationDuration + 'ms'
					}).addClass('cb-lightbox-is-open');
				}
			}

	        $('.cb-lightbox-error').remove();
			$('.cb-lightbox-content').removeClass('cb-lightbox-error-show');

			if(type == "image"){

				var previewImage = el.find('img'),
					$img = $('<img />'),
					elementPlaceholder = $('<img />');

				if(previewImage.length && previewImage.attr('src').substr(0, 21) != 'data:image/png;base64'){
					placeholderImage = el.find('img').attr('src');
				}else{
					placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
				}

				elementPlaceholder
					.addClass('cb-lightbox-image-placeholder')
					.attr('src', placeholderImage)
					.prependTo(wrapImage);

				if($('html').hasClass('cb-lightbox-animate-opening')){
					var offsetTop = previewImage.offset().top - $(window).scrollTop();
						offsetLeft = previewImage.offset().left;

					transformImage(previewImage.width(), previewImage.height(), offsetLeft, offsetTop, 1, 1, false);
				};

				//fix for elementImage - load visibile image
				elementPlaceholder.css('opacity', 0.999);

				container.addClass('cb-lightbox-is-loading');

				var elementImage = $img.one('error', function(){
					elementImage.remove();
					elementPlaceholder.remove();

					error(container);
				}).one('load', function(e){
					setTimeout(function(){
						elementPlaceholder.hide();
						container.removeClass('cb-lightbox-is-loading');
					}, Math.min( 300, Math.max( 1000, elementImage.data('height') / 1600 )));
				})
				.addClass('cb-lightbox-image')
				.prependTo(wrapImage)
				.attr('src', source);

				getImageSize(el, elementImage, function(width, height){
					elementImage.data({
						'width': width,
						'height': height,
					});

					fitImage();
				});

				if(($img[0].complete || $img[0].readyState == 'complete') && $img[0].naturalWidth && $img[0].naturalHeight){
					elementPlaceholder.hide();
					container.removeClass('cb-lightbox-is-loading');
				}

			}else if(type == "iframe"){
				var iframe = $('<iframe src="" class="cb-lightbox-iframe" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen=""></iframe>').appendTo(wrapImage);

				container.addClass('cb-lightbox-is-loading');

				fitImage();

				iframe.attr("src", source);
				iframe.on("load", function(){
					container.removeClass('cb-lightbox-is-loading');
				});
			}
		};

		function fitImage(){
			var el = $(".cb-lightbox-is-selected"),
				container = $('.cb-lightbox'),
				$s = container.data('settings'),
				slide = container.find('.cb-lightbox-slide-current'),
				img = slide.find('.cb-lightbox-image'),
				type = slide.data('type'),
				animationDuration = 0;

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

				if(el.attr("data-height")){
					imgHeight = container.height();
					imgWidth = imgHeight / el.data("height") * el.data("width");
				}else{
					//Default 16/9
					imgHeight = container.height();
					imgWidth = imgHeight / 9 * 16;
				}
			}

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

			var wrapperHeight = container.height() - (margin[0] + margin[2]),
				wrapperWidth = container.width() - (margin[1] + margin[3]);

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

			positionTop = Math.max(($(window).height() - newImgHeight - captionHeight) / 2, margin[0]);
			positionLeft = (container.width() - newImgWidth) / 2;

			if($('html').hasClass('cb-lightbox-animate-opening')){
				var	scaleWidth = newImgWidth / el.find('img').width(),
   					scaleHeight = newImgHeight / el.find('img').height(),
   					animationDuration = $s.animationDuration;

				elPostion = el.offset();

				slide.css('transition-duration', animationDuration + 'ms');

				transformImage(false, false, positionLeft, positionTop, scaleWidth, scaleHeight, false);
			}

			slide.data({
	 			'lastHeight': newImgHeight,
	 			'lastWidth': newImgWidth,
	 			'lastLeft': positionLeft,
	 			'lastTop': positionTop
	 		});

			runningTimeout = setTimeout(function(){
				slide.css('transition-duration', '');

				transformImage(newImgWidth, newImgHeight, positionLeft, positionTop, 1, 1, false);

		 		if ($.isFunction($s.afterFit)) {
			 		$s.afterFit.call(this, slide);
				}
			}, animationDuration);

			if((imgWidth > $(window).width() || imgHeight > $(window).height()) && $s.zoom){
				slide.addClass('cb-lightbox-draggable');
			}else{
				slide.removeClass('cb-lightbox-draggable');
			}

	 		$('html').removeClass('cb-lightbox-animate-opening');

	 		slide.addClass('cb-lightbox-is-open');
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
		    	slide.css('transition-duration', $s.animationDuration + 'ms');
	    		slide.css('transform','translate3d(' + moveX + 'px, ' + moveY + 'px, 0px)');
    			slide.data('lastTransform', {x: moveX, y: moveY });
		    }

	        setTimeout(function(){
	        	slide.css('transition-duration', '');
		    }, 100);
	    }

	    function slide(direction){
	    	var container = $(".cb-lightbox"),
				$s = container.data('settings'),
	    		group = container.data('group'),
				images = $('a[data-group="'+ group +'"]');

			if($('html').hasClass('cb-lightbox-dragging-active')){
				return;
			}

			if(direction == 'previews'){
				_this_index = _this_index - 1;

				if(_this_index < 0){
					_this = images.length-1;
					_this_index = _this;
				}

			}else if(direction == 'next'){
				_this_index = _this_index + 1;

				if(_this_index > images.length-1){
					_this_index = 0;
				}
			}

			var slide = $('.cb-lightbox-slide'),
				wrapImage = slide.find('.cb-lightbox-slide-image');

			slide.removeClass('cb-lightbox-slide-current').addClass('cb-lightbox-image-remove');

			wrapImage.css({
				'opacity': 1,
				'transition-duration': $s.slideDuration + 'ms',
			});

			cleanDom();

			wrapImage.css({
				'opacity': 0,
			});

			setTimeout(function(){
				slide.remove();
			},$s.slideDuration);

			container.find('.cb-counter-current').text(_this_index + 1);

			new_image = images.eq(_this_index);
			source = new_image.attr('href');

			LoadImage(source, _this_index, new_image);
	    }

		function close(){
			clearTimeout(runningTimeout);

			closing = true;

			var el = $(".cb-lightbox-is-selected"),
				previewImage = el.find('img'),
				container = $('.cb-lightbox'),
				$s = container.data('settings'),
				slide = container.find('.cb-lightbox-slide');

			if($s.animationEffect == 'zoom' && el.is(':visible')){
				var	scaleWidth =  previewImage.width() / slide.width(),
					scaleHeight = previewImage.height() / slide.height(),
					offsetTop = previewImage.offset().top - $(window).scrollTop();
					offsetLeft = previewImage.offset().left;

				$('html').addClass('cb-lightbox-animate-closing');

				slide.css('transition-duration', $s.animationDuration + 'ms');

				transformImage(false, false, offsetLeft, offsetTop, scaleWidth, scaleHeight, false);

				container.find('.cb-lightbox-overlay').css('opacity', 0);

				setTimeout(function(){
					detroyDraggable();
					$(".cb-lightbox").remove();
					$("html").removeClass("cb-lightbox-lock cb-lightbox-margin cb-lightbox-animate-closing");
					el.removeClass('cb-lightbox-is-selected');

					closing = false;
				}, $s.animationDuration);
			}else{
				container.css({
					'opacity': 0,
				});

				container.removeClass('cb-lightbox-is-open');

				setTimeout(function(){
					detroyDraggable();
					$(".cb-lightbox").remove();
					$("html").removeClass("cb-lightbox-lock cb-lightbox-margin");
					el.removeClass('cb-lightbox-is-selected');

					closing = false;
				}, $s.animationDuration);
			}
		}

		function init(item, settings){
			var $s = settings,
				source = item.attr('href'),
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

			//set zoomOffset to data
			var zoomOffset = $s.zoomOffset;

			if ($.type(zoomOffset) === "number" ) {
                zoomOffset = [ zoomOffset, zoomOffset, zoomOffset, zoomOffset ];
            }

            if (zoomOffset.length == 2) {
                zoomOffset = [zoomOffset[0], zoomOffset[1], zoomOffset[0], zoomOffset[1]];
            }

            $s.zoomOffset = zoomOffset;

			tpl.data({
				'group': group,
				'settings': $s
			});

			tpl.appendTo("body");

			if ($.isFunction($s.afterInit)) {
		 	   $s.afterInit.call(this, tpl);
			}

			if($s.animationEffect == 'zoom'){
				$('html').addClass('cb-lightbox-animate-opening');
			}

			LoadImage(source, false, item);

		}

		if (!$(document).data('cb-lightbox-initialized')) {
			var clickTimer = false,
				userXTouch = 0,
				userYTouch = 0;

			$(document).on('click', '.cb-lightbox-arrow', function(){
				if($(this).hasClass('cb-lightbox-arrow-prev')){
					slide('previews');
				}else{
					slide('next');
				}
			});

			$(document).on("keyup", function(e){
				if(e.keyCode == 37){
					slide('previews');
				}else if(e.keyCode == 39){
					slide('next');
				}
			});

			$(document).on("click", ".cb-lightbox-content, .cb-lightbox-close", function(e){
				if($('html').hasClass('cb-lightbox-animate-closing')){
					return;
				}

				if(($(e.target).hasClass("cb-lightbox-slide") && $("html").hasClass("cb-lightbox-dragging-active")) || ($(e.target).hasClass("cb-lightbox-close") || $(e.target).hasClass("cb-lightbox-content")) && !$(e.target).hasClass("cb-lightbox-arrow")){
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

				if(e.type == "mousedown"){
					if(e.which != 1){
						return false;
					}
				}else{
					userXTouch = e.originalEvent.touches[0].clientX - $(this).offset().left;
					userYTouch = e.originalEvent.touches[0].clientY - $(this).offset().top;
				}

				if(!$("html").hasClass("cb-lightbox-dragging-active")){
					return false;
				}

				e.preventDefault();

			    var container = $(this),
			    	$s = container.closest('.cb-lightbox').data('settings'),
			    	image = container.find('.cb-lightbox-image');

			    var lastOffset = container.data('lastTransform'),
			    	lastOffsetX = lastOffset ? lastOffset.x : 0,
			        lastOffsetY = lastOffset ? lastOffset.y : 0;

			    if(e.type == "touchstart"){
			    	var startX = e.originalEvent.touches[0].pageX - lastOffsetX,
			    		startY = e.originalEvent.touches[0].pageY - lastOffsetY;
			    }else{
			    	var startX = e.pageX - lastOffsetX,
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
						container.addClass("cb-dragging");
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
			        	newY = ($(window).height() - image.height()) / 2;;
			        }else if(newY > $s.zoomOffset[0]){
			        	newY = ((newY - $s.zoomOffset[0]) / 3) + $s.zoomOffset[0];
			        }else  if(Math.abs(newY) - $s.zoomOffset[2] > image.height() - $(window).height() && image.height() > $(window).height()){
			        	var maxY = $(window).height() - image.height();

			        	newY = ((-Math.abs(newY + $s.zoomOffset[2]) - maxY) / 3) + maxY - $s.zoomOffset[2];
			        }

			        container.css('transform','translate3d(' + newX + 'px, ' + newY + 'px, 0px)');
			        container.data('lastTransform', {x: newX, y: newY });
			    });
			});

			$(document).on("mouseup", function(e){
				if(e.type == "mouseup" && !$("html").hasClass("cb-lightbox-touch")){

					var item = $(".cb-lightbox-draggable");
					$(this).unbind("mousemove.cb-lightbox");
					e.preventDefault();

					if(clickTimer == false && item.hasClass("cb-dragging")){
						reposition();
					}

					if(e.which != 1 || $('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
						return false;
					}

					if(!$(e.target).closest('.cb-lightbox-slide').hasClass("cb-lightbox-draggable")){
						$(this).unbind("mousemove.cb-lightbox");
						return false
					}

					if(!item.hasClass("cb-dragging")){

						if(clickTimer == false){
							return;
						}

						if(closing){
							return;
						}

						//move to click position
						var userX = e.offsetX,
							userY = e.offsetY;

						$("html").toggleClass("cb-lightbox-dragging-active");

					   	if($("html").hasClass("cb-lightbox-dragging-active")){
					   		initDraggable(userX, userY);
					   	}else{
							detroyDraggable();
					   	}

					}else{
					    $(this).off("mousemove.cb-lightbox");
					}

					item.removeClass("cb-dragging");
				}
			});

			$(document).on("touchend", function(e){
				var item = $(".cb-lightbox-draggable");
				$(this).unbind("mousemove.cb-lightbox");

				if(clickTimer == false && item.hasClass("cb-dragging")){
					reposition();
				}

				if(!item.hasClass("cb-dragging") && $(e.target).closest('.cb-lightbox-slide').hasClass("cb-lightbox-draggable")){
					$("html").toggleClass("cb-lightbox-dragging-active");

				   	if($(e.target).closest('.cb-lightbox-slide').hasClass("cb-lightbox-draggable") && !item.hasClass("cb-lightbox-draggable-init")){
				   		initDraggable(userXTouch, userYTouch);
				   	}else{
						detroyDraggable();
				   	}
				}

				item.removeClass("cb-dragging");
			});

			$(window).on("resize", function(){
				if(!$("html").hasClass("cb-lightbox-touch")){
					detroyDraggable(true);
				}

				if($('.cb-lightbox').length){
					fitImage();
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
