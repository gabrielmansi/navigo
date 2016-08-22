/*global angular */

angular.module('voyager.component')
	.directive('vsDetailScroll', function($window, $document, $timeout) {
		'use strict';

		return {
			restrict: 'A',
			link: function(scope, element) {

				var windowEl;
				var detailTopStickyContent;
				var detailTabContentNav;
				var detailTabContentNavClone;
				var detailTabContentNavTipPoint;
				var detailTabContentNavHeight;
				var detailSecondaryColumn;
				var itemDetailEl;
				var $banner;

				function bannerAdjust() {
					$banner = angular.element('#top-banner');
					if($banner.outerHeight() > 0) {
						$timeout(function() {
							var paddingTop = detailTopStickyContent.css('padding-top');
							paddingTop = parseInt(paddingTop.replace('px',''));
							detailTopStickyContent.css('padding-top', $banner.outerHeight() + paddingTop);
							detailSecondaryColumn.css('padding-top', $banner.outerHeight() + paddingTop);
							scope.resize();
						});
					}
				}

				scope.initialize = function() {
					element.ready(function(){
						$timeout(function() {
							detailTopStickyContent = angular.element('#detailTopStickyContent');
							detailTabContentNav = angular.element('#detailTabContentNav');
							detailSecondaryColumn = angular.element('#detailSecondaryColumn');

							bannerAdjust();

							detailTabContentNavHeight = detailTabContentNav.outerHeight();
							itemDetailEl = angular.element('#itemDetailContent');

							windowEl.on('scroll', _scroll);
							windowEl.on('resize', scope.resize);

							scope.$on('$destroy', function(){
								scope.destroy();
							});
						}, 350);
					});
				};

				windowEl = angular.element($window);
				scope.$watch('loading', function(){
					if (scope.loading === false) {
						scope.initialize();
					}
				});

				scope.$watch('showTab', function(){
					if (angular.isDefined(scope.showTab)) {
						$document.scrollTop(detailTabContentNavTipPoint);
					}
				});

				scope.resize = function() {
					$timeout.cancel(scope.resizeTimer);
					scope.resizeTimer = $timeout(function(){
						//scope.setStickyContent();
					}, 100);
				};

				scope.destroy = function() {
					windowEl.unbind('scroll', _scroll);
					windowEl.unbind('resize', scope.resize);
				};

				function _scroll() {

					var scrollTop = $document.scrollTop();
					console.log("SCROLLTOP: ", scrollTop);
					var scrollY = $window.pageYOffset;
					console.log("SCROLLY: ", scrollY);

					var $nameHeader = angular.element('h1[name=doc-header]');
					var $floatingNav = angular.element('.floating-nav');

					var floatingNavBottom = $floatingNav.offset().top + $floatingNav.height() + 30;
					var nameHeaderBottom = $nameHeader.offset().top + $nameHeader.height();
					console.log("NAME HEADER BOTTOM", nameHeaderBottom);
					var $floatingHeader = angular.element('.floating-header > h1');

					// show/hide the doc title in the toolbar if its hidden in the summary
					if(floatingNavBottom < nameHeaderBottom) {
						$floatingHeader.hide();
					} else {
						$floatingHeader.show();
					}

					// fix the tabs to remain visible if scrolled below
					if((detailTabContentNav.offset().top < floatingNavBottom) && (!detailTabContentNavClone)) {
						var fixedTop = floatingNavBottom - scrollTop;
						detailTabContentNavClone = detailTabContentNav.clone().prop('id', detailTabContentNav.prop('id') + '-clone');
						detailTabContentNavClone = detailTabContentNavClone.insertBefore(detailTabContentNav);
						detailTabContentNav.addClass('fixed');
					}

					// remove the fixed tabs if scrolled back up
					var $divider = angular.element('hr[name=divider]');
					if(($divider.offset().top > detailTabContentNav.offset().top) && (detailTabContentNavClone)) {
						detailTabContentNavClone.remove();
						detailTabContentNavClone = null;
						detailTabContentNav.removeClass('fixed');
					}
				}

			}
		};
	});

