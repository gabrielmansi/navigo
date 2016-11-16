describe('Param Directive:', function () {
    'use strict';

    beforeEach(function () {
        module('templates');
        // module('voyager.common'); //auth service module - apparently this is needed to mock the auth service
        module('taskRunner');
        module('leaflet-directive');
        module('LocalStorageModule');
        module('ui.bootstrap');
        module(function ($provide) {
            $provide.constant('config', config);
        });
    });

    var scope, element, compiled, timeout, httpMock, $window, $document, $compile, $rootScope, controller;

    beforeEach(inject(function (_$compile_, _$rootScope_, $timeout, $httpBackend, _$window_, _$document_) {
        $rootScope = _$rootScope_;
        scope = $rootScope.$new();
        $compile = _$compile_;
        timeout = $timeout;
        httpMock = $httpBackend;
        $window = _$window_;
        $document = _$document_;
    }));

    function applyDirective() {

        httpMock.expectGET(new RegExp('projections')).respond({'name/term':'term'}); // proj call

        element = angular.element('<vs-param param="p"></vs-param>');
        compiled = $compile(element)(scope);

        $(document.body).append(element);
        element.scope().$apply();

        controller = element.controller(scope);

        httpMock.flush();
    }

    describe('Functions', function() {
        it('should render projection param and query', function () {

            scope.p ={type:'Projection', hasMap:true};  //passed in as p param

            applyDirective();

            timeout.flush();

            var isolatedScope = element.isolateScope();

            isolatedScope.open(1);

            isolatedScope.select2Options.query({term:'ter', callback: function() {}});

        });

        it('should open', function () {
            scope.p ={type:'Projection', hasMap:true};  //passed in as p param

            applyDirective();

            timeout.flush();

            var isolatedScope = element.isolateScope();

            isolatedScope.open(1);
        });

        it('should search', function () {
            scope.p ={type:'Projection', hasMap:true};  //passed in as p param

            applyDirective();

            timeout.flush();

            var isolatedScope = element.isolateScope();

            isolatedScope.search(1);
        });
    });


});