/*
 * CBLightbox 3.18.5 jQuery
 * 2024-10-21
 * Copyright Christin Bombelka
 * https://github.com/ChristinBombelka/cblightbox
 */

(function ($) {
	let opening
	let closing
	let slideing = false
	let slides
	let firstLoad
	let pinching = false
	let dragSlide = false
	let scrollbarSpaceAdded = false
	let isDraggable = false
	let timeoutZoomTransition

	$.fn.cblightbox = function (options) {

		function cleanDom() {
			return $('html').width();
		}

		function is_touch_device() {
			return (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
		}

		if (is_touch_device()) {
			$("html").addClass("cb-lightbox-touch");
		} else {
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

		if (!scrollbarSpaceAdded) {
			$("html").get(0).style.setProperty("--cb-lightbox-margin", getScrollbarWidth() + "px");
			scrollbarSpaceAdded = true
		}

		var defaults = {
			margin: 40,
			mobileMargin: 0,
			insideArrows: false,
			zoom: false,
			zoomDuration: 300,
			zoomOffset: 0,
			zoomButtons: false,
			zoomMap: false,
			zoomFactor: 2, // min 1.1 
			disableOnMobile: false,
			breakpoint: 800,
			counter: true,
			captionPosition: 'outside', //inside, outside
			openCloseEffect: 'fade', //fade, zoom
			openCloseDuration: 250,
			slideDuration: 250,
			slideEffect: 'fade', //slide, fade
			previewSource: false, //define preview image source on use lazyloading
			previewImage: true,
			slideDraggable: true,
			closeOutsideClick: true,
			alignHorizontal: 'center', //center, left, right
			alignVertical: 'center', //center, top, bottom
			wrapAround: true,
			afterInit: $.noop,
			afterFit: $.noop,
			afterSlide: $.noop,
			beforeOpen: $.noop,
			afterOpen: $.noop,
			beforeClose: $.noop,
			afterClose: $.noop,
			onResize: $.noop,
		}

		function error(container, slide) {
			$('<div class="cb-lightbox-error">Sorry, this image can\'t be loaded!</div>').appendTo(slide);

			slide.find('.cb-lightbox-slide-image').remove();
			slide.removeClass('cb-lightbox-image-hide');

			var $s = container.data('settings');

			_animate(container, false, $s.openCloseDuration);
			_animate(container.find('.cb-lightbox-content'), false, $s.openCloseDuration);

			clearTimeout(container.data('watch'));
			container.removeClass('cb-lightbox-is-loading');
			container.addClass('cb-lightbox-run-opening');

			setTimeout(function () {
				container
					.removeClass('cb-lightbox-is-loading')
					.addClass('cb-lightbox-is-error');
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

		function calculateAnimtionOffset(axis) {
			speedDecleration[axis] = speedDecleration[axis] * (slowDownRatio[axis] + slowDownRatioReverse[axis] - slowDownRatioReverse[axis] * timeDiff / 10);
			speedDecelerationRatioAbs[axis] = Math.abs(speed[axis] * speedDecleration[axis]);
			distanceOffset = speed[axis] * speedDecleration[axis] * timeDiff;

			return distanceOffset;
		}

		function getNewBouncePosition(maxMin, current, time, duration) {
			return (maxMin - current) * time / duration + current;
		}

		function logMousePosition() {
			if (mouseUp) {
				return;
			}

			//log mouse positions
			positionInterval = setTimeout(function () {

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

		function getImageSizes(currentImage) {

			return {
				width: currentImage.data('fullWidth') * (currentImage.data('currentPercentage') / 100),
				height: currentImage.data('fullHeight') * (currentImage.data('currentPercentage') / 100),
			};
		}

		function zoomMapPosition(x, y, animate = false) {
			const container = $('.cb-lightbox')

			if (!container.length) {
				return;
			}

			const $s = container.data('settings')

			if (!$s.zoomMap) {
				return;
			}

			if (animate) {
				container.addClass('cb-lightbox-run-zoom')
			}

			clearTimeout(timeoutZoomTransition)

			const currentImage = $('.cb-lightbox-slide-current .cb-lightbox-slide-image')
			const imageWidth = currentImage.data('fullWidth') * (currentImage.data('currentPercentage') / 100)
			const imageHeight = currentImage.data('fullHeight') * (currentImage.data('currentPercentage') / 100)
			const windowHeight = $(window).height()
			const windowWidth = $(window).width()

			//set limits
			if (y >= 0) {
				y = 0
			} else if (Math.abs(y) > imageHeight - windowHeight && imageHeight > windowHeight) {
				y = windowHeight - imageHeight;
			}

			if (x >= 0) {
				x = 0
			} else if (Math.abs(x) > imageWidth - windowWidth && imageWidth > windowWidth) {
				x = windowWidth - imageWidth;
			}

			const zoomMapContainer = $('.cb-lightbox__zoomMap')
			const zoomMapWidthRatio = windowWidth / imageWidth
			const zoomMapHeightRatio = windowHeight / imageHeight
			const zoomMapWidth = zoomMapContainer[0].getBoundingClientRect().width
			const zoomMapHeight = zoomMapContainer[0].getBoundingClientRect().height
			const zoomHandleTop = y < 0 ? (Math.max(Math.abs(y), 1) / imageHeight) : 0
			const zoomHandleLeft = x < 0 ? (Math.max(Math.abs(x), 1) / imageWidth) : 0

			var zoomHandleWidth = zoomMapWidthRatio * zoomMapWidth;
			if (zoomHandleWidth >= zoomMapWidth) {
				zoomHandleWidth = zoomMapWidth;
			}

			var zoomHandleHeight = zoomMapHeightRatio * zoomMapHeight;
			if (zoomHandleHeight >= zoomMapHeight) {
				zoomHandleHeight = zoomMapHeight;
			}

			zoomMapContainer.find('.cb-lightbox__zoomMap-handle').css({
				'width': zoomHandleWidth,
				'height': zoomHandleHeight,
				'top': zoomHandleTop * zoomMapHeight,
				'left': zoomHandleLeft * zoomMapWidth
			});

			timeoutZoomTransition = setTimeout(() => {
				container.removeClass('cb-lightbox-run-zoom')
			}, $s.zoomDuration)
		}

		function getZoomDistance(f1, f2) {
			var dx = f1.clientX - f2.clientX;
			var dy = f1.clientY - f2.clientY;
			return Math.sqrt(dx * dx + dy * dy);
		}

		function checkZoomLimit(newSize, direction, value) {
			//check zoom limits

			var windowSize = $(window).width();

			if (direction == 'height') {
				windowSize = $(window).height();
			}

			if (newSize <= windowSize) {
				value = (windowSize - newSize) / 2;
			} else if (value > 0 && newSize > windowSize) {
				value = 0;
			} else if (value < windowSize - newSize) {
				value = windowSize - newSize;
			}

			return value;
		}

		function getLastTransform(slideImage) {
			var lastOffset = slideImage.data('lastTransform'),
				x,
				y;

			if (lastOffset) {
				x = lastOffset.x ? lastOffset.x : 0;
				y = lastOffset.y ? lastOffset.y : 0;
			} else {
				x = 0;
				y = 0;
			}

			return {
				x: x,
				y: y
			};
		}

		function initMoveMoment(slideImage) {
			var $s = $('.cb-lightbox').data('settings'),
				minX = $s.zoomOffset[3],
				maxX = $(window).width() - slideImage.width() - $s.zoomOffset[1],
				minY = $s.zoomOffset[0],
				maxY = $(window).height() - slideImage.height() - $s.zoomOffset[2],
				startTimeX = false,
				startTimeY = false,
				completeX = false,
				completeY = false,
				setCurrentPointX = false,
				setCurrentPointY = false;

			if (pinching == true) {
				clearTimeout(momentTimer);
				return;
			}

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
			if (Math.abs(distance.x) > 1 || Math.abs(distance.y) > 1) {

				function moveMoment() {
					momentTimer = setTimeout(function () {

						if (startTimeX === false) {
							speedX = calculateAnimtionOffset('x');
						}

						if (startTimeY === false) {
							speedY = calculateAnimtionOffset('y');
						}

						if ((Math.abs(speedX) > 0.1 || (currentPoint.x > minX || currentPoint.x < maxX)) && getImageSizes(slideImage).width > $(window).width()) {
							//In bouncing area left/right
							if (currentPoint.x > minX || currentPoint.x < maxX) {
								if (Math.abs(speedX) < 0.08) {
									if (startTimeX === false) {
										startTimeX = new Date().getTime();
									}

									tX = new Date().getTime() - startTimeX;

									if (tX >= 300) {
										//set to end position
										if (currentPoint.x > minX) {
											setCurrentPointX = minX;
										} else {
											setCurrentPointX = maxX;
										}

										speedX = 0;
										completeX = true;

									} else {
										if (currentPoint.x > minX) {
											setCurrentPointX = getNewBouncePosition(minX, currentPoint.x, tX, 300);
										} else {
											setCurrentPointX = getNewBouncePosition(maxX, currentPoint.x, tX, 300);
										}
									}
								}

								slowDownRatio.x = 0.7;
							}

						} else {
							completeX = true;
						}

						if (!startTimeX) {
							setCurrentPointX = currentPoint.x + speedX;
						}

						if ((Math.abs(speedY) > 0.1 || (currentPoint.y > minY || currentPoint.y < maxY)) && getImageSizes(slideImage).height > $(window).height()) {
							//In bouncing area top/bottom
							if (currentPoint.y > minY || currentPoint.y < maxY) {

								if (Math.abs(speedY) < 0.08) {
									if (startTimeY === false) {
										startTimeY = new Date().getTime();
									}

									tY = new Date().getTime() - startTimeY;

									if (tY >= 300) {
										//set to end position
										if (currentPoint.y > minY) {
											setCurrentPointY = minY;
										} else {
											setCurrentPointY = maxY;
										}

										speedY = 0;
										completeY = true;

									} else {

										if (currentPoint.y > minY) {
											setCurrentPointY = getNewBouncePosition(minY, currentPoint.y, tY, 300);
										} else {
											setCurrentPointY = getNewBouncePosition(maxY, currentPoint.y, tY, 300);
										}
									}
								}

								slowDownRatio.y = 0.7;
							}
						} else {
							completeY = true;
						}

						if (!startTimeY) {
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

						zoomMapPosition(currentPoint.x, currentPoint.y);

						if (completeX && completeY) {
							clearTimeout(momentTimer);
							return;
						}

						moveMoment();

					}, 10);
				}

				moveMoment();

			} else {
				reposition();
			}
		}

		function setTranslate(el, values) {
			var str = '',
				css = {};

			if (!el.length) {
				return;
			}

			if (values.top !== undefined || values.left !== undefined) {
				str = (values.left === undefined ? el.position().left : values.left) + 'px, ' + (values.top === undefined ? el.position().top : values.top) + 'px' + ', 0px';
				str = 'translate3d(' + str + ')';

				el.data('lastTransform', { x: values.left, y: values.top });
			}

			if (values.scaleX && values.scaleY) {
				str = (str.length ? str + ' ' : '') + 'scale(' + values.scaleX + ', ' + values.scaleY + ')';
			}

			if (str.length) {
				css.transform = str;
			}

			if (values.width !== undefined) {
				css.width = values.width;
			}

			if (values.height !== undefined) {
				css.height = values.height;
			}

			if (values.opacity !== undefined) {
				css.opacity = values.opacity;
			}

			return el.css(css);
		}

		function _animateDurationSet(el, duration) {
			el.css('transition-duration', duration + 'ms');
		}

		function _animateDurationRemove(el) {
			el.css('transition-duration', '');
		}

		function _animateEnd(el, to) {
			_animateDurationRemove(el);

			if (closing) {
				return;
			}

			if (to.scaleX !== undefined && to.scaleY !== undefined) {
				var currentSlide = $('.cb-lightbox-slide-current').find(".cb-lightbox-slide-image");

				if (to.toWidth && to.toHeight) {
					to.width = to.toWidth;
					to.height = to.toHeight
				} else if ($('.cb-lightbox-is-zoomed').length) {
					to.width = getImageSizes(el).width;
					to.height = getImageSizes(el).height;
				} else {
					to.width = currentSlide.data('fitWidth');
					to.height = currentSlide.data('fitHeight');
				}

				to.scaleX = 1;
				to.scaleY = 1;

				setTranslate(el, to);
			}
		}

		function _animate(el, to, duration) {
			_animateDurationSet(el, duration)

			setTranslate(el, to);

			clearTimeout(el.data('timer'));

			el.data('timer', setTimeout(function () {
				_animateEnd(el, to);
			}, duration + 20));
		}

		function initDraggable(slideImage, x, y) {
			if ($(".cb-lightbox").hasClass("cb-lightbox-is-zoomed") || $('.cb-lightbox').hasClass('cb-lightbox-is-loading')) {
				return;
			}

			if (closing) {
				return;
			}

			$('.cb-lightbox').addClass('cb-lightbox-is-zoomed');

			let $s = $('.cb-lightbox').data('settings')
			let scaleWidth = slideImage.data('fullWidth') / slideImage.width()
			let scaleHeight = slideImage.data('fullHeight') / slideImage.height()
			let positionX
			let positionY
			let offset = {
				x: x,
				y: y
			}

			if (slideImage.data('fullWidth') > $(window).width()) {
				let imageOverlapX = slideImage.data('fullWidth') - $(window).width()
				positionX = (slideImage.offset().left - $(window).scrollLeft()) + offset.x - (offset.x * scaleWidth)

				// Limit horizontal 
				if (positionX > $s.zoomOffset[3]) {
					positionX = $s.zoomOffset[3]
				} else if (positionX < -(imageOverlapX + $s.zoomOffset[1])) {
					positionX = -(imageOverlapX + $s.zoomOffset[1])
				}
			} else {
				positionX = ($(window).width() - slideImage.data('fullWidth')) / 2;
			}

			if (slideImage.data('fullHeight') > $(window).height()) {
				let imageOverlapY = slideImage.data('fullHeight') - $(window).height()
				positionY = (slideImage.offset().top - $(window).scrollTop()) + offset.y - (offset.y * scaleHeight)

				// Limit vertical
				if (positionY > $s.zoomOffset[0]) {
					positionY = $s.zoomOffset[0]
				} else if (positionY < -(imageOverlapY + $s.zoomOffset[2])) {
					positionY = -(imageOverlapY + $s.zoomOffset[2])
				}
			} else {
				positionY = ($(window).height() - slideImage.data('fullHeight')) / 2
			}

			_animate(slideImage, {
				top: positionY,
				left: positionX,
				scaleX: scaleWidth,
				scaleY: scaleHeight
			}, $s.zoomDuration);

			setTimeout(function () {
				isDraggable = true;
			}, $s.zoomDuration);

			slideImage.data('currentPercentage', 100);
			slideImage.data('currentZoomStep', 'auto');

			zoomMapPosition(positionX, positionY, true);
		}

		function detroyDraggable(slideImage, disableAnimation) {
			var container = $(".cb-lightbox");

			if (!container.length || !slideImage.length) {
				return;
			}

			var $s = slideImage.closest('.cb-lightbox').data('settings'),
				slide = slideImage.closest('.cb-lightbox-slide'),
				duration = $s.zoomDuration;

			if (!container.hasClass("cb-lightbox-is-zoomed")) {
				return;
			}

			isDraggable = false;

			var scaleWidth = slideImage.data('fitWidth') / slideImage.width(),
				scaleHeight = slideImage.data('fitHeight') / slideImage.height();

			if (typeof disableAnimation !== 'undefined') {
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

			setTimeout(function () {
				container.removeClass('cb-lightbox-is-zoomed');
			}, duration + 30);

			slideImage.data('currentPercentage', slideImage.data('fitPercentage'));
			slideImage.data('currentZoomStep', 0);

			zoomMapPosition(slideImage.data('fitLeft'), slideImage.data('fitTop'), true);
		}

		function getImageFit(slideImage) {
			const container = $('.cb-lightbox')
			const $s = container.data('settings')
			const type = slideImage.data('type')

			if (type == 'image') {
				if (typeof slideImage != 'undefined') {
					imgWidth = slideImage.data('fullWidth');
					imgHeight = slideImage.data('fullHeight');
				}
				else {
					imgWidth = $(".cb-lightbox-image").width();
					imgHeight = $(".cb-lightbox-image").height();
				}
			} else {
				if (slideImage.data('fullHeight') && slideImage.data('fullWidth')) {
					imgHeight = container.height();
					imgWidth = imgHeight / slideImage.data("fullHeight") * slideImage.data("fullWidth");
				} else {
					//Default 16/9
					imgHeight = container.height();
					imgWidth = imgHeight / 9 * 16;
				}
			}

			const wrapperHeight = container.height() - ($s.margin[0] + $s.margin[2])
			const wrapperWidth = container.width() - ($s.margin[1] + $s.margin[3])
			const windowHeight = window.innerHeight ? window.innerHeight : $(window).height()

			let captionHeight = 0
			if ($(".cb-lightbox-info").length) {
				captionHeight = $(".cb-lightbox-info").outerHeight();
			}

			let zoomable = false
			let minRatio
			let fitPercantage = false
			if (wrapperHeight - captionHeight < imgHeight || wrapperWidth < imgWidth) {
				// Image can zoom

				minRatio = Math.min(1, wrapperWidth / imgWidth, (wrapperHeight - captionHeight) / imgHeight)

				fitPercantage = minRatio * 100

				newImgWidth = Math.floor(minRatio * imgWidth)
				newImgHeight = Math.floor(minRatio * imgHeight)

				slideImage.addClass('cb-lightbox-slide-zoomable')
				zoomable = true
			} else {
				// Image cant zoom

				newImgWidth = imgWidth
				newImgHeight = imgHeight

				slideImage.removeClass('cb-lightbox-slide-zoomable')
			}

			let positionTop = 0
			if ($s.alignVertical == 'top') {
				positionTop = $s.margin[0]
			} else if ($s.alignVertical == 'bottom') {
				positionTop = windowHeight - newImgHeight - captionHeight - $s.margin[2]
			} else {
				let centerArea = (windowHeight - newImgHeight - captionHeight - $s.margin[0] - $s.margin[2]) / 2
				positionTop = centerArea + $s.margin[0]
			}

			if ($s.alignHorizontal == 'left') {
				positionLeft = $s.margin[3];
			} else if ($s.alignHorizontal == 'right') {
				positionLeft = container.width() - newImgWidth - $s.margin[1];
			} else {
				positionLeft = (container.width() - newImgWidth) / 2;
			}

			// Define min zoom factor 
			if ($s.zoomFactor <= 1.1) {
				$s.zoomFactor = 2
			}

			let calculatedZoomFactor = $s.zoomFactor
			if (zoomable) {
				// Calc optimal zoom factor 
				const startSize = newImgWidth
				const endSize = imgWidth

				let steps = 0
				let factor

				do {
					steps = steps + 1
					factor = (endSize / startSize) ** (1 / steps)
				} while (factor > $s.zoomFactor)

				calculatedZoomFactor = factor
			}

			const scaleWidth = newImgWidth / slideImage.data('holderWidth')
			const scaleHeight = newImgHeight / slideImage.data('holderHeight')

			slideImage.data({
				'fitHeight': newImgHeight,
				'fitWidth': newImgWidth,
				'fitLeft': positionLeft,
				'fitTop': positionTop,
				'fitPercentage': fitPercantage,
				'currentPercentage': fitPercantage,
				'zoomable': zoomable,
				'zoomFactor': calculatedZoomFactor
			});

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

		function reposition() {
			// Reset dragging position
			var slide = $('.cb-lightbox-slide.cb-lightbox-slide-current'),
				$s = slide.closest('.cb-lightbox').data('settings'),
				slideImage = slide.find('.cb-lightbox-slide-image'),
				lastoffset = slideImage.data('lastTransform'),
				windowWidth = $(window).width(),
				windowHeight = window.innerHeight ? window.innerHeight : $(window).height(),
				imageWidth = getImageSizes(slideImage).width,
				imageHeight = getImageSizes(slideImage).height;

			if (!lastoffset) {
				return;
			}

			if (lastoffset.x > $s.zoomOffset[3] && imageWidth > windowWidth) {
				moveX = $s.zoomOffset[3];
			} else if (Math.abs(lastoffset.x) - $s.zoomOffset[1] > imageWidth - windowWidth && imageWidth > windowWidth) {
				moveX = windowWidth - imageWidth - $s.zoomOffset[1];
			} else {
				moveX = lastoffset.x;
			}

			if (lastoffset.y > $s.zoomOffset[0] && imageHeight > windowHeight) {
				moveY = $s.zoomOffset[0];
			} else if (Math.abs(lastoffset.y) - $s.zoomOffset[2] > imageHeight - windowHeight && imageHeight > windowHeight) {
				moveY = windowHeight - imageHeight - $s.zoomOffset[2];
			}
			else {
				moveY = lastoffset.y;
			}

			if (lastoffset.x != moveX || lastoffset.y != moveY) {
				_animate(slideImage, {
					top: moveY,
					left: moveX,
				}, 250);
			}
		}

		function captionInsidePosition(caption, slideImage) {
			var $s = slideImage.closest('.cb-lightbox').data('settings'),
				positionBottom = window.innerHeight - slideImage.data('fitHeight');

			if ($s.alignVertical == 'top') {
				positionBottom = positionBottom - $s.margin[0];
			} else if ($s.alignVertical == 'bottom') {
				positionBottom = $s.margin[2];
			} else {
				positionBottom = positionBottom - slideImage.data('fitTop');
			}

			caption.css({
				bottom: positionBottom,
				left: slideImage.data('fitLeft'),
				width: slideImage.data('fitWidth'),
			});
		}

		function updateCaption(item, slide, $s) {
			var caption = item.data("caption"),
				captionTpl = $("<div class='cb-lightbox-caption'>" + caption + "</div>");

			if ($s.captionPosition == 'inside') {

				slide.addClass('cb-lightbox-slide-with-caption');

				if (!slide) {
					var slide = $('.cb-lightbox-slide-current');
				}

				if (slide.find('.cb-lightbox-caption').length) {
					return;
				}

				setTimeout(function () {
					captionInsidePosition(captionTpl, slide.find('.cb-lightbox-slide-image'));
				});

				var addTo = slide;

			} else {
				$(".cb-lightbox-caption").remove();

				var addTo = $(".cb-lightbox-info");
			}

			if (caption) {
				captionTpl.appendTo(addTo);
			}
		}

		function watchLoading(slide) {
			if (slide.length) {

				if (slide.hasClass('cb-lightbox-slide-complete')) {
					$('.cb-lightbox').removeClass('cb-lightbox-is-loading');

					clearTimeout($('.cb-lightbox').data('watch'));
					return;

				} else {
					$('.cb-lightbox').addClass('cb-lightbox-is-loading');
				}

				$('.cb-lightbox').data('watch', setTimeout(function () {
					watchLoading(slide);
				}, 100));
			}
		}

		function getImageSize(el, img, slide, callback) {
			var $img = $(img);

			if (el.data('width') && el.data('height')) {
				callback.apply(this, [el.data('width'), el.data('height'), slide]);
			} else {
				var wait = setInterval(function () {
					var w = $img[0].naturalWidth,
						h = $img[0].naturalHeight;
					if (w && h) {
						clearInterval(wait);
						callback.apply(this, [w, h, slide]);
					}
				}, 100);
			}
		}

		function setImage(slide, source, item, p) {
			var elementPlaceholder = slide.find('.cb-lightbox-image-placeholder'),
				container = $('.cb-lightbox'),
				slideImage = slide.find('.cb-lightbox-slide-image'),
				$s = container.data('settings'),
				loadingTimeout,
				loadingImage = true;

			if (typeof slides === "undefined") {
				cachedSlide = false;
			} else {
				cachedSlide = slides[slideImage.data('index')];
			}

			if (cachedSlide.image && cachedSlide.status == 'complete') {
				var $img = cachedSlide.image.clone().appendTo(slideImage);

				if ($img[0].complete) {
					loadingImage = false;
				}
			}

			if (loadingImage) {
				if (typeof $img !== "undefined" && $img.length) {
					$img.remove();
				}

				var $img = $('<img />');

				$img.addClass('cb-lightbox-image')
					.attr('src', source)
					.appendTo(slideImage);

				$img.one('error', function () {

					clearTimeout(loadingTimeout);

					$img.remove();
					elementPlaceholder.remove();
					error(container, slide);

				}).one('load', function (e) {
					imageHeight = $(this).data('height') || this.naturalHeight;

					slide.removeClass('cb-lightbox-slide-hide');

					if (firstLoad) {
						initPreload(container);
					}

					setTimeout(function () {

						elementPlaceholder.hide();

						slide
							.removeClass('cb-lightbox-image-hide')
							.addClass('cb-lightbox-slide-complete');

						if (slides[slideImage.data('index')]) {
							slides[slideImage.data('index')].image = $img;
							slides[slideImage.data('index')].status = 'complete';
						}

					}, Math.min(300, Math.max(1000, imageHeight / 1600)));
				});
			}

			getImageSize(item, $img, slideImage, function (width, height, slideImage) {
				slideImage.data({
					'fullWidth': width,
					'fullHeight': height,
				});

				const values = getImageFit(slideImage);
				setTranslate(slideImage, {
					top: values.top,
					left: values.left,
					width: values.width,
					height: values.height,
				});
			});

			if (loadingImage == false && ($img[0].complete || $img[0].readyState == 'complete') && $img[0].naturalWidth && $img[0].naturalHeight) {
				elementPlaceholder.hide();

				slide
					.removeClass('cb-lightbox-slide-hide cb-lightbox-image-hide')
					.addClass('cb-lightbox-slide-complete');

				if (firstLoad) {
					initPreload(container);
				}
			}
		}

		function setSlide(item, i, p) {
			if (typeof i !== "undefined") {
				$(".counter-current").text(i + 1);
			}

			var container = $('.cb-lightbox'),
				$s = container.data('settings'),
				source = item.attr('href'),
				cachedSlide = slides[i];

			if (!cachedSlide) {
				cacheSlides(item, i, p);
				cachedSlide = slides[i];
			}

			container.removeClass('cb-lightbox-is-error');

			var slide = $('<div class="cb-lightbox-slide cb-lightbox-slide-' + p + ' cb-lightbox-image-hide"></div>'),
				wrapImage = $('<div class="cb-lightbox-slide-image"></div>');

			wrapImage.appendTo(slide);

			if (p == 'previews') {
				slide.prependTo($('.cb-lightbox-slides'));
			} else {
				slide.appendTo($('.cb-lightbox-slides'));
			}

			if (p == 'current') {
				clearTimeout($('.cb-lightbox').data('watch'));
				watchLoading(slide);
			}

			if (container.data('grouplength') > 1 && $s.insideArrows) {
				var arrows = $('<div class="cb-lightbox-arrow-prev cb-lightbox-arrow cb-lightbox-arrow--inside"><span></span></div><div class="cb-lightbox-arrow-next cb-lightbox-arrow cb-lightbox-arrow--inside"><span></span></div>');
				arrows.appendTo(wrapImage);
			}

			wrapImage.data({
				'type': cachedSlide.type,
				'index': i,
				'holderWidth': item.find('img').width(),
				'holderHeight': item.find('img').height(),
				'currentZoomStep': 0,
			});

			$('.cb-lightbox-error').remove();
			$('.cb-lightbox-content').removeClass('cb-lightbox-is-error');

			if (cachedSlide.type == "image") {
				if ($s.previewImage) {
					var elementPlaceholder = cachedSlide.placeholder.clone().appendTo(wrapImage);

					elementPlaceholder.show();

					if ((elementPlaceholder[0].complete || elementPlaceholder[0].readyState == 'complete') && elementPlaceholder[0].naturalWidth && elementPlaceholder[0].naturalHeight) {
						slide.removeClass('cb-lightbox-slide-hide');
						setImage(slide, source, item, p);
					} else {

						elementPlaceholder.one('error', function () {
							elementPlaceholder.remove();
						}).one('load', function () {
							slide.removeClass('cb-lightbox-slide-hide');

							setImage(slide, source, item, p);

							slides[wrapImage.data('index')].placeholder = elementPlaceholder;
						});
					}

					if (p == 'current') {
						container.find('.cb-lightbox__zoomMap-image').append('<img src="' + elementPlaceholder.attr('src') + '">');
					}
				} else {
					slide.removeClass('cb-lightbox-slide-hide');
					setImage(slide, source, item, p);
				}

			} else if (cachedSlide.type == "iframe") {
				var iframe = cachedSlide.iframe.clone().appendTo(wrapImage);

				if (p == 'current') {
					container.addClass('cb-lightbox-is-iframe');
				}

				wrapImage
					.data({
						'fullWidth': item.data('width') ? item.data('width') : 16,
						'fullHeight': item.data('height') ? item.data('height') : 9,
					});

				iframe.on("load", function () {
					slide
						.removeClass('cb-lightbox-slide-hide cb-lightbox-image-hide')
						.addClass('cb-lightbox-slide-complete');
				});
			}

			return slide;
		}

		function moveImage(direction, distance = 100) {
			const container = $('.cb-lightbox')
			const $s = container.data('settings')
			const current = container.find('.cb-lightbox-slide-current')
			const slideImage = current.find('.cb-lightbox-slide-image')

			if (closing) {
				return
			}

			// Define current image size
			const imageSizes = getImageSizes(slideImage)
			const imageWidth = imageSizes.width
			const imageHeight = imageSizes.height
			const windowWidth = $(window).width()
			const windowHeight = $(window).height()

			// Define last transform position
			const lastTransform = getLastTransform(slideImage)
			let newY = lastTransform.y
			let newX = lastTransform.x

			if (direction == 'up') {
				if (imageHeight > windowHeight) {
					const limitUp = $s.zoomOffset[0]
					newY = lastTransform.y + 100

					if (newY > limitUp) {
						newY = limitUp
					}
				}
			} else if (direction == 'down') {
				if (imageHeight > windowHeight) {
					const limitDown = imageSizes.height - windowHeight + $s.zoomOffset[2]
					newY = lastTransform.y - 100

					if (Math.abs(newY) > limitDown) {
						newY = -1 * limitDown
					}
				}
			} else if (direction == 'left') {
				if (imageWidth > windowWidth) {

					const limitLeft = $s.zoomOffset[3]
					newX = lastTransform.x + 100

					if (newX > limitLeft) {
						newX = limitLeft
					}
				}
			} else if (direction == 'right') {
				if (imageWidth > windowWidth) {
					const limitRight = imageSizes.width - windowWidth + $s.zoomOffset[1]
					newX = lastTransform.x - 100

					if (Math.abs(newX) > limitRight) {
						newX = -1 * limitRight
					}
				}
			}

			_animate(slideImage, {
				top: newY,
				left: newX,
			}, $s.zoomDuration);

			zoomMapPosition(newX, newY, true)
		}

		function arrowHide(direction, hide) {
			let container = $('.cb-lightbox')

			if (hide) {
				container.find('.cb-lightbox-arrow-' + direction).addClass('cb-lightbox-arrow--disabled')
			} else {
				container.find('.cb-lightbox-arrow-' + direction).removeClass('cb-lightbox-arrow--disabled')
			}
		}

		function resetSlide(slide) {
			_animate(slide, {
				left: 0,
			}, 250);

			slide.removeClass('cb-lightbox-is-sliding');
		}

		function slideTo(direction, effect) {
			if (typeof effect === "undefined") {
				effect = false;
			}

			$('.cb-lightbox-slide').removeClass('cb-lightbox-is-sliding');

			firstLoad = false;

			const container = $('.cb-lightbox')
			const $s = container.data('settings')
			const group = container.data('group')
			let items = $('a[data-group="' + group + '"]')
			let oldCurrent = $('.cb-lightbox-slide.cb-lightbox-slide-current')

			if (container.hasClass('cb-lightbox-is-zoomed') || slideing || items.length <= 1) {
				return;
			}

			slideing = true;

			if (direction == 'previews') {
				_this_index = _this_index - 1;

				if (_this_index < 0) {

					if ($s.wrapAround === false) {
						resetSlide(oldCurrent);
						_this_index = _this_index + 1;
						slideing = false;
						return;
					}

					_this = items.length - 1;
					_this_index = _this;
				}

				var newCurrent = oldCurrent.prev();

				//cache prev slide
				var _slideIndex = _this_index - 1;

				if (_slideIndex < 0) {
					_this = items.length - 1;
					_slideIndex = _this;
				}

				//change current slide
				var oldCurrentDirection = 'next';

			} else if (direction == 'next') {
				_this_index = _this_index + 1;

				if (_this_index > items.length - 1) {

					if ($s.wrapAround === false) {
						resetSlide(oldCurrent);
						_this_index = _this_index - 1;
						slideing = false;
						return;
					}

					_this_index = 0;
				}

				var newCurrent = oldCurrent.next();

				//cache next slide
				var _slideIndex = _this_index + 1;

				if (_slideIndex > items.length - 1) {
					_slideIndex = 0;
				}

				//change current slide
				var oldCurrentDirection = 'previews';
			}

			if ($s.wrapAround === false) {
				if (items.length - 1 == _this_index) {
					arrowHide('next', true)
					arrowHide('prev', false)
				} else if (_this_index == 0) {
					arrowHide('prev', true)
					arrowHide('next', false)
				} else {
					arrowHide('next', false)
					arrowHide('prev', false)
				}
			}

			container.find('.cb-counter-current').text(_this_index + 1);

			$('.cb-lightbox-is-selected').removeClass('cb-lightbox-is-selected');
			items.eq(_this_index).addClass('cb-lightbox-is-selected');

			//remove previews slide
			$('.cb-lightbox-slide.cb-lightbox-slide-' + oldCurrentDirection).remove();

			oldCurrent
				.removeClass('cb-lightbox-slide-current')
				.addClass('cb-lightbox-slide-' + oldCurrentDirection);

			//reset iframe
			//use vimeo/youtube api to stop/play video?
			if (oldCurrent.find('.cb-lightbox-iframe').length) {
				let iframe = oldCurrent.find('.cb-lightbox-iframe')

				iframe.attr('src', '')
				iframe.attr('src', iframe.data('source'))
			}

			if ($s.slideEffect == 'slide' || effect == 'slide') {
				let slideOut
				let slideOutOpacity = 0

				if (dragSlide) {
					slideOutOpacity = 1
				}

				if (direction == 'previews') {
					slideOut = $(window).width();
				} else {
					slideOut = -$(window).width();
				}

				_animate(oldCurrent, {
					left: slideOut,
					opacity: slideOutOpacity,
				}, $s.slideDuration);

			} else {
				_animate(oldCurrent, {
					opacity: 0,
				}, $s.slideDuration);
			}

			//check new Current exist
			if (!newCurrent.length) {
				newCurrent = setSlide(items.eq(_this_index), _this_index, 'current');
			}

			cachedSlide = slides[_this_index];

			newCurrent
				.removeClass('cb-lightbox-slide-previews cb-lightbox-slide-next')
				.addClass('cb-lightbox-slide-current');

			//set new caption befor calc slide height
			updateCaption(items.eq(_this_index), newCurrent, $s);

			const newCurrentImage = newCurrent.find('.cb-lightbox-slide-image');

			// Check image is zoomable, enable oder disable zoom button
			if ($s.zoom && $s.zoomButtons) {
				if (newCurrentImage.data('zoomable') == false) {
					container.find('.cb-lightbox-zoom-button--in').addClass('cb-lightbox-zoom-button--disabled');
				} else {
					container.find('.cb-lightbox-zoom-button--in').removeClass('cb-lightbox-zoom-button--disabled');
				}
			}

			let values = getImageFit(newCurrentImage);
			setTimeout(function () {
				setTranslate(newCurrentImage, {
					width: values.width,
					height: values.height,
					left: values.left,
					top: values.top,
				});
			})

			//set current slide start position
			if ($s.slideEffect == 'slide' || effect == 'slide') {

				if (!dragSlide) {
					if (direction == 'previews') {
						var slideIn = -$(window).width();
					} else {
						var slideIn = $(window).width();
					}

					setTranslate(newCurrent, {
						left: slideIn,
						opacity: 0,
					});
				}

			} else {
				setTranslate(newCurrent, {
					left: 0,
					opacity: 0,
				});
			}

			clearTimeout($('.cb-lightbox').data('watch'));
			watchLoading(newCurrent);

			if ($s.slideEffect == 'slide' || effect == 'slide') {
				setTimeout(function () {
					_animate(newCurrent, {
						top: 0,
						left: 0,
						opacity: 1,
					}, $s.slideDuration);
				});
			} else {
				setTimeout(function () {
					_animate(newCurrent, {
						opacity: 1,
					}, $s.slideDuration);
				});
			}

			setTimeout(function () {
				if ($.isFunction($s.afterSlide)) {
					$s.afterSlide.call(this, container, newCurrent);
				}
			}, $s.slideDuration + 10);

			setTimeout(function () {
				slideing = false
				dragSlide = false
			}, 200);

			if (container.find('.cb-lightbox__zoomMap-image').length) {
				var previewElement = items.eq(_this_index);

				if ($s.previewSource) {
					if (previewElement.attr($s.previewSource)) {
						placeholderImage = previewElement.attr($s.previewSource);
					} else if (previewElement.find('img')) {
						placeholderImage = previewElement.find('img').attr($s.previewSource);
					}
				} else {
					placeholderImage = previewElement.find('img').attr('src');
				}

				container.find('.cb-lightbox__zoomMap-image')
					.empty()
					.append('<img src="' + placeholderImage + '">');

				setTimeout(function () {
					zoomMapPosition(0, 0);
				}, 10);
			}

			let appendSlide = true
			if ($s.wrapAround === false) {
				if (direction == 'next' && _slideIndex == 0) {
					appendSlide = false
				} else if (direction == 'previews' && _slideIndex == items.length - 1) {
					appendSlide = false
				}
			}

			if (appendSlide) {
				//set new previews/next slide
				setSlide(items.eq(_slideIndex), _slideIndex, direction);
			}
		}

		function initPreload(container) {
			if (!firstLoad) {
				return;
			}

			var group = container.data('group'),
				$s = container.data('settings'),
				items = $('a[data-group="' + group + '"]');

			if (items.length > 1) {
				//cache prev slide
				var _slideIndex = _this_index - 1;

				if ($s.wrapAround) {
					if (_slideIndex < 0) {
						_this = items.length - 1;
						_slideIndex = _this;
					}
				}

				if (_slideIndex >= 0) {
					var prevItem = items.eq(_slideIndex);
					setSlide(prevItem, _slideIndex, 'previews');
				}

				//cache next slide
				var _slideIndex = _this_index + 1;

				if ($s.wrapAround) {
					if (_slideIndex > items.length - 1) {
						_slideIndex = 0;
					}
				}

				if (_slideIndex <= items.length - 1) {
					var nextItem = items.eq(_slideIndex);
					setSlide(nextItem, _slideIndex, 'next');
				}
			}

			firstLoad = false;
		}

		function getType(source) {
			if (source.toLowerCase().match(/\.(jpg|jpeg|png|gif)/)) {
				type = 'image';
			} else if (source) {
				type = 'iframe';
			} else {
				type = 'error';
			}

			return type;
		}

		function cacheSlides(item, i, p) {
			var container = $('.cb-lightbox'),
				$s = container.data('settings');

			if (!slides[i]) {
				var source = item.attr('href'),
					placeholder = false,
					iframe = false,
					image = false,
					type = false,
					status = 'load';

				type = getType(source);

				if (type == "image") {

					if ($s.previewImage) {
						previewImage = item.find('img');

						if ($s.previewSource) {
							if (item.attr($s.previewSource)) {
								placeholderImage = item.attr($s.previewSource);
							} else if (item.find('img')) {
								placeholderImage = item.find('img').attr($s.previewSource);
							}
						} else if (previewImage.length && previewImage.attr('src') && previewImage.attr('src').substr(0, 21) != 'data:image/png;base64') {
							placeholderImage = item.find('img').attr('src');
						} else {
							placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
						}

						placeholder = $('<img />')
							.addClass('cb-lightbox-image-placeholder')
							.attr('src', placeholderImage);
					}

					image = $('<img/>')
						.addClass('cb-lightbox-image')
						.attr('src', source);

					setTimeout(function () {
						if (image[0].complete) {
							status = 'complete';
						}
					});

				} else if (type == "iframe") {

					let sourceUrl = extendIframeSource(source)

					iframe = $('<iframe src="' + sourceUrl + '" data-source="' + sourceUrl + '" class="cb-lightbox-image cb-lightbox-iframe" allow="autoplay, fullscreen" frameborder="0" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen=""></iframe>');
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

		function extendIframeSource(url) {
			let protocol = 'https:'
			if (window.location.protocol === 'http:') {
				protocol = 'http:'
			}

			// YouTube
			if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(url)) {

				let regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
				if (url.match(regex)) {
					return protocol + '//www.youtube.com/embed/' + RegExp.$2 + '?showinfo=0&rel=0'
				}

				return url
			}

			// Vimeo
			if (/^https?:\/\/(player.vimeo.com\/video\/|vimeo.com)\d{0,9}(?=\b|\/)/.test(url)) {

				let regex = /^.*(vimeo\.com\/(video\/|))([0-9]+)/;
				if (url.match(regex)) {
					return 'https://player.vimeo.com/video/' + RegExp.$3
				}

				return url
			}

			return url
		}

		function open(item, i, $s) {
			let source = item.attr('href')
			let slide = setSlide(item, i, 'current')
			let slideImage = slide.find('.cb-lightbox-slide-image')
			let container = $('.cb-lightbox')
			let cachedSlide = slides[i]

			container.addClass('cb-lightbox-init-transitions');

			setTranslate(slide, {
				top: 0,
				left: 0,
			});

			setTranslate(slideImage, {
				opacity: 0,
			});

			_animateDurationSet(container, $s.openCloseDuration);
			_animateDurationSet(container.find('.cb-lightbox-content'), $s.openCloseDuration);

			if (cachedSlide.type == 'error') {
				error(container, slide);
			} if (slideImage.data('fullHeight') === undefined) {
				//wait for imagesize;
				var wait = setInterval(function () {
					if (typeof slide === "undefined") {
						clearInterval(wait);
						return;
					}

					if (slideImage.data('fullHeight') !== undefined) {
						openStart();
						clearInterval(wait);
					}
				}, 100);
			} else {
				openStart();
			}

			function openStart() {
				if ($.isFunction($s.beforeOpen)) {
					$s.beforeOpen.call(this, container, slide);
				}

				updateCaption(item, slide, $s);

				if (slide && $s.openCloseEffect == 'zoom') {
					var previewImage = item.find('img');

					if (!previewImage.length) {
						previewImage = item;
					}

					var offsetTop = previewImage.offset().top - $(window).scrollTop(),
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

				} else if (slide && $s.openCloseEffect == 'fade') {

					var values = getImageFit(slideImage);

					setTranslate(slideImage, {
						width: values.width,
						height: values.height,
						top: values.top,
						left: values.left,
						opacity: 0
					});

					setTimeout(function () {
						_animate(slideImage, {
							opacity: 1,
						}, $s.openCloseDuration);
					}, 20);
				}

				container.addClass('cb-lightbox-run-opening');

				// First image cant zoom, disable zoom button 
				if ($s.zoom && $s.zoomButtons) {
					if (slideImage.data('zoomable') == false) {
						container.find('.cb-lightbox-zoom-button--in').addClass('cb-lightbox-zoom-button--disabled');
					}
				}

				setTimeout(function () {
					if (closing) {
						return;
					}

					opening = false;

					_animateDurationRemove(container);
					_animateDurationRemove(container.find('.cb-lightbox-content'));

					container.removeClass('cb-lightbox-init-opening cb-lightbox-run-opening cb-lightbox-init-transitions');

					// Todo focus lighbox 
					// item.blur()
					// container.focus()

				}, $s.openCloseDuration);

				setTimeout(function () {
					if ($.isFunction($s.afterOpen)) {
						$s.afterOpen.call(this, container, slide);
					}

				}, $s.openCloseDuration + 30);
			}
		}

		function onScroll(event) {
			event.preventDefault();
		}

		function close() {
			closing = true;

			clearTimeout(momentTimer);

			let el = $(".cb-lightbox-is-selected")
			let previewImage = el.find('img')
			let container = $('.cb-lightbox')

			if (!container.length) {
				return
			}

			let $s = container.data('settings')
			let slide = container.find('.cb-lightbox-slide.cb-lightbox-slide-current')
			let slideImage = slide.find('.cb-lightbox-slide-image')


			container.addClass('cb-lightbox-init-closing cb-lightbox-init-transitions');

			clearTimeout(container.data('watch'));

			if ($.isFunction($s.beforeClose)) {
				$s.beforeClose.call(this, container, slide);
			}

			if (!previewImage.length) {
				previewImage = el;
			}

			_animate(container, false, $s.openCloseDuration);
			_animate(container.find('.cb-lightbox-content'), false, $s.openCloseDuration);

			container.addClass('cb-lightbox-run-closing');

			if ($s.openCloseEffect == 'zoom' && el.is(':visible')) {
				var scaleWidth = previewImage.width() / slideImage.width(),
					scaleHeight = previewImage.height() / slideImage.height(),
					offsetTop = previewImage.offset().top - $(window).scrollTop();
				offsetLeft = previewImage.offset().left;

				_animate(slideImage, {
					top: offsetTop,
					left: offsetLeft,
					scaleX: scaleWidth,
					scaleY: scaleHeight,
				}, $s.openCloseDuration);

			} else if ($s.openCloseEffect == 'fade') {

				_animate(slide, {
					opacity: 0,
				}, $s.openCloseDuration);
			}

			setTimeout(function () {
				detroyDraggable(slide);
				$(".cb-lightbox").remove();
				$("html").removeClass("cb-lightbox-lock");
				el.removeClass('cb-lightbox-is-selected');
				closing = false;

				if ($.isFunction($s.afterClose)) {
					$s.afterClose.call(this, container);
				}

			}, $s.openCloseDuration + 20);

			//disable scroll events
			$('.cb-lightbox')[0].removeEventListener('mousewheel', onScroll, false);
			$('.cb-lightbox')[0].removeEventListener('touchmove', onScroll, false);
		}

		function init(item, settings) {
			var $s = settings,
				group = item.data("group"),
				grouplength = 0;

			firstLoad = true;
			opening = true;

			slides = [];

			if (typeof group !== 'undefined') {
				items = $('a[data-group="' + group + '"]');
				grouplength = items.length;

				_this_index = item.index('a[data-group="' + group + '"]');
			} else {

				_this_index = item.index(item, settings);
			}

			var tpl = $('<div class="cb-lightbox cb-lightbox-init-opening"></div>').append('<div class="cb-lightbox-overlay"></div>');

			var tplContent = $('<div class="cb-lightbox-content"></div>');
			
		
			tplContent.append('<div class="cb-lightbox-loading"><div class="cb-lightbox-loading-animation"></div></div><div class="cb-lightbox-slides"></div>');

			if ($s.zoomMap && $s.zoom) {
				tplContent.append('<div class="cb-lightbox__zoomMap"><div class="cb-lightbox__zoomMap-image"></div><div class="cb-lightbox__zoomMap-handle"></div></div>');
			}

			let toolbar = $('<div class="cb-lightbox-toolbar"></div>')
			if ($s.zoomButtons && $s.zoom) {
				toolbar.append('<button class="cb-lightbox-zoom-button cb-lightbox-zoom-button--in" aria-label="Zoom in"></button><button class="cb-lightbox-zoom-button cb-lightbox-zoom-button--out cb-lightbox-zoom-button--disabled" aria-label="Zoom out"></button>');
			}
			toolbar.append('<button class="cb-lightbox-close" aria-label="Close"></button>')
			tplContent.prepend(toolbar)


			tpl.append(tplContent);

			if (grouplength > 1 && !$s.insideArrows) {
				var arrows = $('<button class="cb-lightbox-arrow-prev cb-lightbox-arrow" aria-label="Previous image"><span></span></button><button class="cb-lightbox-arrow-next cb-lightbox-arrow" aria-label="Next image"><span></span></button>');
				arrows.appendTo(tpl.find(".cb-lightbox-content"));

				setTimeout(() => {
					if (!$s.wrapAround) {
						if (_this_index == 0) {
							arrowHide('prev', true);
						} else if (_this_index == grouplength - 1) {
							arrowHide('next', true);
						}
					}
				})
			}

			var captionTpl = $('<div class="cb-lightbox-info"></div>');

			captionTpl.appendTo(tpl.find(".cb-lightbox-content"));

			if (grouplength > 1 && $s.counter) {
				var counter = $('<div class="cb-lightbox-counter"></div>');

				$('<span class="cb-counter-current"></span><span class="cb-counter-seperator">/</span><span class="cb-counter-total"></span>').appendTo(counter);

				counter.find(".cb-counter-total").text($('a[data-group="' + group + '"]').length);
				counter.find(".cb-counter-current").text(_this_index + 1);

				tpl.find(".cb-lightbox-info").append(counter);
			}

			if (grouplength <= 1) {
				tpl.addClass('cb-lightbox-is-single');
			}

			//lock background
			if ($("body").height() > $(window).height()) {
				$("html").addClass("cb-lightbox-lock");
			}

			//set zoomOffset
			var zoomOffset = $s.zoomOffset;

			if ($.type(zoomOffset) === "number") {
				zoomOffset = [zoomOffset, zoomOffset, zoomOffset, zoomOffset];
			}

			if (zoomOffset.length == 2) {
				zoomOffset = [zoomOffset[0], zoomOffset[1], zoomOffset[0], zoomOffset[1]];
			}

			$s.zoomOffset = zoomOffset;

			//set margins
			if ($(window).width() < $s.breakpoint) {
				var margin = $s.mobileMargin;
			} else {
				var margin = $s.margin;
			}

			if ($.type(margin) === "number") {
				margin = [margin, margin, margin, margin];
			}

			if (margin.length == 2) {
				margin = [margin[0], margin[1], margin[0], margin[1]];
			}

			$s.margin = margin;

			tpl.data({
				'group': group,
				'grouplength': grouplength,
				'settings': $s
			});

			tpl.appendTo($('body'));

			if ($.isFunction($s.afterInit)) {
				$s.afterInit.call(this, tpl);
			}

			item.addClass("cb-lightbox-is-selected");

			//cache current slide
			cacheSlides(item, _this_index, 'current');

			//block scroll events
			$('.cb-lightbox')[0].addEventListener('mousewheel', onScroll, { passive: false });
			$('.cb-lightbox')[0].addEventListener('touchmove', onScroll, { passive: false });

			open(item, _this_index, $s);
		}

		if (!$(document).data('cb-lightbox-initialized')) {
			var clickTimer = false,
				userXTouch = 0,
				userYTouch = 0,
				firstTouch;

			$(document).on('click', '.cb-lightbox-arrow', function () {

				if (closing) {
					return
				}

				if ($(this).hasClass('cb-lightbox-arrow-prev')) {
					slideTo('previews');
				} else {
					slideTo('next');
				}
			});

			$(document).on("keypress", function (e) {
				if (e.which == 43) {
					if ($('.cb-lightbox-zoom-button').length) {
						$('.cb-lightbox-zoom-button--in').trigger('click')
					}
				} else if (e.which == 45) {
					if ($('.cb-lightbox-zoom-button').length) {
						$('.cb-lightbox-zoom-button--out').trigger('click')
					}
				}
			})

			$(document).on("keydown", function (e) {
				const container = $('.cb-lightbox')

				if (!container.length) {
					return
				}

				if (container.hasClass('cb-lightbox-is-zoomed')) {
					if (e.keyCode == 38) {
						moveImage('up')
					} else if (e.keyCode == 40) {
						moveImage('down')
					} else if (e.keyCode == 37) {
						moveImage('left')
					} else if (e.keyCode == 39) {
						moveImage('right')
					}
				} else {
					if (e.keyCode == 37) {
						slideTo('previews');
					} else if (e.keyCode == 39) {
						slideTo('next');
					}
				}

				if (e.key == 'Escape') {
					close();
				}
			});

			$(document).on("click", ".cb-lightbox-slide, .cb-lightbox-close", function (e) {
				if (closing || dragSlide) {
					return;
				}

				var container = $('.cb-lightbox'),
					$s = container.data('settings');

				if ((($(e.target).hasClass("cb-lightbox-slide") && $s.closeOutsideClick) || $(e.target).hasClass("cb-lightbox-close")) && !$(e.target).hasClass("cb-lightbox-arrow")) {
					close();
				}
			});

			$(document).on(is_touch_device() ? 'touchstart' : 'mousedown', '.cb-lightbox-slide-current .cb-lightbox-slide-image', function (e) {
				if (!is_touch_device()) {
					e.preventDefault();
				}

				if (closing || opening || $(e.target).hasClass('cb-lightbox-arrow')) {
					return;
				}

				clickTimer = true;
				setTimeout(function () {
					clickTimer = false;
				}, 200);

				//detekt two fingers
				if (e.type == "touchstart" && e.originalEvent.touches.length >= 2) {
					var secondTouch = new Date().getTime();

					if (secondTouch - firstTouch <= 200) {
						pinching = true;
					}
				}

				firstTouch = new Date().getTime();

				var container = $('.cb-lightbox'),
					$s = container.data('settings'),
					slideImage = $(this),
					slide = slideImage.closest('.cb-lightbox-slide'),
					imageSizes = getImageSizes(slideImage);

				if (e.type == "mousedown") {
					if (e.which != 1) {
						return false;
					}
				} else {
					userXTouch = e.originalEvent.touches[0].clientX - $(this).offset().left;
					userYTouch = e.originalEvent.touches[0].clientY - $(this).offset().top;
				}

				if (e.type == "touchstart" && e.originalEvent.touches.length >= 2) {
					// Multitouch zoom - panzoom

					if (slide.hasClass('cb-lightbox-is-sliding')) {
						return;
					}

					var currentScale = slideImage.data('currentPercentage'),
						touchStart1 = e.originalEvent.touches[0],
						touchStart2 = e.originalEvent.touches[1],
						lastTransform = getLastTransform(slideImage),
						imageWidth = imageSizes.width;
					imageHeight = imageSizes.height;

					var centerPointStartX = (touchStart1.clientX + touchStart2.clientX) * 0.5,
						centerPointStartY = (touchStart1.clientY + touchStart2.clientY) * 0.5,
						pinchPercentagePintX = (centerPointStartX - lastTransform.x) / imageWidth,
						pinchPercentagePintY = (centerPointStartY - lastTransform.y) / imageHeight,
						startPinch = getZoomDistance(touchStart1, touchStart2);

					slideImage.addClass('cb-lightbox-is-pinching');
					slideImage.data('currentZoomStep', 'auto');

					$(document).bind(is_touch_device() ? 'touchmove.cb-lightbox' : 'mousemove.cb-lightbox', function (e) {

						isDraggable = true;
						container.addClass('cb-lightbox-is-zoomed');

						var touchEnd1 = e.originalEvent.touches[0],
							touchEnd2 = e.originalEvent.touches[1],
							currentPinch = getZoomDistance(touchEnd1, touchEnd2),
							pinchDistance = (currentPinch - startPinch),
							newScale = currentScale + (pinchDistance / 3);

						if (newScale > 100) {

							container.find('.cb-lightbox-zoom-button--out').removeClass('cb-lightbox-zoom-button--disabled');
							container.find('.cb-lightbox-zoom-button--in').addClass('cb-lightbox-zoom-button--disabled');

							newScale = 100;

						} else if (newScale.toFixed(6) <= parseFloat(slideImage.data('fitPercentage').toFixed(6))) {
							newScale = slideImage.data('fitPercentage');

							isDraggable = false;
							container.removeClass('cb-lightbox-is-zoomed');

							container.find('.cb-lightbox-zoom-button--out').addClass('cb-lightbox-zoom-button--disabled');
							container.find('.cb-lightbox-zoom-button--in').removeClass('cb-lightbox-zoom-button--disabled');

						} else {
							container.find('.cb-lightbox-zoom-button').removeClass('cb-lightbox-zoom-button--disabled');
						}

						//set new scale percentage
						slideImage.data('currentPercentage', newScale);

						//center point 
						var centerPointEndX = (touchEnd1.clientX + touchEnd2.clientX) * 0.5,
							centerPointEndY = (touchEnd1.clientY + touchEnd2.clientY) * 0.5;

						//get new image size
						var newWidth = getImageSizes(slideImage).width,
							newHeight = getImageSizes(slideImage).height;

						var pinchTranslateFromTranslatingX = centerPointEndX - centerPointStartX,
							pinchTranslateFromTranslatingY = centerPointEndY - centerPointStartY;

						var pinchTranslateFromZoomX = (imageWidth - newWidth) * pinchPercentagePintX,
							pinchTranslateFromZoomY = (imageHeight - newHeight) * pinchPercentagePintY;

						var newX = lastTransform.x + (pinchTranslateFromZoomX + pinchTranslateFromTranslatingX),
							newY = lastTransform.y + (pinchTranslateFromZoomY + pinchTranslateFromTranslatingY);

						setTranslate(slideImage, {
							top: checkZoomLimit(newHeight, 'height', newY),
							left: checkZoomLimit(newWidth, 'width', newX),
							width: newWidth,
							height: newHeight,
						});

						zoomMapPosition(newX, newY);

					});

				} else if (!container.hasClass('cb-lightbox-is-zoomed') && !container.hasClass('cb-lightbox-is-single')) {
					// Dragging next/prev/close

					if (!$s.slideDraggable || opening || isDraggable) {
						return;
					}

					var imageWidth = slideImage.data('fullWidth'),
						windowWidth = $(window).width(),
						windowHeight = $(window).height(),
						moveDirection = false;

					if (e.type == "mousedown") {
						var pageXStart = e.pageX,
							pageYStart = e.pageY;
					} else {
						var pageXStart = e.originalEvent.touches[0].pageX,
							pageYStart = e.originalEvent.touches[0].pageY;
					}

					var dragWidth = windowWidth,
						dragPosX = dragWidth - pageXStart,
						dragHeight = windowHeight,
						dragPosY = dragHeight - pageYStart;

					$(document).bind(is_touch_device() ? 'touchmove.cb-lightbox' : 'mousemove.cb-lightbox', function (e) {

						if (pinching) {
							return;
						}

						if (e.type == "mousemove") {
							var pageXMove = e.pageX,
								pageYMove = e.pageY;
						} else {
							var pageXMove = e.originalEvent.touches[0].pageX,
								pageYMove = e.originalEvent.touches[0].pageY;
						}

						var dragLeft = pageXMove + dragPosX - dragWidth,
							dragTop = pageYMove + dragPosY - dragHeight;

						if (dragLeft == 0 && dragTop == 0) {
							return;
						}

						var angle = Math.abs((Math.atan2(dragTop, dragLeft) * 180) / Math.PI),
							direction = angle > 45 && angle < 135 ? "y" : "x";

						if (!moveDirection) {
							moveDirection = direction;
						}

						container.addClass('cb-lightbox--slide-dragging')

						if (moveDirection == 'y') {
							setTranslate(slideImage, {
								top: slideImage.data('fitTop') + dragTop,
							});

							slide
								.addClass('cb-lightbox-is-sliding')
								.data('slideY', dragTop);

						} else if (moveDirection == 'x') {
							setTranslate(slide, {
								left: dragLeft,
								top: 0
							});

							slide
								.addClass('cb-lightbox-is-sliding')
								.data('slideX', dragLeft);

							let previewSlide = $('.cb-lightbox-slide-previews')
							if (previewSlide.length) {
								setTranslate(previewSlide, {
									left: -$(window).width() + dragLeft,
									top: 0,
									opacity: 1
								});
							}

							let nextSlide = $('.cb-lightbox-slide-next')
							if (nextSlide.length) {
								setTranslate(nextSlide, {
									left: $(window).width() + dragLeft,
									top: 0,
									opacity: 1
								});
							}
						}
					});

				} else {
					// Dragging full size image
					container.addClass('cb-lightbox-is-grabbing');

					if (!slideImage.hasClass('cb-lightbox-slide-zoomable')) {
						return;
					}

					var imageWidth = imageSizes.width,
						windowWidth = $(window).width(),
						windowHeight = $(window).height(),
						lastTransform = getLastTransform(slideImage),
						lastTransformX = lastTransform.x,
						lastTransformY = lastTransform.y,
						imageHeight = imageSizes.height,
						maxX = windowWidth - imageWidth,
						maxY = windowHeight - imageHeight,
						startX,
						startY;

					if (e.type == "touchstart") {
						startX = e.originalEvent.touches[0].pageX - lastTransformX;
						startY = e.originalEvent.touches[0].pageY - lastTransformY;
					} else {
						startX = e.pageX - lastTransformX;
						startY = e.pageY - lastTransformY;
					}

					clearTimeout(momentTimer);
					lastT = new Date().getTime();

					mouseUp = false;
					logMousePosition();

					$(document).bind(is_touch_device() ? 'touchmove.cb-lightbox' : 'mousemove.cb-lightbox', function (e) {
						if (e.type == "touchmove") {
							var newX = e.originalEvent.touches[0].pageX - startX,
								newY = e.originalEvent.touches[0].pageY - startY;
						} else {
							var newX = e.pageX - startX,
								newY = e.pageY - startY;
						}

						//check element is dragging
						if (Math.abs(lastTransformX - newX) > 2 || Math.abs(lastTransformY - newY) > 2) {
							slideImage.addClass("cb-lightbox-slide-dragging");
							clickTimer = false;
						}

						if (!isDraggable || pinching) {
							return;
						}

						if (imageWidth < windowWidth) {
							newX = (windowWidth - imageWidth) / 2;
						} else if (newX > $s.zoomOffset[3]) {
							newX = ((newX - $s.zoomOffset[3]) / 3) + $s.zoomOffset[3];
						} else if (Math.abs(newX) - $s.zoomOffset[1] > imageWidth - windowWidth && imageWidth > windowWidth) {
							newX = ((-Math.abs(newX + $s.zoomOffset[1]) - maxX) / 3) + maxX - $s.zoomOffset[1];
						}

						if (imageHeight < windowHeight) {
							newY = (windowHeight - imageHeight) / 2;
						} else if (newY > $s.zoomOffset[0]) {
							newY = ((newY - $s.zoomOffset[0]) / 3) + $s.zoomOffset[0];
						} else if (Math.abs(newY) - $s.zoomOffset[2] > imageHeight - windowHeight && imageHeight > windowHeight) {
							newY = ((-Math.abs(newY + $s.zoomOffset[2]) - maxY) / 3) + maxY - $s.zoomOffset[2];
						}

						currentPoint = { x: newX, y: newY };

						zoomMapPosition(newX, newY);

						setTranslate(slideImage, {
							top: newY,
							left: newX
						});
					});
				}
			});

			$(document).on(is_touch_device() ? 'touchstart' : 'mousedown', '.cb-lightbox__zoomMap', function (e) {
				if (!is_touch_device()) {
					e.preventDefault();
				}

				if (closing || opening || !isDraggable) {
					return;
				}

				var container = $('.cb-lightbox'),
					$s = container.data('settings'),
					slide = $('.cb-lightbox-slide-current'),
					slideImage = slide.find('.cb-lightbox-slide-image');

				if (e.type == "mousedown") {
					if (e.which != 1) {
						return false;
					}
				}

				container.addClass('cb-lightbox-is-grabbing');
				slideImage.addClass('cb-lightbox-slide-dragging-zoommap');

				if (!slideImage.hasClass('cb-lightbox-slide-zoomable')) {
					return;
				}

				var area = $(this),
					windowWidth = $(window).width(),
					windowHeight = $(window).height(),
					handel = area.find('.cb-lightbox__zoomMap-handle'),
					handelWidth = handel.outerWidth(),
					handelHeight = handel.outerHeight(),
					areaWidth = area.width(),
					areaHeight = area.height(),
					lastOffsetX = parseInt(handel.css('left')),
					lastOffsetY = parseInt(handel.css('top')),
					startX,
					startY,
					imageWidth = slideImage.data('fullWidth') * (slideImage.data('currentPercentage') / 100),
					imageHeight = slideImage.data('fullHeight') * (slideImage.data('currentPercentage') / 100);

				if (e.type == "touchstart") {
					startX = e.originalEvent.touches[0].pageX - lastOffsetX;
					startY = e.originalEvent.touches[0].pageY - lastOffsetY;
				} else {
					startX = e.pageX - lastOffsetX;
					startY = e.pageY - lastOffsetY;
				}

				$(document).bind(is_touch_device() ? 'touchmove.cb-lightbox' : 'mousemove.cb-lightbox', function (e) {
					if (e.type == "touchmove") {
						var newX = e.originalEvent.touches[0].pageX - startX,
							newY = e.originalEvent.touches[0].pageY - startY;
					} else {
						var newX = e.pageX - startX,
							newY = e.pageY - startY;
					}

					if (newY < 0) {
						newY = 0;
					} else if ((newY / areaHeight * imageHeight) > imageHeight - $(window).height()) {

						if (imageHeight > $(window).height()) {
							newY = (Math.abs(imageHeight - $(window).height()) / imageHeight) * areaHeight;
						} else {
							newY = 0;
						}
					}

					if (newX < 0) {
						newX = 0;
					} else if ((newX / areaWidth * imageWidth) > imageWidth - $(window).width()) {

						if (imageWidth > $(window).width()) {
							newX = (Math.abs(imageWidth - $(window).width()) / imageWidth) * areaWidth;
						} else {
							newX = 0;
						}
					}

					handel.css({
						top: newY,
						left: newX
					});

					let imageLeft = (newX / areaWidth * imageWidth)
					if (imageLeft > imageWidth - $(window).width() && imageWidth < windowWidth) {
						// Center image horizontal
						imageLeft = (imageWidth - $(window).width()) / 2
					} else if (imageLeft > imageWidth - $(window).width() && imageWidth > windowWidth) {
						// Set image right limit
						imageLeft = imageWidth - $(window).width()
					}

					let imageTop = (newY / areaHeight * imageHeight)
					if (imageTop > imageHeight - $(window).height() && imageHeight < windowHeight) {
						// Center image vertical
						imageTop = (imageHeight - $(window).height()) / 2
					} else if (imageTop > imageHeight - $(window).height() && imageHeight > windowHeight) {
						// Set image bottom limit
						imageTop = imageHeight - $(window).height()
					}

					setTranslate(slideImage, {
						top: -imageTop,
						left: -imageLeft,
					})
				});
			});

			$(document).on(is_touch_device() ? 'touchend' : 'mouseup', function (e) {

				mouseUp = true;
				clearTimeout(positionInterval);
				clearTimeout(momentTimer);

				const container = $('.cb-lightbox')
				const $s = container.data('settings')

				container.removeClass('cb-lightbox-is-grabbing');
				$(this).unbind("mousemove.cb-lightbox touchmove.cb-lightbox");

				if ($(e.target).hasClass('cb-lightbox-close') || $(e.target).hasClass('cb-lightbox-content') || closing || $(e.target).hasClass('cb-lightbox-zoom-button')) {
					return;
				}

				if (e.which != 1 && e.which != 0) {
					return
				}

				if (e.type == 'mouseup' || e.type == 'touchend') {
					var slide = $(".cb-lightbox-slide-current"),
						slideImage = slide.find('.cb-lightbox-slide-image');

					container.removeClass('cb-lightbox--slide-dragging')

					if (slide.hasClass('cb-lightbox-is-sliding')) {
						//handle slide
						var tolerance = 40,
							resetSlide = false;

						if (slide.data('slideX')) {
							if (slide.data('slideX') > 0) {
								if (slide.data('slideX') > 0 + tolerance) {
									dragSlide = true
									slideTo('previews', 'slide');
								} else {
									resetSlide = true;
								}

							} else {
								if (slide.data('slideX') < 0 - tolerance) {
									dragSlide = true
									slideTo('next', 'slide');
								} else {
									resetSlide = true;
								}
							}

							slide.data('slideX', false);

							if (resetSlide) {
								_animate(slide, {
									left: 0,
								}, 250);

								slide.removeClass('cb-lightbox-is-sliding');
							}

						} else if (slide.data('slideY')) {
							if (Math.abs(slide.data('slideY')) > tolerance) {
								close();
							} else {
								_animate(slideImage, {
									'top': slideImage.data('fitTop')
								}, 250);

								slide.removeClass('cb-lightbox-is-sliding');
							}

							slide.data('slideY', false);
						}
					} else {
						if ($('.cb-lightbox').hasClass('cb-lightbox-is-loading')) {
							return false
						}

						if (clickTimer) {
							//handle after click
							if (!slideImage.hasClass("cb-lightbox-slide-dragging")) {
								if ($s.zoom == false) {
									return;
								}

								//move to click position
								if (e.type == "mouseup") {
									var userX = e.offsetX,
										userY = e.offsetY;
								} else {
									var userX = userXTouch + $(window).scrollLeft(),
										userY = userYTouch + $(window).scrollTop();
								}

								if ($(".cb-lightbox").hasClass("cb-lightbox-is-zoomed")) {
									container.find('.cb-lightbox-zoom-button--out').addClass('cb-lightbox-zoom-button--disabled');
									container.find('.cb-lightbox-zoom-button--in').removeClass('cb-lightbox-zoom-button--disabled');
									detroyDraggable(slideImage);
								} else {
									container.find('.cb-lightbox-zoom-button--out').removeClass('cb-lightbox-zoom-button--disabled');
									container.find('.cb-lightbox-zoom-button--in').addClass('cb-lightbox-zoom-button--disabled');
									initDraggable(slideImage, userX, userY);
								}

							} else {
								$(this).off("mousemove.cb-lightbox touchmove.cb-lightbox");
							}

						} else if (slideImage.hasClass('cb-lightbox-slide-dragging-zoommap')) {

						} else if (slideImage.hasClass('cb-lightbox-is-pinching')) {

						} else if (!pinching) {
							if ($('.cb-lightbox-is-zoomed').length && isDraggable) {
								initMoveMoment(slideImage);
							}
						}
					}

					pinching = false;

					slideImage.removeClass('cb-lightbox-is-pinching');
					slideImage.removeClass("cb-lightbox-slide-dragging");
					slideImage.removeClass('cb-lightbox-slide-dragging-zoommap');
				}
			});

			function calcZoomStep(slideImage, zoomStep) {
				const fitScale = slideImage.data('fitPercentage')
				const zoomFactor = slideImage.data('zoomFactor')
				const newScaleSize = fitScale * (zoomFactor ** zoomStep)

				// Round news scale size 
				return parseFloat(newScaleSize.toFixed(4))
			}

			$(document).on('click', '.cb-lightbox-zoom-button', function () {
				const container = $('.cb-lightbox')
				const $s = container.data('settings')
				const button = $(this)
				const buttons = button.closest('.cb-lightbox-toolbar')
				const currentSlide = $('.cb-lightbox-slide-current')
				const slideImage = currentSlide.find('.cb-lightbox-slide-image')

				if (!slideImage.hasClass('cb-lightbox-slide-zoomable')) {
					return;
				}

				if (button.hasClass('cb-lightbox-zoom-button--disabled')) {
					return;
				}

				let currentScale = slideImage.data('currentPercentage')
				let currentZoomStep = slideImage.data('currentZoomStep')
				let newScale = false

				if (button.hasClass('cb-lightbox-zoom-button--in')) {
					isDraggable = true;
					container.addClass('cb-lightbox-is-zoomed');

					let newZoom = 0;
					if (currentZoomStep == 'auto') {
						for (let i = 0; i <= 99; i++) {
							calculatedScale = calcZoomStep(slideImage, i);

							if (calculatedScale >= currentScale) {
								newZoom = i;
								break;
							}
						}
					} else {
						newZoom = currentZoomStep + 1;
						if (newZoom > $s.zoomSteps) {
							newZoom = $s.zoomSteps;
						}
					}

					slideImage.data('currentZoomStep', newZoom);
					newScale = calcZoomStep(slideImage, newZoom)

					buttons.find('.cb-lightbox-zoom-button--out').removeClass('cb-lightbox-zoom-button--disabled');

					// Limit zoom in 
					if (newScale >= 100) {
						newScale = 100;

						button.addClass('cb-lightbox-zoom-button--disabled');
					}

				} else if (button.hasClass('cb-lightbox-zoom-button--out')) {

					let newZoom;
					if (currentZoomStep == 'auto') {
						for (let i = 0; i <= 99; i++) {

							calculatedScale = calcZoomStep(slideImage, i);

							if (calculatedScale >= currentScale) {
								newZoom = i - 1;

								break;
							}
						}
					} else {
						newZoom = currentZoomStep - 1;
						if (newZoom <= 0) {
							newZoom = 0;
						}
					}

					slideImage.data('currentZoomStep', newZoom)
					newScale = calcZoomStep(slideImage, newZoom)

					buttons.find('.cb-lightbox-zoom-button--in').removeClass('cb-lightbox-zoom-button--disabled');

					// Limit zoom out
					if (newScale.toFixed(4) <= parseFloat(slideImage.data('fitPercentage').toFixed(4))) {
						newScale = slideImage.data('fitPercentage');

						isDraggable = false;

						button.addClass('cb-lightbox-zoom-button--disabled');
					}
				}

				slideImage.data('currentPercentage', newScale);

				var newWidth = getImageSizes(slideImage).width,
					newHeight = getImageSizes(slideImage).height,
					diffWidth = newWidth - (slideImage.data('fullWidth') * (currentScale / 100)),
					diffHeight = newHeight - (slideImage.data('fullHeight') * (currentScale / 100)),
					lastTransform = getLastTransform(slideImage),
					newY = lastTransform.y - (diffHeight / 2),
					newX = lastTransform.x - (diffWidth / 2),
					scaleWidth = newWidth / slideImage.width(),
					scaleHeight = newHeight / slideImage.height();

				//more to original position
				if (!isDraggable) {
					newY = slideImage.data('fitTop');
					newX = slideImage.data('fitLeft');
				} else {
					newY = checkZoomLimit(newHeight, 'height', newY);
					newX = checkZoomLimit(newWidth, 'width', newX);
				}

				_animate(slideImage, {
					top: newY,
					left: newX,
					scaleX: scaleWidth,
					scaleY: scaleHeight,
				}, $s.zoomDuration);

				zoomMapPosition(newX, newY, true);

				setTimeout(function () {

					if (!isDraggable) {
						container.removeClass('cb-lightbox-is-zoomed');
					}

				}, $s.zoomDuration);
			});

			$(window).on("resize", function () {
				if (!$("html").hasClass("cb-lightbox-touch") && $('.cb-lightbox').hasClass('cb-lightbox-is-zoomed')) {
					detroyDraggable($('.cb-lightbox-slide-current .cb-lightbox-slide-image'), true);
				}

				// TODO trigger fit after opening

				if (closing || opening) {
					return;
				}

				let lightbox = $('.cb-lightbox');

				if (lightbox.length) {
					var $s = lightbox.data('settings');

					$('.cb-lightbox-slide').each(function () {
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

						if (caption.length) {
							captionInsidePosition(caption, slideImage);
						}

						if (slide.hasClass('cb-lightbox-slide-current')) {
							// After resize check if can zoom current image
							if ($s.zoom && $s.zoomButtons) {
								if (slideImage.data('zoomable') == false) {
									lightbox.find('.cb-lightbox-zoom-button--in').addClass('cb-lightbox-zoom-button--disabled');
								} else {
									lightbox.find('.cb-lightbox-zoom-button--in').removeClass('cb-lightbox-zoom-button--disabled');
								}

								lightbox.find('.cb-lightbox-zoom-button--out').addClass('cb-lightbox-zoom-button--disabled');
							}

							// Callback after resize current image
							if ($.isFunction($s.onResize)) {
								$s.onResize.call(this, $('.cb-lightbox'), slide);
							}
						}
					});
				}
			});

			$(document).data('cb-lightbox-initialized', true);
		}

		return $(this).each(function () {
			const item = $(this);

			const settings = $.extend({}, defaults, options);

			item.on("click", function (e) {
				e.stopPropagation();
				e.preventDefault();

				if ($('.cb-lightbox').length) {
					return;
				}

				if (settings.disableOnMobile && $(window).width() < settings.breakpoint) {
					return;
				}

				init(item, settings);
			});
		});
	}
})(jQuery);