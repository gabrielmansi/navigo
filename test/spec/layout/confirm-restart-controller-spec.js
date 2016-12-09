'use strict';

describe('Controller: ConfirmRestartCtrl', function () {

    var $scope, $controller, $uibModalInstance, sut;
    var cfg = _.clone(config);

    beforeEach(function () {
        module('voyager.layout');
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
        sut = $controller('ConfirmRestartCtrl', {$scope: $scope, $uibModalInstance: $uibModalInstance});
    }

    it('should instantiate', function () {
        initController();
        expect(sut).not.toBeUndefined();
    });

    it('should confirm', function () {
        initController();
        spyOn($uibModalInstance, 'close');
        sut.confirm();
        expect($uibModalInstance.close).toHaveBeenCalledWith('confirm');
    });

    it('should cancel', function () {
        initController();
        spyOn($uibModalInstance, 'dismiss');
        sut.cancel();
        expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });
});