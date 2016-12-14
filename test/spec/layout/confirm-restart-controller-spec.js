'use strict';

describe('Controller: ConfirmRestartCtrl', function () {

    var $scope, $controller, $uibModalInstance, $http, $timeout, authService, systemService, sut;
    var cfg = _.clone(config);

    beforeEach(function () {
        module('voyager.layout');
        module('ui.bootstrap');
        module('voyager.config');
        module('voyager.security');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });

        inject(function (_$controller_, $rootScope, $httpBackend, _$timeout_, _authService_, _systemService_) {
            $scope = $rootScope.$new();
            $http = $httpBackend;
            $timeout = _$timeout_;
            $uibModalInstance = {
                close: function() {},
                dismiss: function() {}
            };
            $controller = _$controller_;
            authService = _authService_;
            systemService = _systemService_;
        });
    });

    // Specs here

    function initController() {
        sut = $controller('ConfirmRestartCtrl', {$scope: $scope, $uibModalInstance: $uibModalInstance, systemService: systemService});
    }

    it('should instantiate', function () {
        initController();
        expect(sut).not.toBeUndefined();
    });

    it('should restart on confirm and poll server', function () {
        initController();

        expect(sut.showMessage).toBe(false);
        expect(sut.isWaiting).toBe(false);
        expect(sut.hasCompleted).toBe(false);
        expect(sut.hasError).toBe(false);

        sut.confirm();
        $http.expectPOST(new RegExp('restart')).respond(200, {});
        $http.flush(1);

        expect(sut.showMessage).toBe(true);
        expect(sut.isWaiting).toBe(true);
        expect(sut.hasCompleted).toBe(false);
        expect(sut.hasError).toBe(false);

        $http.expectGET(new RegExp('auth\/info')).respond(500, {});
        $timeout.flush();
        $http.flush(1);

        expect(sut.showMessage).toBe(true);
        expect(sut.isWaiting).toBe(true);
        expect(sut.hasCompleted).toBe(false);
        expect(sut.hasError).toBe(false);

        $http.expectGET(new RegExp('auth\/info')).respond(200, {});
        $timeout.flush();
        $http.flush(1);

        expect(sut.showMessage).toBe(true);
        expect(sut.isWaiting).toBe(true);
        expect(sut.hasCompleted).toBe(false);
        expect(sut.hasError).toBe(false);

        $http.expectGET(new RegExp('auth\/info')).respond(200, {permissions: {manage:true}, user: {groups:[]}});
        $timeout.flush();
        $http.flush(1);

        expect(sut.showMessage).toBe(true);
        expect(sut.isWaiting).toBe(false);
        expect(sut.hasCompleted).toBe(true);
        expect(sut.hasError).toBe(false);
    });

    it('should notify user of error on restart', function () {
        initController();

        expect(sut.showMessage).toBe(false);
        expect(sut.isWaiting).toBe(false);
        expect(sut.hasCompleted).toBe(false);
        expect(sut.hasError).toBe(false);

        sut.confirm();
        $http.expectPOST(new RegExp('restart')).respond(500, {});
        $http.flush();

        expect(sut.showMessage).toBe(true);
        expect(sut.isWaiting).toBe(false);
        expect(sut.hasCompleted).toBe(false);
        expect(sut.hasError).toBe(true);
    });

    it('should cancel', function () {
        initController();
        spyOn($uibModalInstance, 'dismiss');
        sut.cancel();
        expect($uibModalInstance.dismiss).toHaveBeenCalledWith('Cancel');
    });
});