/*global angular */

angular.module('voyager.component')
  .directive('vsTableResults', function($window, $timeout, $document, tableResultsService) {
    'use strict';

    return {
      restrict: 'A',
      link: function(scope, element, attr) {

        scope.windowEl = angular.element($window);
        scope.windowWidth = scope.windowEl.width();
        scope.windowHeight = scope.windowEl.height();

        var searchResultMapContainerEl = angular.element('#searchResultMapContainer');
        var listWrapEl = angular.element('.list_wrap');


        scope.getAvailableHeight = function(size, availableHeight) {
          if (size === 'small') {
            return scope.minHeight(availableHeight - 600);
          } else if (size === 'large') {
            return scope.minHeight(availableHeight - 280);
          }

          return 0;
        };

        scope.minHeight = function(availableHeight) {
          if (availableHeight < 250) {
            availableHeight = 250;
          }

          return availableHeight;
        };

        scope.animate = function(el, animateParams, callback) {
          el.stop().css('visibility', 'visible').animate(animateParams, 250, 'linear', function(){
            if (callback) {
              callback();
            }
          });
        };

        scope.hideElement = function(el){
          el.css('visibility', 'hidden');
        };

        scope.resizeContent = function() {
          $timeout(function() {
            if (scope.windowWidth < 768) {
              searchResultMapContainerEl.css({visibility: 'hidden', height: 0});
              listWrapEl.css('margin-top', scope.windowWidth < 640 ? '155px' : '110px');
              return;
            }

            var mapTopPosition = angular.element('.search-map').offset().top;
            var availableHeight = scope.windowHeight - mapTopPosition;

            if (attr.size === 'small') {
              availableHeight = scope.getAvailableHeight('small', availableHeight);
              scope.animate(searchResultMapContainerEl, {height: availableHeight});
            }
            else if (attr.size === 'no') {
              availableHeight = 0;
              scope.animate(searchResultMapContainerEl, 0, function () {
                scope.hideElement(searchResultMapContainerEl);
              });
            } else {
              availableHeight = scope.getAvailableHeight('large', availableHeight);
            }

            scope.animate(searchResultMapContainerEl, {height: availableHeight});

            scope.animate(listWrapEl, {marginTop: (availableHeight - 20)});

            tableResultsService.setFixedWidths();
          }, 100);
        };

        scope.resize = function() {
          if (scope.windowWidth !== scope.windowEl.width() || scope.windowHeight !== scope.windowEl.height()) {
            scope.windowWidth = scope.windowEl.width();
            scope.windowHeight = scope.windowEl.height();
            scope.resizeContent();
          }
        };


        $document.ready(function(){

          scope.resizeContent();

          scope.windowEl.on('resize', scope.resize);

          scope.$watch('tableViewMapSize', scope.resizeContent);
        });

        scope.$on('$destroy', function(){
          scope.windowEl.unbind('resize', scope.resize);
        });

      } //link
    };
  });

