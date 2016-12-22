/*global angular, $ */

angular.module('voyager.component')
	.directive('vsPopover', function($timeout, $window) {
		'use strict';
		return {
			restrict: 'A',
			link: function(scope, element) {

				element.on('click', 'a', function(event){
                    $timeout.cancel(this.timer);

					var trigger = $(event.currentTarget),
						el = trigger.parents('.hover_flyout');

					if (trigger.hasClass('flyout_trigger')) {
						if (!el.hasClass('opened')) {
							_anchorPopover(event, trigger, el);

							if (el.hasClass('max_height')) {
								el.find('.flyout_inner').css('max-height', (($window.innerHeight - (el.offset().top - $window.pageYOffset) - 80) + 'px'));
							}
							el.addClass('opened').siblings().removeClass('opened');
						} else {
							el.removeClass('opened');
						}
					} else if (!trigger.hasClass('keep_open')) {
						trigger.parents('.hover_flyout').removeClass('opened');
					} else if (trigger.hasClass('subcat_trigger')) {
						trigger.parent().toggleClass('opened');
						// TODO - why is el empty?
						if (el.length > 0) {
							el.find('.flyout_inner').css('max-height', (($window.innerHeight - (el.offset().top - $window.pageYOffset) - 80) + 'px'));
						}
					}
                }).on('mouseleave', '.hover_flyout', function (event) {
                    var trigger = $(event.currentTarget);
                    if (!trigger.hasClass('keep_open')) {
						this.timer = $timeout(function(){
							$(event.currentTarget).removeClass('opened');
						}, 500);
						//TODO openTimer? where is this set?
						//$timeout.cancel(this.openTimer);
                    }
                }).on('mouseenter', '.hover_flyout', function () {
					$timeout.cancel(this.timer); //clear timer if user reenter the area
                });

				//TODO use injected $window and $document
				function _anchorPopover(event, triggerEl, popOverEl) {
					var winHeight = $(window).height(),
						winWidth = $(window).width() > $(document).width() ? $(window).width() : $(document).width(),
						popOverYPos = event.clientY,
						popOverXPos = triggerEl.offset().left,
						popOverContent = popOverEl.find('.flyout'),
						popOverContentHeight = popOverContent.data('height'),
						popOverContentWidth = popOverContent.data('width');

					if (!popOverContentHeight) {
						popOverContentHeight = popOverContent.addClass('offscreen').height() + 30;
						popOverContent.data('height', popOverContentHeight);
						popOverContentWidth = popOverContent.addClass('offscreen').width();
						popOverContent.data('width', popOverContentWidth);
						popOverContent.removeClass('offscreen');
					}

					if (!popOverEl.hasClass('top_only')) {
						if (winHeight - popOverYPos < popOverContentHeight) {
							popOverEl.addClass('bottom');
						} else {
							popOverEl.removeClass('bottom');
						}
					}

					if (popOverXPos + popOverContentWidth > (winWidth-10)) {
						popOverEl.find('.flyout_inner').css('left', (winWidth - popOverXPos - popOverContentWidth - 10) + 'px');
					} else {
						popOverEl.find('.flyout_inner').css('left', 0);
					}
				}

			} //link
		};
	});
