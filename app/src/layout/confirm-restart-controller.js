'use strict';

angular.module('voyager.layout')
    .controller('ConfirmRestartCtrl', function ($scope, $uibModalInstance, systemService) {

        var vm = this;
        var RESTART_STATUS = {
            'NOTSTARTED': 'notStarted',
            'INPROCESSES': 'inProcess',
            'COMPLETE': 'complete',
            'FAILED': 'failed'
        };

        vm.modalText = [
            'This will restart Voyager.',
            'Are you sure you want to continue?'
        ];
        vm.confirmButtonText = 'Confirm';
        vm.cancelLinkText = 'Cancel';
        vm.currentStatus = RESTART_STATUS.NOTSTARTED;
        vm.statusMessage = '';

        function _restart() {
            systemService.doRestart().then(function(resp) {
                systemService.checkForLife(_setRestartSuccessful, 2500);
            }, function(resp) {
                console.log("ERROR OCCURRED WHILE RESTARTING");
                console.log(resp);
                _setRestartFailed();
            }).catch(function(resp) {
                console.log("ERROR CAUGHT WHILE RESTARTING");
                console.log(resp);
                _setRestartFailed();
            });
        };

        function _setRestartSuccessful() {
            vm.currentStatus = RESTART_STATUS.COMPLETE;
            vm.statusMessage = 'Voyager Restart has Completed Successfully';
            vm.confirmButtonText = 'Restart Again';
            vm.cancelLinkText = 'Dismiss';
        }

        function _setRestartFailed() {
            vm.currentStatus = RESTART_STATUS.FAILED;
            vm.statusMessage = 'Voyager Restart has Failed';
            vm.confirmButtonText = 'Retry';
            vm.cancelLinkText = 'Dismiss';
        }

        vm.confirm = function() {
            vm.statusMessage = 'Warning: The Server is Restarting';
            vm.currentStatus = RESTART_STATUS.INPROCESSES;
            _restart();
        };

        vm.cancel = function () {
            $uibModalInstance.dismiss(vm.cancelLinkText);
        };

        vm.notStarted = function () {
            return (vm.currentStatus === RESTART_STATUS.NOTSTARTED);
        };

        vm.isWaiting = function () {
            return (vm.currentStatus === RESTART_STATUS.INPROCESSES);
        };

        vm.hasCompleted = function () {
            return (vm.currentStatus === RESTART_STATUS.COMPLETE);
        };

        vm.hasError = function () {
            return (vm.currentStatus === RESTART_STATUS.FAILED);
        };
    });