'use strict';

angular.module('voyager.layout')
    .controller('ConfirmRestartCtrl', function ($scope, $uibModalInstance, systemService) {

        var vm = this;

        vm.modalHeader = 'Confirm Restart';
        vm.modalText = [
            'This will restart Voyager.',
            'Are you sure you want to continue?'
        ];
        vm.confirmButtonText = 'Confirm';
        vm.cancelLinkText = 'Cancel';
        vm.statusMessage = '';

        vm.showMessage = false;
        vm.isWaiting = false;
        vm.hasCompleted = false;
        vm.hasError = false;

        function _setStatus_WAITING() {
            vm.showMessage = true;
            vm.isWaiting = true;
            vm.hasCompleted = false;
            vm.hasError = false;
        }

        function _setStatus_COMPLETED() {
            vm.showMessage = true;
            vm.isWaiting = false;
            vm.hasCompleted = true;
            vm.hasError = false;
        }

        function _setStatus_FAILED() {
            vm.showMessage = true;
            vm.isWaiting = false;
            vm.hasCompleted = false;
            vm.hasError = true;
        }

        function _restart() {
            systemService.doRestart().then(function() {
                systemService.checkForLife(_setRestartSuccessful, 2500, 10000);
            }, function() {
                _setRestartFailed();
            }).catch(function() {
                _setRestartFailed();
            });
        }

        function _setRestartSuccessful() {
            _setStatus_COMPLETED();
            vm.statusMessage = 'Voyager Restart has Completed Successfully';
            vm.confirmButtonText = 'Restart';
            vm.cancelLinkText = 'Dismiss';
        }

        function _setRestartFailed() {
            _setStatus_FAILED();
            vm.statusMessage = 'Voyager Restart has Failed';
            vm.confirmButtonText = 'Retry';
            vm.cancelLinkText = 'Dismiss';
        }

        vm.confirm = function() {
            vm.statusMessage = 'Warning: The Server is Restarting';
            _setStatus_WAITING();
            _restart();
        };

        vm.cancel = function () {
            $uibModalInstance.dismiss(vm.cancelLinkText);
        };
    });