/*
* CBLightbox 3.6.1 jQuery
* Copyright 2018 Christin Bombelka
*/

(function($){
	$.fn.cblightbox = function(options){
		var caption,
			type,
			tpl;

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

		var settings = $.extend(true, {
			maxHeight: 9999,
			maxWidth: 9999,
			margin: 40,
			mobilemargin: 0,
			zoom : false,
			zoomDuration : 300,
			breakpoint : 800,
			counter : true,
			captionPosition : 'outside', // inside/outside
			animationEffect : 'zoom', //fade/zoom
			animationDuration : 500,
			animationFade: 500,
			afterInit: $.noop,
			afterFit: $.noop,
		}, options);

		function transformImage(w, h, x, y, scaleW, scaleH, updateData){
			container = $('.cb-lightbox-image-current');

			container.css({
	        	'transform': 'translate3d(' + x + 'px, ' + y + 'px, 0px) scale(' + scaleW + ', ' + scaleH + ')',
	        });

			if(w || h){
				container.css({
					'width': w,
			    	'height': h
				});
			}

			if(updateData){
				container.data('lastTransform', {x: x, y: y});
			}
		}

		function initDraggable(userX, userY){
	    	if(!$("html").hasClass("cb-dragging-active") || $('.cb-lightbox').hasClass('cb-lightbox-is-loading')){
	    		return;
	    	}

	    	$(".cb-lightbox-wrap-image").addClass("cb-lightbox-draggable-init");
	        image = $(".cb-lightbox-image");
	        container = image.closest('.cb-lightbox-wrap-image');

	        container.css('transition-duration', settings.zoomDuration + 'ms');

			var clickX = userX / container.width(),
				clickY = userY / container.height();

			if(image.data('width') > $(window).width()){
				var positionX = Math.max(image.data('width') * clickX - ($(window).width() / 2), 0),
					positionX = -Math.min(image.data('width') - $(window).width(), positionX);
			}else{
				var positionX = ($(window).width() - image.data('width')) / 2;
			}

			if(image.data('height') > $(window).height()){
				var positionY = Math.max(image.data('height') * clickY - ($(window).height() / 2), 0),
					positionY = -Math.min(image.data('height') - $(window).height(), positionY);
			}else{
				var positionY = ($(window).height() - image.data('height')) / 2;
			}

	        scaleWidth = image.data('width') / image.width();
	        scaleHeight = image.data('height') / image.height();

	        transformImage(false, false, positionX, positionY, scaleWidth, scaleHeight, true);

		    setTimeout(function(){
		    	container.css('transition-duration', '');

		    	transformImage(image.data('width'), image.data('height'), positionX, positionY, 1, 1, false);

		    }, settings.zoomDuration);
	    }

	    function detroyDraggable(disableAnimation){
	    	var container = $(".cb-lightbox-wrap-image");

	    	if(!container.hasClass("cb-lightbox-draggable-init")){
	    		return
	    	}

	    	var	scaleWidth = container.data('lastWidth') / image.width(),
	       		scaleHeight = container.data('lastHeight') / image.height(),
	       		duration = 0;

	    	if(typeof disableAnimation === 'undefined'){
	    		disableAnimation = false;
	    	}

	    	if(!disableAnimation){
	    		container.css('transition-duration', settings.zoomDuration + 'ms');
	    		duration = settings.zoomDuration;

	    		setTimeout(function(){
	    			transformImage(false, false, container.data('lastLeft'), container.data('lastTop'), scaleWidth, scaleHeight, false);
		    	});
	    	}

	    	setTimeout(function(){
	    		container.css('transition-duration', '');

		    	transformImage(container.data('lastWidth'), container.data('lastHeight'), container.data('lastLeft'), container.data('lastTop'), 1, 1, false);

	    		$("html").removeClass("cb-dragging-active");
		   		container.removeClass("cb-lightbox-draggable-init")
		   		container.data('lastTransform', '');

	    	}, duration);
	    }

	    function updateCaption(element){
			$(".cb-lightbox-caption").remove();

			caption = element.data("caption");
			if(caption){
				$("<div class='cb-lightbox-caption'>"+ caption +"</div>").appendTo($(".cb-lightbox-info"));
			}
		}

		function getImageSize(img, callback) {
		    var $img = $(img);

		    var wait = setInterval(function() {
		        var w = $img[0].naturalWidth,
		            h = $img[0].naturalHeight;
		        if (w && h) {
		            clearInterval(wait);
		            callback.apply(this, [w, h]);
		        }
		    }, 100);
		}

		function LoadImage(source, i, el){
			if(typeof i != 'undefined'){
				$(".counter-current").text(i + 1);
			}

			if(typeof el == 'undefined'){
				el = $('a[href="' + source + '"]');
			}

			$(".cb-selected").removeClass("cb-selected");
			el.addClass("cb-selected");

			if(source.match(/(^data:image\/[a-z0-9+\/=]*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg|ico)((\?|#).*)?$)/i) ) {
                type = 'image';
            }else{
            	type = 'iframe';
            }

			var wrapImage = $('<div class="cb-lightbox-wrap-image cb-lightbox-image-current"></div>');

			wrapImage.appendTo($('.cb-lightbox-images'));
			wrapImage.data('type', type);

			if($('.cb-lightbox-wrap-image').length > 1 || $('.cb-lightbox-error').length){
				wrapImage.css('display', 'none');
			}

	        $('.cb-lightbox-error').remove();
			$('.cb-lightbox-content').removeClass('cb-lightbox-error-show');
			$('.cb-lightbox').fadeIn(settings.animationDuration);

			if(type == "image"){
				elementImage = $('<img src="" alt="image" class="cb-lightbox-image">');
				elementPlaceholder = $('<img src="" alt="image" class="cb-lightbox-image-placeholder">');

				elementImage.attr('src', source);
				elementPlaceholder.attr('src', el.find('img').attr('src'));

				elementImage.prependTo(wrapImage);
				elementPlaceholder.prependTo(wrapImage);

				previewImage = el.find('img');

				if($('html').hasClass('cb-lightbox-animate-opening')){

					var offsetTop = previewImage.offset().top - $(window).scrollTop();
						offsetLeft = previewImage.offset().left;

					transformImage(previewImage.width(), previewImage.height(), offsetLeft, offsetTop, 1, 1, false);
				};

				getImageSize(elementImage, function(width, height){
					elementImage.data({
						'width': width,
						'height': height,
					});

					fitImage();
				});

				$('<img/>').one('error', function(){
					elementImage.remove();
					elementPlaceholder.remove();

					$('<div class="cb-lightbox-error">Sorry, this image can\'t loaded!</div>').appendTo($('.cb-lightbox-content'));

					$('.cb-lightbox')
						.removeClass('cb-lightbox-is-loading')
						.addClass('cb-lightbox-error-show');

				}).one('load', function(e){

					setTimeout(function(){
						$('.cb-lightbox').removeClass('cb-lightbox-is-loading');
					}, 10);

					setTimeout(function(){
						elementPlaceholder.hide();
					}, 300);

				}).attr('src', source);

				if(!elementImage[0].complete){
					$('.cb-lightbox').addClass('cb-lightbox-is-loading');
				}

			}else if(type == "iframe"){
				$('<iframe src="" class="cb-lightbox-iframe" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen=""></iframe>').appendTo(wrapImage);

				$(".cb-lightbox-iframe").attr("src", source);
				$(".cb-lightbox-iframe").on("load", function(){
					fitImage();
				});
			}
		};

		function fitImage(){
			var el = $(".cb-selected"),
				box = $('.cb-lightbox'),
				container = box.find('.cb-lightbox-image-current'),
				img = container.find('.cb-lightbox-image'),
				type = container.data('type'),
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
					imgHeight = box.height();
					imgWidth = imgHeight / el.data("height") * el.data("width");
				}else{
					//Default 16/9
					imgHeight = box.height();
					imgWidth = imgHeight / 9 * 16;
				}
			}

			if ($(window).width() < settings.breakpoint) {
				var margin = settings.mobilemargin;
			}else{
				var margin = settings.margin;
			}

			if ($.type(margin) === "number" ) {
                margin = [ margin, margin, margin, margin ];
            }

            if (margin.length == 2) {
                margin = [margin[0], margin[1], margin[0], margin[1]];
            }

			var wrapperHeight = box.height() - (margin[0] + margin[2]),
				wrapperWidth = box.width() - (margin[1] + margin[3]);

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
			positionLeft = (box.width() - newImgWidth) / 2;

			if($('html').hasClass('cb-lightbox-animate-opening')){
				var	scaleWidth = newImgWidth / el.find('img').width(),
   					scaleHeight = newImgHeight / el.find('img').height(),
   					animationDuration = settings.animationDuration;

				elPostion = el.offset();

				container.css('transition-duration', animationDuration + 'ms');

				transformImage(false, false, positionLeft, positionTop, scaleWidth, scaleHeight, false);
			}

			if((imgWidth > $(window).width() || imgHeight > $(window).height()) && settings.zoom){
				container.addClass('cb-lightbox-draggable');
			}else{
				container.removeClass('cb-lightbox-draggable');
			}

			setTimeout(function(){
				container.css('transition-duration', '');

				transformImage(newImgWidth, newImgHeight, positionLeft, positionTop, 1, 1, false);

		 		container.data({
		 			'lastHeight': newImgHeight,
		 			'lastWidth': newImgWidth,
		 			'lastLeft': positionLeft,
		 			'lastTop': positionTop
		 		});

		 		if ($.isFunction(settings.afterFit)) {
			 		settings.afterFit.call(this, container);
				}

			}, animationDuration);

	 		$('html').removeClass('cb-lightbox-animate-opening');

	 		container.fadeIn(settings.animationFade);
		};

		function reposition(){
	    	//reset dragging position
		    var container = $('.cb-lightbox-wrap-image'),
		    	image = container.find('.cb-lightbox-image');
		    	lastoffset = container.data('lastTransform');

		    if(!lastoffset){
		    	return;
		    }

		    if(lastoffset.x > 0 && image.width() > $(window).width()){
		    	moveX = 0;
		    }else if(Math.abs(lastoffset.x) > image.width() - $(window).width() && image.width() > $(window).width()){
		    	moveX = $(window).width() - image.width();
		    }else{
		    	moveX = lastoffset.x;
		    }

		    if(lastoffset.y > 0 && image.height() > $(window).height()){
		    	moveY = 0;
		    }else if(Math.abs(lastoffset.y) > image.height() - $(window).height() && image.height() > $(window).height()){
		    	moveY = $(window).height() - image.height();
		    }
		    else{
		    	moveY = lastoffset.y;
		    }

		    if(lastoffset.x != moveX || lastoffset.y != moveY){
		    	container.css('transition-duration', settings.animationDuration + 'ms');
	    		container.css('transform','translate3d(' + moveX + 'px, ' + moveY + 'px, 0px)');
    			container.data('lastTransform', {x: moveX, y: moveY });
		    }

	        setTimeout(function(){
	        	container.css('transition-duration', '');
		    }, 100);
	    }

		if (!$(document).data('cb-lightbox-initialized')) {

			$(document).on('click', '.cb-lightbox-arrow', function(){
				var arrow = $(this),
					group = $(".cb-lightbox").data('group'),
					images = $('a[data-cblightbox="'+ group +'"]');

				if(arrow.hasClass('cb-lightbox-arrow-prev')){
					_this_index = _this_index - 1;

					if(_this_index < 0){
						_this = images.length-1;
						_this_index = _this;
					}

				}else{
					_this_index = _this_index + 1;

					if(_this_index > images.length-1){
						_this_index = 0;
					}
				}

				container = $('.cb-lightbox-wrap-image');
				container.removeClass('cb-lightbox-image-current').addClass('cb-lightbox-image-remove');
				container.fadeOut(settings.animationFade, function(){
					$('.cb-lightbox-image-remove').remove();
				});

				$('.cb-lightbox').find('.cb-counter-current').text(_this_index + 1);

				new_image = images.eq(_this_index);
				source = new_image.attr('href');

				updateCaption(new_image);
				LoadImage(source, _this_index, new_image);
			});

			$(document).on("keyup", function(e){
				if(e.keyCode == 39){
					$(".cb-lightbox").find(".cb-lightbox-arrow-next").trigger("click");
				}
				else if(e.keyCode == 37){
					$(".cb-lightbox").find(".cb-lightbox-arrow-prev").trigger("click");
				}
			});

			$(document).on("click", ".cb-lightbox-content, .cb-lightbox-close", function(e){
				if(($(e.target).hasClass("cb-lightbox-wrap-image") && $("html").hasClass("cb-dragging-active")) || ($(e.target).hasClass("cb-lightbox-close") || $(e.target).hasClass("cb-lightbox-content")) && !$(e.target).hasClass("cb-lightbox-arrow")){

					var el = $(".cb-selected"),
						previewImage = el.find('img'),
						box = $('.cb-lightbox'),
						container = box.find('.cb-lightbox-wrap-image');

					if(settings.animationEffect == 'zoom'){
						var	scaleWidth =  previewImage.width() / container.width(),
	   						scaleHeight = previewImage.height() / container.height(),
	   						offsetTop = previewImage.offset().top - $(window).scrollTop();
							offsetLeft = previewImage.offset().left;

						$('html').addClass('cb-lightbox-animate-closing');

						container.css('transition-duration', settings.animationDuration + 'ms');

						transformImage(false, false, offsetLeft, offsetTop, scaleWidth, scaleHeight, false);

						box.find('.cb-lightbox-overlay').fadeOut(settings.animationDuration, function(){
							detroyDraggable();
							$(".cb-lightbox").remove();
							$("html").removeClass("cb-lightbox-lock cb-lightbox-margin cb-lightbox-animate-closing");
						});

					}else{
						box.fadeOut(settings.animationDuration, function(){
							detroyDraggable();
							$(".cb-lightbox").remove();
							$("html").removeClass("cb-lightbox-lock cb-lightbox-margin");
						});
					}
				}
			});

			var clickTimer = false,
				userXTouch = 0,
				userYTouch = 0;
			$(document).on("mousedown touchstart", '.cb-lightbox-draggable', function(e){

				clickTimer = true;
				setTimeout(function(){
					clickTimer = false;
				}, 300);

				if(e.type == "mousedown"){
					if(e.which != 1){
						return false;
					}
				}else{
					userXTouch = e.originalEvent.touches[0].clientX - $(this).offset().left;
					userYTouch = e.originalEvent.touches[0].clientY - $(this).offset().top;
				}

				if(!$("html").hasClass("cb-dragging-active")){
					return false;
				}

				e.preventDefault();

			    var container = $(this),
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
			        }else if(newX > 0){
			        	newX = newX / 3;
			        }else if(Math.abs(newX) > image.width() - $(window).width() && image.width() > $(window).width()){
			        	var maxX = $(window).width() - image.width();

			        	newX = (-Math.abs(newX) - maxX) / 3 + maxX;
			        }

			        if(image.height() < $(window).height()){
			        	newY =  ($(window).height() - image.height()) / 2;;
			        }else if(newY > 0){
			        	newY = newY / 3;
			        }else  if(Math.abs(newY) > image.height() - $(window).height() && image.height() > $(window).height()){
			        	var maxY = $(window).height() - image.height();

			        	newY = (-Math.abs(newY) - maxY) / 3 + maxY;
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

					if(!$(e.target).closest('.cb-lightbox-wrap-image').hasClass("cb-lightbox-draggable")){
						$(this).unbind("mousemove.cb-lightbox");
						return false
					}

					if(!item.hasClass("cb-dragging")){

						if(clickTimer == false){
							return;
						}

						//move to click position
						var userX = e.offsetX,
							userY = e.offsetY;

						$("html").toggleClass("cb-dragging-active");

					   	if($("html").hasClass("cb-dragging-active")){
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

				if(!item.hasClass("cb-dragging") && $(e.target).closest('.cb-lightbox-wrap-image').hasClass("cb-lightbox-draggable")){
					$("html").toggleClass("cb-dragging-active");

				   	if($(e.target).closest('.cb-lightbox-wrap-image').hasClass("cb-lightbox-draggable") && !item.hasClass("cb-lightbox-draggable-init")){
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

				fitImage();
			});

			$(document).data('cb-lightbox-initialized', true);
		}

		return $(this).each(function(){
			var item = $(this);

			item.on("click", function(event){
				event.preventDefault();

				source = item.attr('href');
				group = item.data("cblightbox");
				grouplength = 0;

				if(typeof group !== 'undefined'){
					grouplength = $('a[data-cblightbox="'+ group +'"]').length;
				}

				if(typeof group !== 'undefined'){
					_this_index = item.index('a[data-cblightbox="'+ group +'"]');
				}else
				{
					_this_index = item.index(item);
				}

				//Template Base
				tpl = $("<div class='cb-lightbox'></div>").append("<div class=cb-lightbox-overlay></div><div class=cb-lightbox-content><div class=cb-lightbox-close></div><div class=cb-lightbox-loading></div><div class=cb-lightbox-images></div></div>");
				tpl.find(".cb-lightbox-loading").append('<div class="cb-lightbox-loading-animation"></div>');

				if(grouplength > 1){
					var arrows = $("<div class='cb-lightbox-arrow-prev cb-lightbox-arrow'><span></span></div><div class='cb-lightbox-arrow-next cb-lightbox-arrow'><span></span></div>")
					arrows.appendTo(tpl.find(".cb-lightbox-content"));
				}

				captionTpl = $('<div class="cb-lightbox-info"></div>');

				if(settings.captionPosition == 'inside'){
					captionTpl.appendTo(tpl.find(".cb-lightbox-wrap-image"));
				}else{
					captionTpl.appendTo(tpl.find(".cb-lightbox-content"));
				}

				if(grouplength > 1 && settings.counter){
					var counter = $("<div class=cb-lightbox-counter></div>");

					$("<span class=cb-counter-current></span> / <span class=cb-counter-total></span>").appendTo(counter);

					counter.find(".cb-counter-total").text($('a[data-cblightbox="'+ group +'"]').length);
					counter.find(".cb-counter-current").text(_this_index + 1);

					tpl.find(".cb-lightbox-info").append(counter);
				}

				//lock background
				if($("body").height() > $(window).height()){
					$("html").addClass("cb-lightbox-lock cb-lightbox-margin");
				}

				tpl.data('group', group);
				tpl.appendTo("body");

				if ($.isFunction(settings.afterInit)) {
			 	   settings.afterInit.call(this, tpl);
				}

				if(settings.animationEffect == 'zoom'){
					$('html').addClass('cb-lightbox-animate-opening');
				}

				$('.cb-lightbox').fadeIn(settings.animationDuration);

				updateCaption(item);
				LoadImage(source);
			});
		});
	}
})(jQuery);
