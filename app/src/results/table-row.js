'use strict';
// TODO this duplicates a lot of the vsCard directive, create a base class
angular.module('voyager.results')
    .directive('vsTableRow', function (inView, $document, sugar, actionManager, config, $location, tagService) {

        return {
            link: function($scope, $element) {

                function _isInView() {
                    var visible = $element.is(':visible'), isIn = false, clientHeight, imageRect;
                    if (visible) {
                        clientHeight = $document[0].documentElement.clientHeight;
                        imageRect = $element.children()[0].getBoundingClientRect();
                        //entire image in view, or bottom part, or top part
                        isIn = (imageRect.top >= 0 && imageRect.bottom <= clientHeight) || (imageRect.bottom >= 0 && imageRect.bottom <= clientHeight) || (imageRect.top >= 0 && imageRect.top <= clientHeight);
                    }

                    if(isIn) {
                        inView.add($scope.doc);
                    } else {
                        inView.remove($scope.doc);
                    }
                }

                if (angular.isDefined($scope.doc.geo)) {  //we don't care if there isn't a bbox to draw
                    inView.addCheckObserver(_isInView);
                }
            },
            controller: function ($scope, filterService, translateService, $timeout, $location, $analytics, authService, cartService) {

                $scope.link = sugar.copy(config.docLink);  //copy so we don't change config
                actionManager.setAction($scope.link, $scope);
                $scope.toggleCart = function(doc) {
                    var action = _.find($scope.actions,{action:'add'});
                    if(doc.inCart) {
                        cartService.remove(doc.id);
                        $scope.cartAction = 'Add';
                        $scope.btnType = 'btn-primary';
                        doc.inCart = false;
                        $analytics.eventTrack('removeFromList', {
                            category: 'results', label: 'card'  // jshint ignore:line
                        });
                        action.display = action.text;
                    } else {
                        cartService.addItem(doc);
                        $scope.cartAction = 'Remove';
                        $scope.btnType = 'btn-default';
                        doc.inCart = true;
                        $analytics.eventTrack('addToList', {
                            category: 'results', label: 'card'  // jshint ignore:line
                        });
                        action.onList = action.display;
                        action.display = action.offList;
                    }
                };

                $scope.applyTag = function(tag) {
                    tagService.applyTag(tag, $scope, filterService);
                };

                $scope.hover = function(active) {
                    $scope.$emit('resultHoverEvent', {
                        doc: active ? $scope.doc : null
                    });
                };

                var actions = actionManager.initActions($scope, 'table');
                $scope.actions = actions.display;
                $scope.default = actions.defaultAction;

                $scope.$on('addAllToCart', function () {
                    $scope.cartAction = 'Remove';
                    $scope.btnType = 'btn-default';
                    $scope.doc.inCart = true;
                    actionManager.toggleDisplay(actions.types.add, $scope);
                });

                $scope.$on('removeAllCart', function () {
                    $scope.cartAction = 'Add';
                    $scope.btnType = 'btn-primary';
                    $scope.doc.inCart = false;
                    actionManager.toggleDisplay(actions.types.add, $scope);
                });

                $scope.$on('syncCard', function () {
                    if($scope.doc.inCart) {
                        $scope.cartAction = 'Remove';
                        $scope.btnType = 'btn-default';
                    } else {
                        $scope.cartAction = 'Add';
                        $scope.btnType = 'btn-primary';
                    }
                    $scope.isTable = true;
                    actionManager.toggleDisplay(actions.types.add, $scope);
                });

            }
        };
    });