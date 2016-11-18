'use strict';

describe('DetailsCtrl', function () {

    beforeEach(function () {
        module('voyager.security');
        module('voyager.results');
        module(function ($provide) {
            $provide.constant('config', config);
        });
        module('voyager.tagging');
        module('voyager.details');
    });

    var scope, controller, q, authServiceSpy, $location, $http, detailService, stateParams, $timeout, searchService, filterService;

    beforeEach(inject(function ($rootScope, $controller, $q, authService, _$location_, $httpBackend, _detailService_, _$stateParams_, _$timeout_, _searchService_, _filterService_) {
        scope = $rootScope.$new();
        controller= $controller;
        q = $q;
        //authServiceSpy = EZSpy.spyOn(authService);
        authServiceSpy = authService;
        $location = _$location_;
        $http = $httpBackend;
        detailService = _detailService_;
        stateParams = _$stateParams_;
        $timeout = _$timeout_;
        searchService = _searchService_;
        filterService = _filterService_;
    }));

    var doc = {id:'doc1', format: 'application/x-arcgis-map-server', fullpath:'z:/x/y', folder: 'x/y', bbox:'1 2 3 4', schema:'{"hash":"hash"}', download:'file://junk', layerURL:'bunk', hasMetadata:true, tree:'{"children":[{"mime":"mime"}]}', links:'{"links":[{"relation":"rel"}]}'};
    var lookupResponse = {data:{response: {docs:[doc]}, 'shards.info':[{shardAddress:'localhost/solr'}], to:['to_type'], from: ['from_type']}};

    function expectLoadHttpCalls() {
        // order of http calls (not mocking services here yet)
        //$http.expectGET(new RegExp('auth')).respond({permissions:{manage:true, process:true}});  // auth call
        $http.expectJSONP(new RegExp('solr\/fields')).respond({response: {docs:[]}}); // fields call
        $http.expectJSONP(new RegExp('solr\/v0')).respond(lookupResponse.data); // lookup call
        $http.expectGET(new RegExp('metadata')).respond(lookupResponse.data); // stylesheets call
        $http.expectJSONP(new RegExp('solr\/usertags')).respond({facet_counts: {facet_fields:{fss_tag_tags:[]}}}); // tags call
        $http.expectJSONP(new RegExp('tree')).respond(lookupResponse.data); // tree call

        // called twice since to and from happen in parallel
        $http.expectGET(new RegExp('links')).respond({from: ['server'], to: ['server']}); // link types call
        $http.expectGET(new RegExp('links')).respond({from: ['server'], to: ['server']}); // link types call

        $http.expectJSONP(new RegExp('fq=id')).respond(lookupResponse.data); // queue call

        $http.expectJSONP(new RegExp('links.to')).respond(lookupResponse.data); // links to call
        $http.expectJSONP(new RegExp('links.from')).respond(lookupResponse.data); // links from call
    }

    describe('Load', function () {

        beforeEach(function() {
            expectLoadHttpCalls();
        });

        it('should load', function () {
            controller('DetailsCtrl', {$scope: scope});
        });

        it('should call detail service with id', function() {
            spyOn(detailService, 'lookup').and.callThrough();
            controller('DetailsCtrl', {$scope: scope, $stateParams: {id: 'foo'}, authService: authServiceSpy});
            expect(detailService.lookup).toHaveBeenCalledWith('foo', ',*', undefined, undefined);
        });

        it('should load with shard', function() {
            spyOn(detailService, 'lookup').and.callThrough();
            $location.search('shard','shard');
            controller('DetailsCtrl', {$scope: scope, $stateParams: {id: 'foo', shard:'shard'}, authService: authServiceSpy});
            expect(detailService.lookup).toHaveBeenCalledWith('foo', ',*', 'shard', undefined);
        });

        afterEach(function(){
            scope.$apply();
            $http.flush();
            $timeout.flush();
        });

    });

    describe('Functions', function () {

        var doc = {id:'doc1', format: 'format', fullpath: 'dataset Dataset c:/temp/doc', 'tag_tags': 'tag', thumb: 'vres/mime'};
        var lookupResponse = {data:{response: {docs:[doc]}}};

        beforeEach(function() {
            // order of http calls (not mocking services here yet)

            //$http.expectGET(new RegExp('auth')).respond({permissions:{manage:true}});  // auth call
            $http.expectJSONP(new RegExp('solr\/fields')).respond({response: {docs:[]}}); // fields call
            $http.expectJSONP(new RegExp('solr\/v0')).respond(lookupResponse.data); // lookup call
            $http.expectGET(new RegExp('metadata')).respond(lookupResponse.data); // stylesheets call
            $http.expectJSONP(new RegExp('solr\/usertags')).respond({facet_counts: {facet_fields:{fss_tag_tags:[]}}}); // tags call

            $http.expectJSONP(new RegExp('solr\/v0')).respond(lookupResponse.data); // search call
        });

        function expectLinksAndQueue() {
            $http.expectGET(new RegExp('links')).respond(lookupResponse.data); // link types call
            $http.expectGET(new RegExp('links')).respond(lookupResponse.data); // link types call
            $http.expectJSONP(new RegExp('fq=id')).respond(lookupResponse.data); // queue call
        }

        it('should get next', function() {
            $http.expectJSONP(new RegExp('tree')).respond(lookupResponse.data); // tree call
            expectLinksAndQueue();
            controller('DetailsCtrl', {$scope: scope, $stateParams: {id: 'foo'}, authService: authServiceSpy});
            scope.getNext();
        });

        it('should get previous', function() {
            expectLinksAndQueue();

            spyOn(searchService,'getPreviousId').and.returnValue('id');
            controller('DetailsCtrl', {$scope: scope, $stateParams: {id: 'foo'}, authService: authServiceSpy});

            scope.$apply();
            scope.getPrevious();
        });

        it('should search flag', function() {
            //$http.expectJSONP(new RegExp('tree')).respond(lookupResponse.data); // tree call
            expectLinksAndQueue();
            controller('DetailsCtrl', {$scope: scope, $stateParams: {id: 'foo'}, authService: authServiceSpy});
            spyOn(scope,'$emit');
            spyOn(filterService,'setFilters').and.callThrough();
            scope.searchFlag('flag');
            expect($location.search().fq).toEqual('tag_flags:flag');
            expect(filterService.setFilters).toHaveBeenCalledWith({'fq' : 'tag_flags' + ':' + 'flag'});
            expect(scope.$emit).toHaveBeenCalledWith('filterEvent');
        });

        it('should search tag', function() {
            //$http.expectJSONP(new RegExp('tree')).respond(lookupResponse.data); // tree call
            expectLinksAndQueue();
            controller('DetailsCtrl', {$scope: scope, $stateParams: {id: 'foo'}, authService: authServiceSpy});
            spyOn(scope,'$emit');
            spyOn(filterService,'setFilters').and.callThrough();
            scope.searchTag('tag');
            expect($location.search().fq).toEqual('tag_tags:tag');
            expect(filterService.setFilters).toHaveBeenCalledWith({'fq' : 'tag_tags' + ':' + 'tag'});
            expect(scope.$emit).toHaveBeenCalledWith('filterEvent');
        });

        afterEach(function(){
            scope.$apply();
            $http.flush();
            $timeout.flush();
        });

    });

    function loadController() {
        expectLoadHttpCalls();

        controller('DetailsCtrl', {$scope: scope, $stateParams: {id: 'foo'}, authService: authServiceSpy});

        scope.$apply();
        $timeout.flush();
        $http.flush();
    }

    describe('Update Functions', function () {

        it('should save', function() {

            scope.doc = {id:'foo'};
            loadController();

            $http.expectPOST(new RegExp('usertag')).respond(lookupResponse.data);

            scope.doSave({isArray:true, values:['1,2'], key: 'key', value:'val'});

            $http.flush();

            $http.expectJSONP(new RegExp('solr\/fields')).respond({response: {docs:[]}}); // fields call
            $http.expectJSONP(new RegExp('solr\/v0')).respond(lookupResponse.data); // lookup call

            $timeout.flush();  // sync called firing http calls above

            $http.flush();

        });

        it('should remove flag', function() {

            scope.doc = {id:'foo', tag_flags:'flag', tag_tags:'tag'};
            loadController();

            $http.expectPOST(new RegExp('usertag')).respond({tagging:{documents:1}});

            scope.removeFlag();

            $http.flush();

            expect(scope.doc.tag_flags).toBeUndefined();

        });

        it('should toggle edit mode', function() {

            loadController();

            var field = {value:'val', formattedValue:'formatted'};
            scope.edit(field);

            expect(field.editing).toBeTruthy();
            expect(field.originalValue).toBe(field.value);
            expect(field.originalFormatted).toBe(field.formattedValue);
        });

        it('should cancel edit mode', function() {

            loadController();

            var field = {value:'val', originalFormatted:'formatted', originalValue:'orig'};
            scope.cancel(field);

            expect(field.editing).toBeFalsy();
            expect(field.value).toBe(field.originalValue);
            expect(field.formattedValue).toBe(field.originalFormatted);
        });

    });

    describe('Cart', function () {
        it('should check cart permission', function() {

            spyOn(authServiceSpy, 'hasPermission').and.returnValue(true);
            loadController();

            expect(scope.canCart).toBeTruthy();  //auth http mock response has process = true above
        });

        it('should add to cart', function() {
            scope.doc = {id:'foo', tag_flags:'flag', tag_tags:'tag'};
            loadController();

            scope.addToCart();

            expect(scope.doc.inCart).toBeTruthy();  //auth http mock response has process = true above
            expect(scope.inCart(scope.doc.id)).toBeTruthy();  //auth http mock response has process = true above
        });

        it('should remove from cart', function() {
            scope.doc = {id:'foo', tag_flags:'flag', tag_tags:'tag'};
            loadController();

            scope.addToCart();
            scope.removeFromCart();

            expect(scope.doc.inCart).toBeFalsy();  //auth http mock response has process = true above
            expect(scope.inCart(scope.doc.id)).toBeFalsy();  //auth http mock response has process = true above
        });

    });

});
