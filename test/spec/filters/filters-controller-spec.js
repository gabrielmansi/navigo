'use strict';

describe('Filters:', function () {

    var cfg = _.clone(config);

    function _flushHttp(httpMock) {
        httpMock.flush();
        httpMock.verifyNoOutstandingExpectation();
        httpMock.verifyNoOutstandingRequest();
    }
    //_.mixin(_.str.exports());  //this happens in the app.js, not fired here

    beforeEach(function () {
        module('voyager.util');
        module('voyager.security'); //auth service module - apparently this is needed to mock the auth service
        module(function ($provide) {
            $provide.constant('config', cfg);
        });
        module('voyager.filters');
        module('ui.bootstrap');
    });

    var httpMock, _configService, scope, controllerService, _filterService, q, _treeService, $location, $timeout, catalogService;

    beforeEach(inject(function ($rootScope, configService, $httpBackend, $controller, filterService, $q, treeService, _$location_, _$timeout_, _catalogService_) {
        httpMock = $httpBackend;
        _configService = configService;
        scope = $rootScope.$new();
        controllerService = $controller;
        _filterService = filterService;
        q = $q;
        _treeService = treeService;
        $location = _$location_;
        $timeout = _$timeout_;
        catalogService = _catalogService_;
        spyOn(catalogService,'removeInvalid').and.callFake(function(val) {
            return val;
        });
    }));

    describe('filtersController events', function () {

        it('should load', function () {
            controllerService('FiltersCtrl', {$scope: scope});
            scope.$apply();

            expect(scope.maxFacets).toBe(10);
        });

        it('should fetch on search event', function () {

            var displayFilter = {name: 'junk', field: 'junkField'};
            var displayFacet = ['junkFacet', 5];

            cfg.settings.data.filters.push(displayFilter);

            //evalutating sinon vs jasmine
            sinon.stub(_filterService, 'applyFromUrl').returns(q.when({}));

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            scope.$apply();

            scope.$emit('doSearch');

            httpMock.expectJSONP().respond({facet_counts:{facet_fields:{junkField:displayFacet}}});

            scope.$apply();

            _flushHttp(httpMock);

            var actualFilter = scope.filters[0];
            expect(actualFilter.name).toBe(displayFilter.name);

            var facets = actualFilter.values;

            //This is more of a functional test it spans outside of the filtersController (trying to get more bang for buck)
            expect(facets[0].name).toBe(displayFacet[0]);
            expect(facets[0].count).toBe(displayFacet[1]);
            expect(facets[0].filter).toBe(displayFilter.field);
        });

        it('should fetch on filterChanged event', function () {

            var displayFilter = {name: 'junk', field: 'junkField'};
            var displayFacet = ['junkFacet', 5];

            cfg.settings.data.filters.push(displayFilter);

            //evalutating sinon vs jasmine
            sinon.stub(_filterService, 'applyFromUrl').returns(q.when({}));

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            scope.$apply();

            scope.$emit('filterChanged');

            httpMock.expectJSONP().respond({facet_counts:{facet_fields:{junkField:displayFacet}}});

            scope.$apply();

            _flushHttp(httpMock);

            var actualFilter = scope.filters[0];
            expect(actualFilter.name).toBe(displayFilter.name);
        });
    });

    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    }


    describe('filtersController functions', function () {

        it('should open min date picker', function () {
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var facet = {};
            scope.openMinDatePicker($.Event('click'), facet);
            expect(facet.isMinOpened).toBeTruthy();
            expect(facet.isMaxOpened).toBeFalsy();
        });

        it('should open max date picker', function () {
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var facet = {};
            scope.openMaxDatePicker($.Event('click'), facet);
            expect(facet.isMaxOpened).toBeTruthy();
            expect(facet.isMinOpened).toBeFalsy();
        });

        it('should filter selected', function () {
            var displayFilter = {name: 'facet', field: 'field2'};

            cfg.settings.data.filters = [displayFilter];

            scope.filters = [];
            _filterService.clear();

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var facet = {isSelected: true, field: 'field1', name: 'facet'};
            scope.filterResults(facet);

            var res = {facet_counts:{facet_fields:{field1:['facet',5]}}};

            var url = new RegExp(escapeRegExp('root/solr/v0/select?voyager.config.id=default&rows=0&facet=true'));
            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);

            scope.$apply();

            expect(scope.filters.length).toBe(1);
            expect(scope.filters[0].name).toBe(facet.name);
        });

        it('should show all facets', function () {
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var filter = {displayState: '', field:'field'};
            scope.showAllFacets(filter);
        });

        it('should get field name', function () {
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var node = {collapsed: false, loaded: false};
            scope.loadNode(node);
            expect(node.collapsed).toBe(true);
        });

        it('should load node', function () {
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var name = scope.getFieldName('foo');
            expect(name).toBe('Foo');
        });

        it('should only filter', function () {
            var displayFilter = {name: 'facet1', field: 'field1'};
            cfg.settings.data.filters = [displayFilter, {name: 'facet2', field: 'field1'}];

            _filterService.clear();

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var facet = {isSelected: true, field: 'field1', name:'facet1'};
            scope.filterResults(facet);  // only function should remove this

            var res = {facet_counts:{facet_fields:{field1:['facet1',5]}}};

            var url = new RegExp(escapeRegExp('root/solr/v0/select?voyager.config.id=default&rows=0&facet=true'));
            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);

            // 2 display filters configured to show (cfg.settings.data.filters)
            expect(scope.filters.length).toBe(2);

            var facet2 = {isSelected: true, filter: 'field1', name:'facet2'};
            scope.filterOnly(facet2);

            res = {facet_counts:{facet_fields:{field1:['facet2',5]}}};
            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);

            var filterParams = $location.search().fq;

            expect(filterParams.length).toBe(1);
            expect(filterParams[0]).toEqual(facet2.filter + ':' + facet2.name);

            // 2 display filters configured to show (cfg.settings.data.filters)
            expect(scope.filters.length).toBe(2);
            expect(scope.filters[0].name).toBe(displayFilter.name);
        });

        it('should handle complex filters', function () {
            var complexFacet = {style: 'COMPLEX', isSelected: false, name: ['facet1', 'facet2'], filter: ['filter1', 'filter2']};
            var partialFacet = {style: '', name: 'facet2', filter: 'filter2'};
            var complexFilter = {field: 'complexFilter', value: 'Complex Filter', style: 'COMPLEX', values: []};
            complexFilter.values.push(complexFacet);

            var savedFilters = cfg.settings.data.filters;
            cfg.settings.data.filters=[complexFilter];

            spyOn(_configService, 'getDisplayFilters').and.returnValue([complexFilter]);

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            scope.$apply();

            scope.filterResults(complexFacet);
            scope.$emit('doSearch');
            httpMock.expectJSONP().respond({facet_counts:{facet_fields:{}}});
            scope.$apply();

            _flushHttp(httpMock);

            expect(_filterService.getFilters().length).toBe(2);
            expect(scope.filters[0].values[0].isSelected).toBe(true);

            scope.removeFilter(partialFacet);
            httpMock.expectJSONP().respond({facet_counts:{facet_fields:{}}});
            scope.$apply();

            _flushHttp(httpMock);

            expect(scope.filters[0].values[0].isSelected).toBe(false);

            scope.filterResults(partialFacet);
            httpMock.expectJSONP().respond({facet_counts:{facet_fields:{}}});
            scope.$apply();

            _flushHttp(httpMock);

            expect(scope.filters[0].values[0].isSelected).toBe(true);

            scope.removeFilter(complexFacet);
            httpMock.expectJSONP().respond({facet_counts:{facet_fields:{}}});
            scope.$apply();

            _flushHttp(httpMock);

            expect(_filterService.getFilters().length).toBe(0);
            expect(scope.filters[0].values[0].isSelected).toBe(false);

            cfg.settings.data.filters = savedFilters;
        });

        it('should generate discovery status filters', function () {

            cfg.settings.data.showDiscoveryStatus = true;

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});

            var filters = _configService.getDisplayFilters();
            expect(filters[0].values.length).toBe(3);

            cfg.settings.data.showDiscoveryStatus = false; // set false so it doesn't affect other tests
        });

        it('should filter results with shards', function () {

            cfg.settings.data.showFederatedSearch = true;

            $location.search('shards','shard');
            $location.path('/search');
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService, catalogService: catalogService});
            var facet = {isSelected: false, field:'shard', id:'shard'};

            spyOn(_configService,'getCatalogs').and.returnValue(q.when());

            scope.filterResults(facet);

            var res = {facet_counts:{facet_fields:{}},'shards.info':{'shard-key':{error:'error'}}};

            httpMock.expectGET(new RegExp(escapeRegExp('root/api/rest/index/config/federation.json'))).respond({servers:[{url:'url/'}]}); // catalogs call

            httpMock.expectGET(new RegExp(escapeRegExp('url/api/rest/i18n/field/location.json'))).respond({VALUE:{location:'location'}}); // remote catalog locations call

            var url = new RegExp(escapeRegExp('root/solr/v0/select?shards=shard,shard&voyager.config.id=default&rows=0&facet=true'));
            httpMock.expectJSONP(url).respond(res);  // solr filter query

            _flushHttp(httpMock);

            cfg.settings.data.showFederatedSearch = false; // set false so it doesn't affect other tests

            expect($location.search().shards).toEqual('shard,shard');
            // TODO need assertions on scope.filters
            //console.log(JSON.stringify(scope.filters));
        });

        it('should add range filter', function () {
            cfg.settings.data.filters = [{field: 'rangeField', style: 'RANGE', minCount: 0}];

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var facet = {isSelected: true, model:[1,2], name:'name', display:'display', style:'RANGE', filter:'rangeField', field:'rangeField'};
            scope.addRangeFilter(facet);
            httpMock.expectJSONP(new RegExp(escapeRegExp('stats=true'))).respond({stats:{stats_fields:{rangeField:{min:0, max:5}}}});  // stats query for range values

            var res = {facet_counts:{facet_fields:{rangeField:['facet',1]}}};
            var url = new RegExp(escapeRegExp('root/solr/v0/select?voyager.config.id=default&rows=0&facet=true'));
            httpMock.expectJSONP(url).respond(res);  // solr filter query

            _flushHttp(httpMock);

            cfg.settings.data.filters = [];
        });

        it('should add stats filter', function () {
            cfg.settings.data.filters = [{field: 'statsField', style: 'STATS', minCount: 0}];

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var facet = {isSelected: true, model:[1,2], name:'name', display:'display', style:'STATS', filter:'statsField', field:'statsField'};
            scope.addRangeFilter(facet);

            httpMock.expectJSONP(new RegExp(escapeRegExp('stats=true'))).respond({stats:{stats_fields:{statsField:{min:0, max:5}}}});  // stats query for range values

            var res = {facet_counts:{facet_fields:{statsField:['facet',1]}}};
            var url = new RegExp(escapeRegExp('root/solr/v0/select?voyager.config.id=default&rows=0&facet=true'));
            httpMock.expectJSONP(url).respond(res);  // solr filter query

            httpMock.expectJSONP(new RegExp(escapeRegExp('stats=true'))).respond({stats:{stats_fields:{statsField:{min:0, max:5}}}});  // stats query for range values

            _flushHttp(httpMock);

            cfg.settings.data.filters = [];
        });

        it('should add calendar filter', function () {
            cfg.settings.data.filters = [{field: 'calendarField', style: 'RANGE', minCount: 0, stype:'date'}];

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});

            var facet = {isSelected: true, model:[1,2], name:'name', display:'display', style:'RANGE', stype:'date', filter:'calendarField'};
            scope.addCalendarFilter(facet);

            httpMock.expectJSONP(new RegExp(escapeRegExp('stats=true'))).respond({stats:{stats_fields:{calendarField:{min:0, max:5}}}});  // stats query for range values

            var res = {facet_counts:{facet_fields:{calendarField:['facet',1]}}};

            var url = new RegExp(escapeRegExp('root/solr/v0/select?voyager.config.id=default&rows=0&facet=true'));
            httpMock.expectJSONP(url).respond(res);  // solr filter query

            _flushHttp(httpMock);

            cfg.settings.data.filters = [];
        });

        it('should add folder filter', function () {
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var facet = {isSelected: false, model:[1,2], name:'name', display:'display', path:'path'};
            scope.addFolderFilter(facet);

            var res = {facet_counts:{facet_fields:{}}};

            var url = new RegExp(escapeRegExp('root/solr/v0/select?voyager.config.id=default&rows=0&facet=true'));
            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);
        });


        it('should append missing OR', function () {
            var displayFilter = {name: 'facet', field: 'field2', style:'CHECK'};

            cfg.settings.data.filters = [displayFilter];

            scope.filters = [];
            _filterService.clear();

            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var facet = {isSelected: true, field: 'field2', name: 'facet', style:'CHECK'};
            scope.filterResults(facet);

            var res = {facet_counts:{facet_fields:{field2:['facet',5]}}};

            var url = new RegExp(escapeRegExp('root/solr/v0/select?voyager.config.id=default&rows=0&facet=true'));
            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);

            scope.$apply();

            expect(scope.filters.length).toBe(1);

            // TODO - need better way to invoke this test
            var facet2 = {isSelected: true, filter: 'field2', name:'(facet facet1)', style:'CHECK'};
            scope.filterOnly(facet2);

            res = {facet_counts:{facet_fields:{field1:['facet2',5]}}};
            httpMock.expectJSONP(url).respond(res);  // solr filter query

            _flushHttp(httpMock);

            expect(scope.filters[0].name).toBe(facet.name);
            expect(scope.filters[0].values[0].name).toBe('facet');
            expect(scope.filters[0].values[1].name).toBe('facet1');
        });

    });

    describe('filtersController remove filter functions', function () {

        var facet = {isSelected: false, model: [1, 2], name: 'name', display: 'display', path: 'path'};
        var url = new RegExp(escapeRegExp('root/solr/v0/select'));
        var res = {facet_counts: {facet_fields: {}}};

        // set up controller and add a filter
        function initControllerAndFilter(facet) {
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});

            scope.filterResults(facet);

            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);
        }

        it('should remove filter', function () {
            initControllerAndFilter(facet);
            scope.removeFilter(facet);

            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);
        });

        it('should remove filter', function () {
            initControllerAndFilter(facet);
            scope.removeFilter(facet);

            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);
        });

        it('should remove shard filter', function () {
            $location.search('shards', 'shard');
            facet.field = 'shard';
            initControllerAndFilter(facet);
            scope.removeFilter(facet);

            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);
            //TODO should remove comma
            expect($location.search().shards).toEqual('shard,');
        });

        it('should remove input filter', function () {
            facet.isInput = true;
            facet.field = 'field';
            $location.search('q','q');
            initControllerAndFilter(facet);
            scope.removeFilter(facet);

            httpMock.expectJSONP(url).respond(res);  // solr filter query
            _flushHttp(httpMock);

            expect($location.search().q).toBeUndefined();
        });
    });

    describe('filtersController misc functions', function () {

        it('should toggle display state', function () {
            controllerService('FiltersCtrl', {$scope: scope, filterService: _filterService});
            var filter = {displayState: '', field:'field'};
            scope.toggleDisplayState(filter);

            var filterElem = $('<div id="field"/>');
            $(document.body).append(filterElem);

            $timeout.flush();
            $timeout.flush();
        });

    });
});