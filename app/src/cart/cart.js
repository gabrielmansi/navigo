'use strict';

angular.module('cart')
    .controller('CartCtrl', function ($scope, cartService, searchService, $location, config, $log) {

        $scope.hasError = false;
        $scope.loading = true;
        $scope.cartName = config.ui.list.name.toLowerCase();

        $scope.disp = $location.search().disp || 'default';

        $scope.uiText = config.ui.list;

        var _removeValue = function (array, id) {
            return _.reject(array, function (item) {
                return item.id === id;
            });
        };

        function _updateCartCount(length, items, action) {
            if(action === 'clear') {
                $scope.cartItems = [];
                $scope.cartItemCount = 0;
            }
        }

        cartService.addObserver(_updateCartCount);

        var init = function () {
            $scope.displayCategory = cartService.getCount() > 100;

            cartService.fetch().then(function(data) {
                cartService.setQueryCount(data.count);
                $scope.cartItemCount = data.count;
                $scope.cartItems = data.docs;
                $scope.loading = false;
            }, function(error) {
                $log.error(error);
            });

        };

        init();

        $scope.removeItem = function (id) {
            cartService.remove(id);
            $scope.cartItems = _removeValue($scope.cartItems, id);
            $scope.cartItemCount = cartService.getCount();
        };

        $scope.removeItemByFormat = function(item) {
            cartService.removeByFormat(item.key);
            init();
        };

        $scope.hasItems = function () {
            return cartService.getCount() > 0;
        };

        $scope.clearQueue = function() {
            cartService.clear();
        };

        $scope.$on('$destroy', function() {
            cartService.removeObserver(_updateCartCount);
        });
    });
