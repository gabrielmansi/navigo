'use strict';

describe('Controller: HeaderCtrl', function () {

    var $scope, $timeout, $uibModal, usSpinnerService, $location, $http, $controller, q, authService, systemService, sut, $window, $state;
    var cfg = _.clone(config);

    beforeEach(function () {
        module('templates');
        module('voyager.layout');
        module('voyager.search');
        module('voyager.tagging');
        module('ui.bootstrap');
        module('ui.router');
        module('voyager.config');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });

        inject(function (_$controller_, _$timeout_, _$uibModal_, _usSpinnerService_, _$location_, $httpBackend , $rootScope, _$q_, _authService_, _systemService_, _$window_, _$state_) {
            $scope = $rootScope.$new();
            $timeout = _$timeout_;
            $uibModal = _$uibModal_;
            usSpinnerService = _usSpinnerService_;
            $location = _$location_;
            $http = $httpBackend;
            $controller = _$controller_;
            q = _$q_;
            authService = _authService_;
            systemService = _systemService_;
            $window = {location:{href:''}, open: function() {}};
            $state = _$state_;
        });

        cfg.settings.data.display.showMap = true;
    });

    // Specs here

    function initController() {
        $location.search().disp = 'disp';
        sut = $controller('HeaderCtrl', {$scope: $scope, authService: authService, $window: $window, $uibModal: $uibModal});

        //spyOn($window, 'location');

        //$http.expectGET(new RegExp('auth')).respond({}); // transitive auth call
        //$http.flush();
    }

    it('should init as admin', function () {
        spyOn(authService,'hasPermission').and.returnValue(true);
        spyOn(authService,'addObserver').and.callFake(function(callback) {
            callback();
        });

        $location.path('/home');

        initController();

        expect(sut.canManage).toBeTruthy();
        expect(sut.canCart).toBeTruthy();
        expect(sut.showClassicLink).toBeTruthy();
    });

    it('should init as user', function () {
        spyOn(authService,'hasPermission').and.returnValue(false);

        initController();

        expect(sut.canManage).toBeFalsy();
        expect(sut.canCart).toBeFalsy();
        expect(sut.showClassicLink).toBeFalsy();
    });

    it('should login', function () {

        initController();

        sut.login();

        $http.expectGET(new RegExp('auth')).respond({permissions:{use_voyager:false}});

        $http.flush();
    });

    it('should logout', function () {

        initController();

        spyOn($state,'go');

        sut.logout();

        $http.expectPOST(new RegExp('logout')).respond({permissions:{use_voyager:false}});

        $http.flush();

        expect($state.go).toHaveBeenCalledWith('login');
    });

    it('should show saved search', function () {
        initController();

        sut.showSavedSearch();

        expect(sut.navClass).toEqual('full_width');
    });

    it('should goto page', function () {
        $location.search().disp = 'disp';
        initController();

        sut.gotoPage('junk');

        expect($window.location.href).toEqual('junk?disp=disp');
    });

    it('should clear queue', function () {
        $location.search().disp = 'disp';
        initController();

        sut.navClass = 'full_width';

        sut.clearQueue('junk');

        expect(sut.navClass).toEqual('');
    });

    it('should goto classic details from details', function () {
        $location.search().view = 'card';
        $location.search().id = '12345';
        $location.path('/show');

        initController();

        spyOn($window, 'open');

        sut.goToClassic();

        expect($window.open).toHaveBeenCalledWith('root/voyager/#/id=12345/disp=disp', '_blank');
    });

    it('should goto classic default search from home', function () {
        $location.search().view = 'card';
        $location.path('/home/');

        initController();

        spyOn($window, 'open');

        sut.goToClassic();

        expect($window.open).toHaveBeenCalledWith('root/voyager/#/', '_blank');
    });

    it('should goto classic search from search', function () {
        $location.path('/search/');

        $location.search().q = 'text';

        initController();

        spyOn($window, 'open');

        sut.goToClassic();

        expect($window.open).toHaveBeenCalledWith('root/voyager/#/q=text/disp=disp', '_blank');
    });

    it('should execute a restart on confirm', function () {
        spyOn(authService,'hasPermission').and.returnValue(true);

        var fakeModal = {
            result: {
                then: function (confirmCallback, cancelCallback) {
                    this.confirm_callback = confirmCallback;
                    this.cancel_callback = cancelCallback;
                }
            },
            close: function(response) {
                this.result.confirm_callback(response);
            },
            dismiss: function(response) {
                this.result.cancel_callback(response);
            }
        };

        initController();

        spyOn($uibModal, 'open').and.returnValue(fakeModal);

        sut.restart();

        expect($uibModal.open).toHaveBeenCalled();
    });
});