'use strict';

describe('SelectedFilters:', function () {

    var cfg = _.clone(config);

    beforeEach(function () {
        module('voyager.util');
        module('leaflet-directive');
        module('voyager.map');
        module('voyager.security'); //auth service module - apparently this is needed to mock the auth service
        module(function ($provide) {
            $provide.constant('config', cfg);
        });
        module('voyager.filters');
    });

    var httpMock, _configService, scope, controllerService, _filterService, q, $location, $timeout;

    beforeEach(inject(function ($rootScope, configService, $httpBackend, $controller, filterService, $q, treeService, _$location_, _$timeout_) {
        httpMock = $httpBackend;
        _configService = configService;
        scope = $rootScope.$new();
        controllerService = $controller;
        _filterService = filterService;
        q = $q;
        $location = _$location_;
        $timeout = _$timeout_;
    }));

    describe('Functions:', function () {

        it('should load', function () {
            $location.search().fq = 'filter:facet';
            $location.search().q = 'text';
            $location.search().place = '1 1 1 1';
            controllerService('SelectedFiltersCtrl', {$scope: scope});
            scope.$apply();

            expect(scope.filters.length).toBe(3);
        });

        it('should load with OR filters', function () {
            $location.search().fq = 'filter:(facet1 facet2)';
            controllerService('SelectedFiltersCtrl', {$scope: scope});
            scope.$apply();

            expect(scope.filters.length).toBe(1);
            expect(scope.filters[0].parts.length).toBe(2);
            expect(scope.filters[0].isOr).toBeTruthy();
        });

        it('should remove place filter', function () {
            $location.search().place = '1 1 1 1';
            $location.search()['place.op'] = 'within';
            $location.search()['place.id'] = 'id';

            controllerService('SelectedFiltersCtrl', {$scope: scope});
            scope.$apply();

            scope.removeFilter({name:'place', humanized:'place: 1 2 3 4'});

            expect($location.search().place).toBeUndefined();
            expect($location.search()['place.op']).toBeUndefined();
            expect($location.search()['place.id'] ).toBeUndefined();
        });

        it('should remove search filter', function () {
            $location.search().q = 'text';

            controllerService('SelectedFiltersCtrl', {$scope: scope});
            scope.$apply();

            scope.removeFilter({name:'search'});

            expect($location.search().q).toBeUndefined();
        });

        it('should remove facet filter', function () {
            $location.search().fq = 'filter:facet';

            controllerService('SelectedFiltersCtrl', {$scope: scope});
            scope.$apply();

            scope.removeFilter({name:'facet'});

            expect($location.search().fq.length).toBe(0);
        });

        it('should remove OR facet', function () {
            $location.search().fq = 'filter:(facet1 facet2)';

            controllerService('SelectedFiltersCtrl', {$scope: scope});
            scope.$apply();

            scope.removeFilter({name:'facet1'});

            expect($location.search().fq.length).toBe(1);
        });

        it('should clear all', function () {
            $location.search().q = 'text';
            $location.search().fq = 'filter:facet';
            $location.search().place = '1 1 1 1';
            $location.search()['place.op'] = 'within';
            $location.search()['place.id'] = 'id';

            controllerService('SelectedFiltersCtrl', {$scope: scope});
            scope.$apply();

            scope.clearAllFilter({name:'facet'});

            expect($location.search().q).toBeUndefined();
            expect($location.search().fq).toBeUndefined();
            expect($location.search().place).toBeUndefined();
            expect($location.search()['place.op']).toBeUndefined();
            expect($location.search()['place.id'] ).toBeUndefined();
        });

        it('should handle events', function () {
            controllerService('SelectedFiltersCtrl', {$scope: scope});
            scope.$apply();

            $location.search().q = 'text';

            scope.$emit('filterChanged');

            expect(scope.filters.length).toBe(1);

            delete $location.search().q;

            scope.$emit('clearSearch');

            expect(scope.filters.length).toBe(0);
        });

    });

});