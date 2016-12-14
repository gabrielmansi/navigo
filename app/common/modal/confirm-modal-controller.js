'use strict';

//this is a generic controller for the generic confirm modal that returns to the initializing function
//on a selection by the user.  This controller can be used as a template for more complex functionality
//including in-modal feedback and reporting.

angular.module('voyager.modal')
    .controller('ConfirmModalCtrl', function ($scope, $uibModalInstance) {

        var vm = this;

        vm.modalHeader = 'Please Confirm';
        vm.modalText = [];
        vm.confirmButtonText = 'Confirm';
        vm.cancelLinkText = 'Cancel';

        vm.confirm = function() {
            $uibModalInstance.close(vm.confirmButtonText);
        };

        vm.cancel = function () {
            $uibModalInstance.dismiss(vm.cancelLinkText);
        };
    });