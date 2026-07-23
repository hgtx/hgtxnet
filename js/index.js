//
//
// Index JS
//
//



(function ($) {
	'use strict';



	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Navigation

	// Global vars
	var navTarget = $('body').attr('data-page-url');
	var docTitle = document.title;
	var History = window.History;

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Gallery lightbox

	var $galleryLightbox = $(
		'<div class="gallery-lightbox" aria-hidden="true">' +
			'<div class="gallery-lightbox__overlay"></div>' +
			'<div class="gallery-lightbox__viewport">' +
				'<div class="gallery-lightbox__track is-resetting">' +
					'<div class="gallery-lightbox__slide">' +
						'<img class="gallery-lightbox__image" alt="">' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>'
	);

	$galleryLightbox.appendTo('body');

	var galleryLightboxState = {
		images: [],
		index: -1
	};

	var galleryLightboxAnimating = false;

	var galleryLightboxTouchStartX = 0;
	var galleryLightboxTouchStartY = 0;
	var galleryLightboxDidSwipe = false;
	var galleryLightboxCloseCallback = null;
	var galleryLightboxOpenOnLoad = false;
	var galleryThumbTouchStartX = 0;
	var galleryThumbTouchStartY = 0;
	var portfolioTouchStartX = 0;
	var portfolioTouchStartY = 0;

	function getGalleryLightboxTrack() {
		return $galleryLightbox.find('.gallery-lightbox__track');
	}

	function getGalleryLightboxImage() {
		return $galleryLightbox.find('.gallery-lightbox__image');
	}

	function normalizeGalleryIndex(index) {
		var total = galleryLightboxState.images.length;

		if ( index < 0 ) {
			index = total - 1;
		}

		if ( index >= total ) {
			index = 0;
		}

		return index;
	}

	function loadGalleryLightboxImage($image, src, callback) {
		$image.one('load', callback);
		$image.attr('src', src);

		if ( $image[0].complete ) {
			callback();
		}
	}

	function forceGalleryLightboxReflow($element) {
		return $element[0].offsetHeight;
	}

	function setGalleryLightboxSingleSlide(src, callback) {
		var $track = getGalleryLightboxTrack();

		$track
			.removeClass('is-animating')
			.addClass('is-resetting')
			.css('transform', 'translate3d(0, 0, 0)')
			.html('<div class="gallery-lightbox__slide"><img class="gallery-lightbox__image" alt=""></div>');

		loadGalleryLightboxImage($track.find('.gallery-lightbox__image'), src, function() {
			$track.removeClass('is-resetting');

			if ( callback ) {
				callback();
			}
		});
	}

	function resetGalleryLightboxSlides() {
		galleryLightboxAnimating = false;

		getGalleryLightboxTrack()
			.removeClass('is-animating is-resetting')
			.css('transform', 'translate3d(0, 0, 0)')
			.html('<div class="gallery-lightbox__slide"><img class="gallery-lightbox__image" alt=""></div>');

		getGalleryLightboxImage().attr('src', '');
	}

	function animateGalleryLightboxSlide(index, direction) {
		if ( galleryLightboxAnimating || !galleryLightboxState.images.length ) {
			return;
		}

		var oldIndex = galleryLightboxState.index;

		index = normalizeGalleryIndex(index);

		if ( index === oldIndex ) {
			return;
		}

		var outgoingSrc = galleryLightboxState.images[oldIndex];
		var incomingSrc = galleryLightboxState.images[index];
		var $track = getGalleryLightboxTrack();
		var trackHtml;

		galleryLightboxAnimating = true;

		if ( direction > 0 ) {
			trackHtml =
				'<div class="gallery-lightbox__slide"><img class="gallery-lightbox__image" alt=""></div>' +
				'<div class="gallery-lightbox__slide"><img class="gallery-lightbox__image" alt=""></div>';

			$track
				.removeClass('is-animating')
				.addClass('is-resetting')
				.css('transform', 'translate3d(0, 0, 0)')
				.html(trackHtml);

			$track.find('.gallery-lightbox__slide').eq(0).find('img').attr('src', outgoingSrc);
		}
		else {
			trackHtml =
				'<div class="gallery-lightbox__slide"><img class="gallery-lightbox__image" alt=""></div>' +
				'<div class="gallery-lightbox__slide"><img class="gallery-lightbox__image" alt=""></div>';

			$track
				.removeClass('is-animating')
				.addClass('is-resetting')
				.css('transform', 'translate3d(-100vw, 0, 0)')
				.html(trackHtml);

			$track.find('.gallery-lightbox__slide').eq(1).find('img').attr('src', outgoingSrc);
		}

		var $incomingImage = direction > 0 ?
			$track.find('.gallery-lightbox__slide').eq(1).find('img') :
			$track.find('.gallery-lightbox__slide').eq(0).find('img');

		loadGalleryLightboxImage($incomingImage, incomingSrc, function() {
			forceGalleryLightboxReflow($track);

			$track.removeClass('is-resetting').addClass('is-animating');

			if ( direction > 0 ) {
				$track.css('transform', 'translate3d(-100vw, 0, 0)');
			}
			else {
				$track.css('transform', 'translate3d(0, 0, 0)');
			}

			galleryLightboxState.index = index;

			var finished = false;

			var finishSlide = function(event) {
				if ( event && event.target !== $track[0] ) {
					return;
				}

				if ( finished ) {
					return;
				}

				finished = true;
				$track.off('transitionend webkitTransitionEnd', finishSlide);
				setGalleryLightboxSingleSlide(incomingSrc);
				galleryLightboxAnimating = false;
			};

			$track.on('transitionend webkitTransitionEnd', finishSlide);
			window.setTimeout(finishSlide, 650);
		});
	}

	function showGalleryLightboxImage(index, direction) {
		if ( direction === 0 ) {
			$galleryLightbox.addClass('gallery-lightbox--loading');

			setGalleryLightboxSingleSlide(galleryLightboxState.images[index], function() {
				$galleryLightbox.removeClass('gallery-lightbox--loading');
			});

			return;
		}

		animateGalleryLightboxSlide(index, direction);
	}

	function openGalleryLightbox(imageSrc, $link) {
		galleryLightboxState.images = getGalleryImages($link);
		galleryLightboxState.index = galleryLightboxState.images.indexOf(imageSrc);

		if ( galleryLightboxState.index < 0 ) {
			galleryLightboxState.index = 0;
		}

		resetGalleryLightboxSlides();

		$galleryLightbox
			.addClass('gallery-lightbox--open')
			.attr('aria-hidden', 'false');

		$('body').addClass('gallery-lightbox-active');

		showGalleryLightboxImage(galleryLightboxState.index, 0);
	}

	function navigateGalleryLightbox(delta) {
		if ( !galleryLightboxState.images.length || galleryLightboxAnimating ) {
			return;
		}

		showGalleryLightboxImage(galleryLightboxState.index + delta, delta);
	}

	function finalizeGalleryLightboxClose() {
		$galleryLightbox
			.removeClass('gallery-lightbox--open gallery-lightbox--loading gallery-lightbox--closing')
			.attr('aria-hidden', 'true');

		resetGalleryLightboxSlides();
		$('body').removeClass('gallery-lightbox-active');

		galleryLightboxState.images = [];
		galleryLightboxState.index = -1;
		galleryLightboxAnimating = false;

		if ( galleryLightboxCloseCallback ) {
			var callback = galleryLightboxCloseCallback;

			galleryLightboxCloseCallback = null;
			callback();
		}
	}

	function closeGalleryLightbox(animated, callback) {
		if ( galleryLightboxAnimating || !isGalleryLightboxOpen() ) {
			return;
		}

		galleryLightboxCloseCallback = callback || null;

		if ( !animated ) {
			finalizeGalleryLightboxClose();
			return;
		}

		var $track = getGalleryLightboxTrack();

		galleryLightboxAnimating = true;
		$galleryLightbox.addClass('gallery-lightbox--closing');

		forceGalleryLightboxReflow($track);

		$track
			.removeClass('is-resetting is-closing')
			.addClass('is-animating is-closing')
			.css('transform', 'translate3d(0, 100vh, 0)');

		var finished = false;

		var finishClose = function(event) {
			if ( event && event.target !== $track[0] ) {
				return;
			}

			if ( finished ) {
				return;
			}

			finished = true;
			$track.off('transitionend webkitTransitionEnd', finishClose);
			finalizeGalleryLightboxClose();
		};

		$track.on('transitionend webkitTransitionEnd', finishClose);
		window.setTimeout(finishClose, 650);
	}

	function getGalleryImages($link) {
		return $link.closest('.gallery--grid').find('.gallery__item__link').map(function() {
			return $(this).attr('href');
		}).get();
	}

	function isGalleryLightboxOpen() {
		return $galleryLightbox.hasClass('gallery-lightbox--open');
	}

	function normalizeProjectPath(path) {
		if ( !path || path === '/' ) {
			return path || '/';
		}

		if ( path.charAt(path.length - 1) !== '/' ) {
			return path + '/';
		}

		return path;
	}

	function getProjectUrls() {
		return $('.projects-menu .menu__list__item__link').map(function() {
			return normalizeProjectPath($(this).attr('href'));
		}).get();
	}

	function getNextProjectUrl() {
		var projectUrls = getProjectUrls();

		if ( !projectUrls.length ) {
			return null;
		}

		var currentPath = normalizeProjectPath(navTarget || window.location.pathname);
		var currentIndex = projectUrls.indexOf(currentPath);

		if ( currentIndex < 0 ) {
			return projectUrls[0];
		}

		return projectUrls[(currentIndex + 1) % projectUrls.length];
	}

	function getPreviousProjectUrl() {
		var projectUrls = getProjectUrls();

		if ( !projectUrls.length ) {
			return null;
		}

		var currentPath = normalizeProjectPath(navTarget || window.location.pathname);
		var currentIndex = projectUrls.indexOf(currentPath);

		if ( currentIndex < 0 ) {
			return projectUrls[projectUrls.length - 1];
		}

		return projectUrls[(currentIndex - 1 + projectUrls.length) % projectUrls.length];
	}

	function isCoverPage() {
		var path = normalizeProjectPath(navTarget || window.location.pathname);

		return path === '/' || $('.page__content .cover').length > 0;
	}

	function isProjectsListingPage() {
		var path = normalizeProjectPath(navTarget || window.location.pathname);

		return path === '/projects/' || $('.page__content .portfolio-wrap').length > 0;
	}

	function isMainMenuPage() {
		var currentPath = normalizeProjectPath(navTarget || window.location.pathname);

		return getMainPageUrls().indexOf(currentPath) >= 0;
	}

	function isMainNavigationContext() {
		return isCoverPage() || isMainMenuPage();
	}

	function isProjectGalleryPage() {
		var path = normalizeProjectPath(navTarget || window.location.pathname);

		if ( path.indexOf('/project/') !== 0 ) {
			return false;
		}

		return $('.page__content .gallery--grid .gallery__item__link').length > 0;
	}

	function getMainPageUrls() {
		return $('.menu .menu__list__item__link').map(function() {
			return normalizeProjectPath($(this).attr('href'));
		}).get();
	}

	function navigateMainPage(delta) {
		if ( galleryLightboxAnimating || isGalleryLightboxOpen() ) {
			return false;
		}

		if ( !isMainNavigationContext() ) {
			return false;
		}

		var mainPageUrls = getMainPageUrls();
		var mainPageUrl;

		if ( !mainPageUrls.length ) {
			return false;
		}

		var currentPath = normalizeProjectPath(navTarget || window.location.pathname);
		var currentIndex = mainPageUrls.indexOf(currentPath);

		if ( currentIndex < 0 ) {
			if ( !isCoverPage() ) {
				return false;
			}

			mainPageUrl = delta > 0 ? mainPageUrls[0] : mainPageUrls[mainPageUrls.length - 1];
		}
		else {
			mainPageUrl = mainPageUrls[(currentIndex + delta + mainPageUrls.length) % mainPageUrls.length];
		}

		navTarget = mainPageUrl;
		History.pushState(null, docTitle, mainPageUrl);
		return true;
	}

	function getParentPageUrl() {
		var path = normalizeProjectPath(navTarget || window.location.pathname);

		if ( path === '/' ) {
			return null;
		}

		if ( isMainMenuPage() ) {
			return '/';
		}

		if ( path.indexOf('/project/') === 0 ) {
			return '/projects/';
		}

		return null;
	}

	function navigateUpHierarchy() {
		if ( galleryLightboxAnimating || isGalleryLightboxOpen() ) {
			return false;
		}

		var parentUrl = getParentPageUrl();

		if ( !parentUrl ) {
			return false;
		}

		navTarget = parentUrl;
		History.pushState(null, docTitle, parentUrl);
		return true;
	}

	function getChildPageUrl() {
		if ( isCoverPage() ) {
			return '/projects/';
		}

		if ( isProjectsListingPage() ) {
			var projectUrls = getProjectUrls();

			if ( !projectUrls.length ) {
				return null;
			}

			return projectUrls[0];
		}

		return null;
	}

	function navigateDownHierarchy() {
		if ( galleryLightboxAnimating || isGalleryLightboxOpen() ) {
			return false;
		}

		var childUrl = getChildPageUrl();

		if ( !childUrl ) {
			return false;
		}

		navTarget = childUrl;
		History.pushState(null, docTitle, childUrl);
		return true;
	}

	function randomizeCoverImage(callback) {
		var $cover = $('.page__content .cover');

		if ( !$cover.length ) {
			if ( callback ) {
				callback(false);
			}

			return;
		}

		var imagesJson = $cover.attr('data-cover-images');
		var $coverImage = $cover.find('.cover__image');

		$cover.removeClass('cover--ready');

		if ( !imagesJson ) {
			$cover.addClass('cover--ready');

			if ( callback ) {
				callback(true, $coverImage[0]);
			}

			return;
		}

		var images;

		try {
			images = JSON.parse(imagesJson);
		}
		catch ( error ) {
			$cover.addClass('cover--ready');

			if ( callback ) {
				callback(true, $coverImage[0]);
			}

			return;
		}

		if ( !images.length ) {
			$cover.addClass('cover--ready');

			if ( callback ) {
				callback(true, $coverImage[0]);
			}

			return;
		}

		var image = images[Math.floor(Math.random() * images.length)];
		var preload = new Image();

		preload.onload = preload.onerror = function() {
			$coverImage.attr('src', image);

			requestAnimationFrame(function() {
				$cover.addClass('cover--ready');

				if ( callback ) {
					callback(true, $coverImage[0]);
				}
			});
		};

		preload.src = image;
	}

	function revealPageContent() {
		// Portfolio grid layout
		$('.portfolio-wrap').imagesLoaded( function() {
			$('.portfolio-wrap').masonry({
				itemSelector: '.portfolio-item',
				transitionDuration: 0
			});
		});

		// Blog grid layout
		$('.blog-wrap').imagesLoaded( function() {
			$('.blog-wrap').masonry({
				itemSelector: '.blog-post',
				transitionDuration: 0
			});
		});

		$('body').removeClass('loading is-cover-page menu--open');
	}

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Cover background

	var coverBackgroundDuration = 600;
	var coverBackgroundTimer = null;

	function clearCoverBackgroundTimer() {
		if ( coverBackgroundTimer ) {
			clearTimeout(coverBackgroundTimer);
			coverBackgroundTimer = null;
		}
	}

	function forceCoverBackgroundReflow(element) {
		return element.offsetHeight;
	}

	function beginCoverBackgroundTransition() {
		$('body').addClass('cover-background-transition');
	}

	function endCoverBackgroundTransition(callback) {
		coverBackgroundTimer = setTimeout(function() {
			coverBackgroundTimer = null;
			$('body').removeClass('cover-background-transition');

			if ( callback ) {
				callback();
			}
		}, coverBackgroundDuration);
	}

	function getDominantColorFromImage(img) {
		try {
			var canvas = document.createElement('canvas');
			var sampleSize = 32;
			var cropScale = 0.5;
			var sourceWidth = img.naturalWidth;
			var sourceHeight = img.naturalHeight;
			var cropWidth = sourceWidth * cropScale;
			var cropHeight = sourceHeight * cropScale;
			var cropX = (sourceWidth - cropWidth) / 2;
			var cropY = (sourceHeight - cropHeight) / 2;

			canvas.width = sampleSize;
			canvas.height = sampleSize;

			var context = canvas.getContext('2d');

			context.drawImage(
				img,
				cropX,
				cropY,
				cropWidth,
				cropHeight,
				0,
				0,
				sampleSize,
				sampleSize
			);

			var pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;
			var redTotal = 0;
			var greenTotal = 0;
			var blueTotal = 0;
			var count = 0;

			for ( var i = 0; i < pixels.length; i += 4 ) {
				if ( pixels[i + 3] < 125 ) {
					continue;
				}

				if ( pixels[i] > 245 && pixels[i + 1] > 245 && pixels[i + 2] > 245 ) {
					continue;
				}

				redTotal += pixels[i];
				greenTotal += pixels[i + 1];
				blueTotal += pixels[i + 2];
				count++;
			}

			if ( !count ) {
				return null;
			}

			return {
				r: Math.round(redTotal / count),
				g: Math.round(greenTotal / count),
				b: Math.round(blueTotal / count)
			};
		}
		catch ( error ) {
			return null;
		}
	}

	function softenCoverBackgroundColor(color) {
		var mix = 0.35;

		return {
			r: Math.round(color.r * mix + 255 * (1 - mix)),
			g: Math.round(color.g * mix + 255 * (1 - mix)),
			b: Math.round(color.b * mix + 255 * (1 - mix))
		};
	}

	function colorToRgbString(color) {
		return 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
	}

	function resetCoverBackground(animated) {
		var $body = $('body');

		if ( animated && $body.hasClass('cover-page-active') ) {
			clearCoverBackgroundTimer();
			beginCoverBackgroundTransition();
			$body.css('background-color', '#ffffff');

			endCoverBackgroundTransition(function() {
				$body
					.removeClass('cover-page-active')
					.css('background-color', '');
			});

			return;
		}

		if ( coverBackgroundTimer ) {
			return;
		}

		$body
			.removeClass('cover-page-active cover-background-transition')
			.css('background-color', '');
	}

	function applyCoverBackgroundFromImage(img, animated) {
		if ( !img || !img.complete || !img.naturalWidth ) {
			resetCoverBackground(false);
			return;
		}

		var dominantColor = getDominantColorFromImage(img);

		if ( !dominantColor ) {
			resetCoverBackground(false);
			return;
		}

		var backgroundColor = softenCoverBackgroundColor(dominantColor);
		var tint = colorToRgbString(backgroundColor);
		var $body = $('body');

		clearCoverBackgroundTimer();
		$body.addClass('cover-page-active');

		if ( animated === false ) {
			$body.css('background-color', tint);
			return;
		}

		beginCoverBackgroundTransition();
		$body.css('background-color', '#ffffff');
		forceCoverBackgroundReflow($body[0]);
		$body.css('background-color', tint);

		endCoverBackgroundTransition();
	}

	function updateCoverBackground() {
		var $coverImage = $('.page__content .cover__image');

		if ( !$coverImage.length ) {
			resetCoverBackground(false);
			return;
		}

		var coverImage = $coverImage[0];

		if ( coverImage.complete && coverImage.naturalWidth ) {
			applyCoverBackgroundFromImage(coverImage, true);
		}
		else {
			$coverImage.one('load error', function() {
				applyCoverBackgroundFromImage(coverImage, true);
			});
		}
	}

	function fadeCoverBackgroundOnLeave() {
		var newPath = normalizeProjectPath(window.location.pathname);
		var leavingCover = $('.page__content .cover').length > 0 && newPath !== '/';

		if ( leavingCover ) {
			resetCoverBackground(true);
		}
	}

	function updateActiveLinks() {
		var currentPath = normalizeProjectPath(navTarget || window.location.pathname);

		$('.active-link').removeClass('active-link');

		$('.menu .menu__list__item__link').each(function() {
			var linkPath = normalizeProjectPath($(this).attr('href'));
			var isActive = false;

			if ( linkPath === '/projects/' ) {
				isActive = currentPath === '/projects/' || currentPath.indexOf('/project/') === 0;
			}
			else {
				isActive = currentPath === linkPath;
			}

			if ( isActive ) {
				$(this).addClass('active-link');
			}
		});

		if ( currentPath.indexOf('/project/') === 0 ) {
			$('.projects-menu .menu__list__item__link').each(function() {
				if ( normalizeProjectPath($(this).attr('href')) === currentPath ) {
					$(this).addClass('active-link');
				}
			});
		}
	}

	function openFirstGalleryLightboxFromThumbnails() {
		if ( galleryLightboxAnimating || isGalleryLightboxOpen() ) {
			return false;
		}

		var $firstLink = $('.page__content .gallery--grid .gallery__item__link').first();

		if ( !$firstLink.length ) {
			return false;
		}

		openGalleryLightbox($firstLink.attr('href'), $firstLink);
		return true;
	}

	function navigateToNextProjectFromThumbnails() {
		if ( galleryLightboxAnimating || isGalleryLightboxOpen() || !isProjectGalleryPage() ) {
			return false;
		}

		var nextProjectUrl = getNextProjectUrl();

		if ( !nextProjectUrl ) {
			return false;
		}

		navTarget = nextProjectUrl;
		History.pushState(null, docTitle, nextProjectUrl);
		return true;
	}

	function navigateToPreviousProjectFromThumbnails() {
		if ( galleryLightboxAnimating || isGalleryLightboxOpen() || !isProjectGalleryPage() ) {
			return false;
		}

		var previousProjectUrl = getPreviousProjectUrl();

		if ( !previousProjectUrl ) {
			return false;
		}

		navTarget = previousProjectUrl;
		History.pushState(null, docTitle, previousProjectUrl);
		return true;
	}

	function openFirstGalleryLightboxOnPage() {
		if ( !galleryLightboxOpenOnLoad ) {
			return;
		}

		galleryLightboxOpenOnLoad = false;
		openFirstGalleryLightboxFromThumbnails();
	}

	function navigateToNextProject() {
		if ( galleryLightboxAnimating || !isGalleryLightboxOpen() ) {
			return;
		}

		var nextProjectUrl = getNextProjectUrl();

		if ( !nextProjectUrl ) {
			return;
		}

		galleryLightboxOpenOnLoad = true;

		closeGalleryLightbox(true, function() {
			navTarget = nextProjectUrl;
			History.pushState(null, docTitle, nextProjectUrl);
		});
	}

	$(document).on('click', '.gallery--grid .gallery__item__link', function(event) {
		event.preventDefault();
		openGalleryLightbox($(this).attr('href'), $(this));
	});

	$(document).on('click', '.gallery-lightbox__overlay', function() {
		closeGalleryLightbox(false);
	});

	$(document).on('click', '.gallery-lightbox__viewport .gallery-lightbox__image', function() {
		if ( galleryLightboxDidSwipe ) {
			return;
		}

		closeGalleryLightbox(false);
	});

	$galleryLightbox.on('touchstart', '.gallery-lightbox__viewport', function(event) {
		galleryLightboxTouchStartX = event.originalEvent.touches[0].clientX;
		galleryLightboxTouchStartY = event.originalEvent.touches[0].clientY;
		galleryLightboxDidSwipe = false;
	});

	$galleryLightbox.on('touchend', '.gallery-lightbox__viewport', function(event) {
		var touchEndX = event.originalEvent.changedTouches[0].clientX;
		var touchEndY = event.originalEvent.changedTouches[0].clientY;
		var deltaX = touchEndX - galleryLightboxTouchStartX;
		var deltaY = touchEndY - galleryLightboxTouchStartY;

		if ( Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50 ) {
			return;
		}

		galleryLightboxDidSwipe = true;

		if ( Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0 ) {
			closeGalleryLightbox(true);
		}
		else if ( Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0 ) {
			navigateToNextProject();
		}
		else if ( Math.abs(deltaX) >= 50 ) {
			if ( deltaX < 0 ) {
				navigateGalleryLightbox(1);
			}
			else {
				navigateGalleryLightbox(-1);
			}
		}

		setTimeout(function() {
			galleryLightboxDidSwipe = false;
		}, 400);
	});

	$(document).on('keydown', function(event) {
		if ( isGalleryLightboxOpen() ) {
			if ( event.key === 'Escape' ) {
				closeGalleryLightbox(false);
			}
			else if ( event.key === 'ArrowUp' ) {
				event.preventDefault();
				closeGalleryLightbox(true);
			}
			else if ( event.key === 'ArrowDown' ) {
				event.preventDefault();
				navigateToNextProject();
			}
			else if ( event.key === 'ArrowLeft' ) {
				event.preventDefault();
				navigateGalleryLightbox(-1);
			}
			else if ( event.key === 'ArrowRight' ) {
				event.preventDefault();
				navigateGalleryLightbox(1);
			}

			return;
		}

		if ( event.key === 'ArrowLeft' && navigateUpHierarchy() ) {
			event.preventDefault();
		}
		else if ( event.key === 'ArrowRight' && navigateDownHierarchy() ) {
			event.preventDefault();
		}
		else if ( isMainNavigationContext() ) {
			if ( event.key === 'ArrowDown' && navigateMainPage(1) ) {
				event.preventDefault();
			}
			else if ( event.key === 'ArrowUp' && navigateMainPage(-1) ) {
				event.preventDefault();
			}
		}
		else if ( isProjectGalleryPage() ) {
			if ( event.key === 'ArrowRight' && openFirstGalleryLightboxFromThumbnails() ) {
				event.preventDefault();
			}
			else if ( event.key === 'ArrowDown' && navigateToNextProjectFromThumbnails() ) {
				event.preventDefault();
			}
			else if ( event.key === 'ArrowUp' && navigateToPreviousProjectFromThumbnails() ) {
				event.preventDefault();
			}
		}
	});

	$(document).on('touchstart', '.page__content .gallery--grid', function(event) {
		if ( isGalleryLightboxOpen() ) {
			return;
		}

		galleryThumbTouchStartX = event.originalEvent.touches[0].clientX;
		galleryThumbTouchStartY = event.originalEvent.touches[0].clientY;
	});

	$(document).on('touchend', '.page__content .gallery--grid', function(event) {
		if ( isGalleryLightboxOpen() ) {
			return;
		}

		var touchEndX = event.originalEvent.changedTouches[0].clientX;
		var touchEndY = event.originalEvent.changedTouches[0].clientY;
		var deltaX = touchEndX - galleryThumbTouchStartX;
		var deltaY = touchEndY - galleryThumbTouchStartY;

		if ( Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50 ) {
			return;
		}

		if ( Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0 ) {
			navigateToNextProjectFromThumbnails();
		}
		else if ( Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0 ) {
			navigateToPreviousProjectFromThumbnails();
		}
		else if ( Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) ) {
			if ( deltaX < 0 ) {
				navigateUpHierarchy();
			}
			else {
				openFirstGalleryLightboxFromThumbnails();
			}
		}
	});

	$(document).on('touchstart', '.page__content', function(event) {
		if ( isGalleryLightboxOpen() || isProjectGalleryPage() || !isMainNavigationContext() ) {
			return;
		}

		portfolioTouchStartX = event.originalEvent.touches[0].clientX;
		portfolioTouchStartY = event.originalEvent.touches[0].clientY;
	});

	$(document).on('touchend', '.page__content', function(event) {
		if ( isGalleryLightboxOpen() || isProjectGalleryPage() || !isMainNavigationContext() ) {
			return;
		}

		var touchEndX = event.originalEvent.changedTouches[0].clientX;
		var touchEndY = event.originalEvent.changedTouches[0].clientY;
		var deltaX = touchEndX - portfolioTouchStartX;
		var deltaY = touchEndY - portfolioTouchStartY;

		if ( Math.abs(deltaX) < 50 && Math.abs(deltaY) < 50 ) {
			return;
		}

		if ( Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0 ) {
			navigateMainPage(1);
		}
		else if ( Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0 ) {
			navigateMainPage(-1);
		}
		else if ( Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0 ) {
			navigateUpHierarchy();
		}
		else if ( Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0 ) {
			navigateDownHierarchy();
		}
	});

	// State change event
	History.Adapter.bind(window,'statechange',function(){
		var state = History.getState();
		// console.log(state);

		fadeCoverBackgroundOnLeave();

		// Loading state
		$('body').addClass('loading');

		// Load the page
		$('.page-loader').load( state.hash + ' .page__content', function() {

			// Scroll to top
			$( 'body, html' ).scrollTop(0);

			// Find transition time
			var transitionTime = 400;

			// After current content fades out
			setTimeout( function() {

				// Remove old content
				$('.page .page__content').remove();

				// Append new content
				$('.page-loader .page__content').appendTo('.page');

				// Set page URL
				$('body').attr('data-page-url', window.location.pathname);

				// Update navTarget
				navTarget = $('body').attr('data-page-url');

				// Set page title
				docTitle = $('.page__content').attr('data-page-title');
				document.title = docTitle;

				// Run page functions
				pageFunctions();

			}, transitionTime);

		});

	});


	// On clicking a link

	if ( $('body').hasClass('ajax-loading') ) {

		$(document).on('click', 'a', function (event){

			// Don't follow link
			event.preventDefault();

			// Get the link target
			var thisTarget = $(this).attr('href');

			// If we don't want to use ajax, or the link is an anchor/mailto/tel
			if ($(this).hasClass('js-no-ajax') || thisTarget.indexOf('#') >= 0 || thisTarget.indexOf('mailto:') >= 0 || thisTarget.indexOf('tel:') >= 0) {

				// Use the given link
				window.location = thisTarget;
			}

			// If link is handled by some JS action – e.g. gallery lightbox
			else if ( $(this).is('.gallery__item__link') ) {
				
				// Let JS handle it
			}

			// If link is external
			else if ( thisTarget.indexOf('http') >= 0 ) {

				// Go to the external link
				window.open(thisTarget, '_blank');

			}

			// If link is internal
			else {

				// Change navTarget
				navTarget = thisTarget;
				
				// Switch the URL via History
				History.pushState(null, docTitle, thisTarget);
			}

		});

	}



	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Page load

	function pageFunctions() {
		var $cover = $('.page__content .cover');

		if ( $cover.length ) {
			$('body').addClass('is-cover-page');
			$('.page').addClass('page--cover');

			randomizeCoverImage(function(success, coverImage) {
				if ( !success || !coverImage ) {
					revealPageContent();
					return;
				}

				$(coverImage).imagesLoaded(function() {
					updateCoverBackground();
					revealPageContent();
				});
			});
		}
		else {
			$('.page').removeClass('page--cover');

			$('.page__content').find('img:first').imagesLoaded(function() {
				revealPageContent();
			});
		}

		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Active links

		// Switch active link states
		updateActiveLinks();

		// Show project list only on Projects pages
		if ( navTarget === '/projects/' || navTarget === '/projects' || navTarget.indexOf('/project/') === 0 ) {
			$('.projects-menu').addClass('projects-menu--visible');
		}
		else {
			$('.projects-menu').removeClass('projects-menu--visible');
		}

		if ( !$cover.length ) {
			updateCoverBackground();
		}



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Galleries

		// Destroy all existing waypoints
		Waypoint.destroyAll();

		// Set up count for galleries to give them unique IDs
		var galleryCount = 0;

		// If there's a gallery
		$('.gallery').each( function() {

			// Get gallery element
			var $this = $(this);

			// Add ID via count
			galleryCount++;
			var thisId = 'gallery-' + galleryCount;
			$this.attr('id', thisId);

			// Gallery columns
			var galleryCols = $this.attr('data-columns');

			// Set up gallery container
			$this.append('<div class="gallery__wrap"></div>');

			// Add images to container
			$this.children('img').each( function() {
				$(this).appendTo('#' + thisId + ' .gallery__wrap');
			});

			// Wrap images
			$this.find('.gallery__wrap img').each( function() {
				var imageSrc = $(this).attr('src');
				$(this).wrapAll('<div class="gallery__item"><a href="' + imageSrc + '" class="gallery__item__link"></div></div>').appendTo();
			});

			// Wait for images to load
			$this.imagesLoaded( function() {

				// If it's a single column gallery
				if ( galleryCols === '1' ) {

					// Add carousel class to gallery
					$this.addClass('gallery--carousel');

					// Add owl styles to gallery wrap
					$this.children('.gallery__wrap').addClass('owl-carousel');

					// Use carousel
					$this.children('.gallery__wrap').owlCarousel({
						items: 1,
						loop: true,
						mouseDrag: false,
						touchDrag: true,
						pullDrag: false,
						dots: true,
						autoplay: false,
						autoplayTimeout: 6000,
						autoHeight: true,
						animateOut: 'fadeOut'
					});

					// When scrolling over the bottom
					var waypoint1 = new Waypoint({
						element: document.getElementById(thisId),
						handler: function(direction) {

							if ( direction === 'down') {

								// console.log('pause');
							
								// Pause this carousel
								$this.children('.gallery__wrap').trigger('stop.owl.autoplay');
							}

							if ( direction === 'up') {

								// console.log('play');
								
								// Play this carousel
								$this.children('.gallery__wrap').trigger('play.owl.autoplay');
							}
						},
						offset: '-100%'
					});

					// When scrolling over the top
					var waypoint2 = new Waypoint({
						element: document.getElementById(thisId),
						handler: function(direction) {

							if ( direction === 'down') {

								// console.log('play');
								
								// Play this carousel
								$this.children('.gallery__wrap').trigger('play.owl.autoplay');
							}

							if ( direction === 'up') {

								// console.log('pause');
							
								// Pause this carousel
								$this.children('.gallery__wrap').trigger('stop.owl.autoplay');
							}
						},
						offset: '100%'
					});

				}

				else {

					$this.addClass('gallery--grid');

					// Use masonry layout
					$this.children('.gallery__wrap').masonry({
						itemSelector: '.gallery__item',
						transitionDuration: 0
					});

					openFirstGalleryLightboxOnPage();
				}

				// Show gallery once initialized
				$this.addClass('gallery--on');
			});

		});

		if ( galleryLightboxOpenOnLoad && !$('.page__content .gallery--grid').length ) {
			galleryLightboxOpenOnLoad = false;
		}



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Images

		$('.single p > img').each( function() {
			var thisP = $(this).parent('p');
			$(this).insertAfter(thisP);
			$(this).wrapAll('<div class="image-wrap"></div>');
			thisP.remove();
		});



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Videos

		// For each iframe
		$('.single iframe').each( function() {

			// If it's YouTube or Vimeo
			if ( $(this).attr('src').indexOf('youtube') >= 0 || $(this).attr('src').indexOf('vimeo') >= 0 ) {

				var width = $(this).attr('width');
				var height = $(this).attr('height');
				var ratio = (height/width)*100;

				// Wrap in video container
				$(this).wrapAll('<div class="video-wrap"><div class="video" style="padding-bottom:' + ratio + '%;"></div></div>');

			}

		});



		// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Tables

		$('.single table').each(function () {
			$(this).wrapAll('<div class="table-wrap"></div>');
		});

	}

	// Run functions on load
	pageFunctions();


	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Menu

	$(document).on('click', '.js-menu-toggle', function (){

		// If already open
		if ( $('body').hasClass('menu--open') ) {
			$('body').removeClass('menu--open');
		}

		// If not open
		else {
			$('body').addClass('menu--open');
		}
	});

	$(document).on('click', '.menu__list__item__link', function (){

		// If menu is open when you click a link on mobile
		if ( $('.menu').hasClass('menu--open') ) {
			$('.menu').removeClass('menu--open');
		}
	});



	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - Contact Form

	// Override the submit event
	$(document).on('submit', '#contact-form', function (e) {

		// Clear previous classes
		$('.contact-form__item--error').removeClass('contact-form__item--error');

		// Get form elements
		var emailField = $('.contact-form__input[name="email"]');
		var nameField = $('.contact-form__input[name="name"]');
		var messageField = $('.contact-form__textarea[name="message"]');
		var gotchaField = $('.contact-form__gotcha');

		// Validate email
		if ( emailField.val() === '' ) {
			emailField.closest('.contact-form__item').addClass('contact-form__item--error');
		}

		// Validate name
		if ( nameField.val() === '' ) {
			nameField.closest('.contact-form__item').addClass('contact-form__item--error');
		}

		// Validate message
		if ( messageField.val() === '' ) {
			messageField.closest('.contact-form__item').addClass('contact-form__item--error');
		}

		// If all fields are filled, except gotcha
		if ( emailField.val() !== '' && nameField.val() !== '' && messageField.val() !== '' && gotchaField.val().length === 0 ) {

			// Submit the form!
		}

		else {

			// Stop submission
			e.preventDefault();
		}

	});	
	
	
	
}(jQuery));