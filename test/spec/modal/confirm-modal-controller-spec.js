'use strict';

describe('Controller: ConfirmModalCtrl', function () {

    var $scope, $controller, $uibModalInstance, sut;
    var cfg = _.clone(config);

    beforeEach(function () {
        module('voyager.modal');
        module('ui.bootstrap');
        module('voyager.config');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });

        inject(function (_$controller_, $rootScope) {
            $scope = $rootScope.$new();
            $uibModalInstance = {
                close: function() {},
                dismiss: function() {}
            };
            $controller = _$controller_;
        });
    });

    // Specs here

    function initController() {
        sut = $controller('ConfirmModalCtrl', {$scope: $scope, $uibModalInstance: $uibModalInstance});
    }

    it('should instantiate', function () {
        initController();
        expect(sut).not.toBeUndefined();
    });

    it('should confirm', function () {
        initController();
        spyOn($uibModalInstance, 'close');
        sut.confirm();
        expect($uibModalInstance.close).toHaveBeenCalledWith('Confirm');
    });

    it('should cancel', function () {
        initController();
        spyOn($uibModalInstance, 'dismiss');
        sut.cancel();
        expect($uibModalInstance.dismiss).toHaveBeenCalledWith('Cancel');
    });
});