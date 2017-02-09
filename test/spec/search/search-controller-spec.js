/*global describe, beforeEach, module, it, inject, config, EZSpy */

describe('SearchCtrl', function () {

    'use strict';

    var cfg = _.clone(config);

    beforeEach(function () {
        module('voyager.security'); //auth service module - apparently this is needed to mock the auth service
        module('voyager.results');
        module(function ($provide) {
            $provide.constant('config', cfg);
            //$provide.value('authService',{});  //mock the auth service so it doesn't call the init methods
        });
        module('voyager.tagging');
        module('voyager.details');
    });

    var scope, controllerService, translateServiceMock, detailServiceMock, q, tagServiceMock, location, timeout, $http, cartService, $window, authService;

    //spies
    var $s = {'configService':{}, 'cartService':{}, searchService:{}};

    beforeEach(inject(function ($rootScope, $controller, $q, $location, $timeout, searchService, _cartService_, configService, _$httpBackend_, _$window_, searchModalService, _authService_) {
        scope = $rootScope.$new();
        q = $q;
        controllerService = $controller;
        location = $location;
        timeout = $timeout;
        $http = _$httpBackend_;
        cartService = _cartService_;
        $window = _$window_;
        authService = _authService_;

        EZSpy.spyOnAll($s, [{searchService:searchService}, {cartService:cartService}, {configService:configService}, {searchModalService:searchModalService}]);
        $s.searchService.getPageIds.and.returnValue([1]);
        $s.searchService.testEsriGeocodeService.and.returnValue(q.when({}));

        $s.cartService.fetch.and.returnValue(q.when({}));
    }));

    cfg.settings.data.sortable = ['field'];

    function initCtrl(response, search, authResponse) {
        if (angular.isUndefined(authResponse)) {
            authResponse = {};
        }
        controllerService('SearchCtrl', {$scope: scope});

        //$http.expectGET(new RegExp('auth')).respond(authResponse); //auth info call
        if (search) {
            $http.expectGET(new RegExp('solr\/v0')).respond(response);  //search call
            $http.flush();
        }
        scope.$apply();

        timeout.flush();
    }

    describe('Load', function () {

        it('should load with empty results', function () {

            scope.pageFramework = { showHeaderInfo: false };

            location.search({pg:2, disp:'disp', sort:'field asc'});

            var response = {docs:[], numFound:0}, sort = {key:'field', value:'Field'};

            //TODO removing mocks for now, more of a functional test
            //$s.configService.getSortable.and.returnValue([sort]);
            //$s.searchService.doSearch2.and.returnValue(q.when({data:{response:response}}));
            //controllerService('SearchCtrl', {$scope: scope, 'cartService': $s.cartService, 'searchService': $s.searchService, 'translateService': translateServiceMock, 'authService': authServiceMock, 'detailService': detailServiceMock, 'configService':$s.configService, 'tagService':tagServiceMock});

            initCtrl({response: response}, true);

            expect(scope.results).toEqual(response.docs);
            expect(scope.totalItems).toBe(response.numFound);
            // expect(scope.displaySortField).toBe(sort.value);
            expect(scope.sortField).toBe(sort.key);
            expect(scope.view).toBe('card');
        });

        it('should load with error', function () {

            controllerService('SearchCtrl', {$scope: scope});

            //$http.expectGET(new RegExp('auth')).respond({}); //auth info call
            $http.expectGET(new RegExp('solr\/v0')).respond(500,'');  //search call

            scope.$apply();
            $http.flush();
            timeout.flush();

            expect(scope.searchError).toEqual(true);
            expect(scope.totalItems).toBe(0);
        });

        it('should load with table view', function () {

            location.search({pg:2, disp:'disp', view:'table'});

            var response = {docs:[], numFound:0};

            initCtrl({response: response}, false);  //table view controller will do the search

            expect(scope.view).toBe('table');
        });

        it('should load with map view and filters', function () {

            location.search({pg:2, disp:'disp', view:'map', fq:'filter:facet', filter:'true', sort:'field'});

            var response = {docs:[], numFound:0};

            initCtrl({response: response}, true);

            expect(scope.view).toBe('map');
            expect(scope.sortField).toBe('field');
        });

        it('should load with federations error', function () {

            location.search({pg:2, disp:'disp', view:'map', fq:'filter:facet', filter:'true', sort:'field'});

            var response = {docs:[], numFound:0};

            initCtrl({response: response, 'shards.info':{shard:{error:'error'}}}, true);

            expect(scope.view).toBe('map');
            expect(scope.sortField).toBe('field');
            expect(scope.resultError).toBeTruthy();
        });

        it('should sync cart state', function () {

            var response = {docs:[{id:'id'}], numFound:0}, sort = {key:'key', value:'value'};
            var items = [{id:'id'}];

            $s.configService.getSortable.and.returnValue([sort]);
            $s.configService.getPageFramework.and.returnValue({showHeaderInfo: true});
            $s.searchService.doSearch2.and.returnValue(q.when({data:{response:response}}));
            $s.searchService.getPageIds.and.returnValue([1]);
            $s.searchService.getItemsPerPage.and.returnValue(12);

            $s.cartService.hasItems.and.returnValue(true);
            $s.cartService.fetchQueued.and.returnValue(q.when(items));

            spyOn(scope,'$broadcast');
            scope.pageFramework = { showHeaderInfo: false };

            controllerService('SearchCtrl', {$scope: scope, 'cartService': $s.cartService, 'searchService': $s.searchService, 'translateService': translateServiceMock, 'detailService': detailServiceMock, 'configService':$s.configService, 'tagService':tagServiceMock});
            $http.expectGET(new RegExp('auth')).respond({});

            scope.$apply();

            expect(response.docs[0].inCart).toBe(true);
            expect(scope.$broadcast).toHaveBeenCalledWith('syncCard', {});

        });

        it('should sort by location sort param', function () {

            var response = {docs:[{id:'id'}], numFound:0}, sortField = {key:'key', value:'value'}, sortField2 = {key:'key2', value:'value2'};
            spyOn(location,'search').and.returnValue({sort:'key2'});

            $s.configService.getSortable.and.returnValue([sortField, sortField2]);
            $s.searchService.doSearch2.and.returnValue(q.when({data:{response:response}}));
            $s.configService.getPageFramework.and.returnValue({showHeaderInfo: true});

            controllerService('SearchCtrl', {$scope: scope, 'cartService': $s.cartService, 'searchService': $s.searchService, 'translateService': translateServiceMock, 'detailService': detailServiceMock, 'configService':$s.configService, 'tagService':tagServiceMock});
            $http.expectGET(new RegExp('auth')).respond({});

            scope.$apply();

            expect(scope.displaySortField).toBe(sortField2.value);
            expect(scope.sortField).toBe(sortField2.key);

        });

    });

    describe('Events', function () {

        it('should handle doSearch', function () {

            var response = {docs:[], numFound:0}, sort = {key:'key', value:'value'};
            spyOn(location,'search').and.returnValue({sort:'key', sortdir:'asc'});

            $s.configService.getSortable.and.returnValue([sort]);
            $s.searchService.doSearch2.and.returnValue(q.when({data:{response:response}}));
            $s.configService.getPageFramework.and.returnValue({showHeaderInfo: true});

            controllerService('SearchCtrl', {$scope: scope, 'cartService': $s.cartService, 'searchService': $s.searchService, 'translateService': translateServiceMock, 'detailService': detailServiceMock, 'configService':$s.configService, 'tagService':tagServiceMock});
            $http.expectGET(new RegExp('auth')).respond({});

            scope.$apply();

            scope.$emit('doSearch');

            timeout.flush();

            expect(scope.results).toBe(response.docs);
            expect(scope.totalItems).toBe(response.numFound);
            expect(scope.displaySortField).toBe(sort.value);
            expect(scope.sortField).toBe(sort.key);

            expect($s.searchService.setSort).toHaveBeenCalledWith('asc');

        });

        it('should handle filterChanged', function () {

            var response = {docs:[], numFound:0}, sort = {key:'key', value:'value'};

            $s.configService.getSortable.and.returnValue([sort]);
            $s.searchService.doSearch2.and.returnValue(q.when({data:{response:response}}));
            $s.configService.getPageFramework.and.returnValue({showHeaderInfo: true});

            controllerService('SearchCtrl', {$scope: scope, 'cartService': $s.cartService, 'searchService': $s.searchService, 'translateService': translateServiceMock, 'detailService': detailServiceMock, 'configService':$s.configService, 'tagService':tagServiceMock});
            $http.expectGET(new RegExp('auth')).respond({});

            scope.$apply();

            scope.$emit('filterChanged');

            timeout.flush();

            expect(scope.results).toBe(response.docs);
            expect(scope.totalItems).toBe(response.numFound);

            expect($s.searchService.doSearch2).toHaveBeenCalled();

        });

        it('should check permissions', function () {
            var response = {docs:[], numFound:0};

            spyOn(authService,'hasPermission').and.returnValue(true);

            initCtrl({response: response}, true, {permissions:{edit_fields:true, flag: true, process:true}});

            expect(scope.hasOnePermission()).toBeTruthy();
            expect(scope.flagPermission()).toBeTruthy();
            expect(scope.canCart()).toBeTruthy();

        });

        it('should manage cart', function () {
            var response = {docs:[{id:'id'},{id:'id2'}], numFound:5};
            location.search({pg:2, disp:'disp', view:'map', fq:'filter:facet', filter:'true', sort:'field'});

            initCtrl({response: response}, true, {permissions:{edit_fields:true, flag: true, process:true}});

            var item = {id:'id'};

            scope.addToCart(item);

            expect(scope.inCart(item)).toBeTruthy();

            scope.removeFromCart(item.id);

            expect(scope.inCart(item)).toBeFalsy();

            spyOn(scope,'$emit');

            scope.addAllToCart();

            expect(scope.$emit).toHaveBeenCalledWith('addAllToCartEvent', {});

            cartService.clear();

        });

        it('should change sort', function () {
            var response = {docs:[{id:'id'}], numFound:5};
            location.search({disp:'disp', view:'card', fq:'filter:facet', filter:'true', sort:'field desc'});

            initCtrl({response: response}, true);

            scope.changeSort({key:'field', value:'Field'});

            expect(scope.sortField).toEqual('field');

            scope.changeSortDirection('asc');

            expect(location.search().sort).toEqual('field asc');

        });

        it('should handle scroll', function() {

            var response = {docs:[{id:'id2'}], numFound:5};
            location.search({disp:'disp', view:'card', fq:'filter:facet', filter:'true', sort:'field desc'});
            location.path('/search');

            initCtrl({response: response}, true);

            $http.expectGET(new RegExp('solr\/v0')).respond({response:response});  //search call next chunk (page)

            $($window).trigger('scroll');

            $http.flush();

            expect(scope.results.length).toBe(2);
            expect(scope.results[1].id).toBe('id2');
        });

        it('should change view event', function() {

            var response = {docs:[{id:'id2'}], numFound:5};
            location.search({disp:'disp', view:'map', fq:'filter:facet', filter:'true', sort:'field desc'});

            initCtrl({response: response}, true);

            scope.view = 'card';

            scope.$emit('changeView');

            expect(scope.view).toBe('map');
        });

        it('should toggle map', function() {

            var response = {docs:[{id:'id2'}], numFound:5};
            location.search({disp:'disp', view:'map', fq:'filter:facet', filter:'true', sort:'field desc'});

            initCtrl({response: response}, true);

            scope.view = 'card';

            scope.toggleMap();

            expect(scope.bigMap).toBeTruthy();

            scope.toggleMap();

            expect(scope.bigMap).toBeFalsy();
        });

        it('should change map size to small', function () {

            var response = {docs:[], numFound:0}, sort = {key:'key', value:'value'};

            $s.configService.getSortable.and.returnValue([sort]);
            $s.searchService.doSearch2.and.returnValue(q.when({data:{response:response}}));
            $s.configService.getPageFramework.and.returnValue({showHeaderInfo: true});

            controllerService('SearchCtrl', {$scope: scope, 'cartService': $s.cartService, 'searchService': $s.searchService, 'translateService': translateServiceMock, 'detailService': detailServiceMock, 'configService':$s.configService, 'tagService':tagServiceMock});
            scope.$apply();
            spyOn(scope, 'switchMap').and.callThrough();

            scope.$emit('mapSizeChanged', 'small');

            timeout.flush();

            expect(scope.switchMap).toHaveBeenCalledWith('small');
            expect(scope.tableViewMapSize).toBe('small');
        });

        it('should open export CSV modal', function () {
            var response = {docs:[], numFound:0}, sort = {key:'key', value:'value'};

            $s.configService.getSortable.and.returnValue([sort]);
            $s.searchService.doSearch2.and.returnValue(q.when({data:{response:response}}));
            $s.configService.getPageFramework.and.returnValue({showHeaderInfo: true});

            controllerService('SearchCtrl', {$scope: scope, 'cartService': $s.cartService, 'searchService': $s.searchService, 'translateService': translateServiceMock, 'detailService': detailServiceMock, 'configService':$s.configService, 'tagService':tagServiceMock, 'searchModalService':$s.searchModalService});
            scope.$apply();

            scope.exportResultsList();
            expect($s.searchModalService.exportResultsList).toHaveBeenCalled();
        });

    });

});