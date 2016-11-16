describe('Details Map Directive:', function () {
    'use strict';

    var cfg = _.clone(config);

    beforeEach(function () {
        module('templates');
        // module('voyager.common'); //auth service module - apparently this is needed to mock the auth service
        module('voyager.details');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });
    });

    var scope, $timeout, httpMock, compile, leafletData, $q, element, compiled, controller;

    function initDirective() {
        element = angular.element('<div vs-details-map></div>');
        compiled = compile(element)(scope);
        element.scope().$apply();
        controller = element.controller(scope);
    }

    beforeEach(inject(function ($compile, $rootScope, _$timeout_, $httpBackend, _leafletData_, _$q_) {
        scope = $rootScope.$new();
        $timeout = _$timeout_;
        httpMock = $httpBackend;
        compile = $compile;
        leafletData = _leafletData_;
        $q = _$q_;
    }));


    describe('Render', function () {

        it('should render leaflet map', function () {

            var geo = {'type': 'Polygon',
                'coordinates': [
                [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
            ]
            };

            scope.doc = {id:'id', geo:geo};
            initDirective();

            $timeout.flush();

            expect(element.html()).toContain('leaflet');
        });

    });

});