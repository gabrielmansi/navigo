/*global angular */
angular.module('voyager.security')
    .controller('AuthPageCtrl', function ($scope, $state, $controller) {
        'use strict';

        $controller('AuthBaseCtrl', { $scope: $scope });

        var successCallback = $scope.authSuccess;
        $scope.authSuccess = function() {
            successCallback();
            $state.go('home');
        };

        $scope.authPage = true;

    });
