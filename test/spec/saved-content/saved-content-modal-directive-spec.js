describe('Saved Content Modal Directive:', function () {
    'use strict';

    beforeEach(function () {
        module('templates');
        module('voyager.search');
        module(function ($provide) {
            $provide.constant('config', config);
        });
    });

    var scope, element, compiled, timeout, httpMock, $window, $document, $compile, $rootScope, $uibModal, authService;

    var response = new ResponseMocks().mockSavedSearchesResponse;

    beforeEach(inject(function (_$compile_, _$rootScope_, $timeout, $httpBackend, _$window_, _$document_, _$uibModal_, _authService_) {
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $compile = _$compile_;
        timeout = $timeout;
        httpMock = $httpBackend;
        $window = _$window_;
        $document = _$document_;
        $uibModal = _$uibModal_;
        authService = _authService_;
    }));

    afterEach(function() {
        httpMock.verifyNoOutstandingExpectation();
        httpMock.verifyNoOutstandingRequest();
    });

    function applyDirective() {
        element = angular.element('<saved-content />');
        compiled = $compile(element)(scope);
        $(document.body).append(element);
        element.scope().$apply();
    }

    describe('Functions', function() {

        it('should contain request saved searches', function () {
            httpMock.whenJSONP(new RegExp('ssearch\/select')).respond(response);
            httpMock.expectJSONP(new RegExp('ssearch\/select')).respond(response);
            // showModal();
            applyDirective();
            httpMock.flush();
        });

        it('should default to anonymous', function(){
            httpMock.whenJSONP(new RegExp('ssearch\/select')).respond(response);
            applyDirective();
            expect(scope.isAnonymous).toBe(true);
            httpMock.flush();
        });

        it('should show saved searches', function(){
            httpMock.whenJSONP(new RegExp('ssearch\/select')).respond(response);
            applyDirective();
            var evt = scope.$emit('click');
            scope.showCategory(evt, 'search');
            httpMock.flush();
        });

        it('should default to suggested searches when has save_search permission', function(){
            spyOn(authService,'hasPermission').and.returnValue(true);
            httpMock.whenJSONP(new RegExp('ssearch\/select')).respond(response);
            httpMock.expectJSONP(new RegExp('slocation\/select')).respond(response);
            //TODO why is this firing again
            httpMock.expectJSONP(new RegExp('slocation\/select')).respond(response);
            applyDirective();
            var evt = scope.$emit('click');
            scope.showCategory(evt, null);
            httpMock.flush();
        });

        it('should default to suggested tab when has save_search permission', function(){
            spyOn(authService,'hasPermission').and.returnValue(true);
            httpMock.whenJSONP(new RegExp('ssearch\/select')).respond(response);
            // httpMock.whenJSONP(new RegExp('slocation\/select')).respond(response);
            applyDirective();
            scope.showSearch = false;
            var evt = scope.$emit('click');
            expect(scope.showTab).toBe('suggested');
            scope.showCategory(evt, 'search');
            httpMock.flush();
        });

        it('should change tabs when asked', function(){
            spyOn(authService,'hasPermission').and.returnValue(true);
            httpMock.whenJSONP(new RegExp('ssearch\/select')).respond(response);
            httpMock.whenJSONP(new RegExp('slocation\/select')).respond(response);
            applyDirective();
            scope.showSearch = false;
            expect(scope.showTab).toBe('suggested');
            scope.changeTab('othertab');
            expect(scope.showTab).toBe('othertab');
            httpMock.flush();
        });

        // it('should listen for cancel', function(){
        //     httpMock.whenJSONP(new RegExp('ssearch\/select')).respond(response);
        //     applyDirective();
        //     scope.cancel();
        //     httpMock.flush();
        // });

    });
});