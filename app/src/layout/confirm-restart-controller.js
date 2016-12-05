'use strict';

angular.module('voyager.layout')
    .controller('ConfirmRestartCtrl', function ($scope, $uibModalInstance) {

        var vm = this;

        vm.confirm = function() {
            $uibModalInstance.close('confirm');
        };

        vm.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        vm.hasError = function() {
            return false;
        };

    });