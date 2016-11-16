'use strict';

describe('Controller: SavedSearchCtrl', function () {

    var $scope, $timeout, $location, $http, $controller, authService, savedSearchService, recentSearchService;
    var cfg = _.clone(config);

    beforeEach(function () {

        module('voyager.security');
        module('voyager.search');
        module('voyager.util');
        module('voyager.filters');
        module('voyager.config');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });

        inject(function (_$controller_, _$timeout_, _authService_, _$location_, $httpBackend, _savedSearchService_, _recentSearchService_, $rootScope) {
            $scope = $rootScope.$new();
            $timeout = _$timeout_;
            $location = _$location_;
            $http = $httpBackend;
            $controller = _$controller_;
            authService = _authService_;
            savedSearchService = _savedSearchService_;
            recentSearchService = _recentSearchService_;
        });

    });

    // Specs here
    var item = {id: 'id', place: '0 0 0 0'};

    function initCtrl() {
        var savedSearchController = $controller('SavedSearchCtrl', {
            $scope: $scope
        });

        //$http.expectGET(new RegExp('auth')).respond({response: {docs: []}}); //auth call

        //TODO are observers causing multiple to fire?
        $http.expectJSONP(new RegExp('ssearch')).respond({response: {docs: [item]}});
       // $http.expectJSONP(new RegExp('ssearch')).respond({response: {docs: [item]}});

        $http.flush();
        $timeout.flush();

        return savedSearchController;
    }

    it('should init', function () {
        //cartService.addItems([{id:'id'}]);
        var ctrl = initCtrl();

        expect(ctrl.savedSearches).toEqual([item]);

    });

    it('should apply saved search', function () {
        //cartService.addItems([{id:'id'}]);
        var ctrl = initCtrl();

        spyOn(savedSearchService,'applySavedSearch').and.callThrough();

        var saved = {id: 'id', query:'query'};
        saved.display = cfg.settings.data;

        ctrl.applySavedSearch(saved);

        expect(savedSearchService.applySavedSearch).toHaveBeenCalledWith(saved, $scope);
    });

    it('should delete saved search', function () {
        //cartService.addItems([{id:'id'}]);
        var ctrl = initCtrl();

        spyOn(savedSearchService,'deleteSearch').and.callThrough();

        var saved = {id: 'id', query:'query'};
        $http.expectDELETE(new RegExp('ssearch')).respond({response: {docs: [item]}});
        $http.expectJSONP(new RegExp('ssearch')).respond({response: {docs: [item]}}); //reload
        $http.expectJSONP(new RegExp('ssearch')).respond({response: {docs: [item]}}); //TODO firing too many?

        ctrl.deleteSearch(saved.id);

        $http.flush();

        expect(savedSearchService.deleteSearch).toHaveBeenCalledWith(saved.id);
    });

    it('should order personal saved', function () {
        //cartService.addItems([{id:'id'}]);
        spyOn(savedSearchService,'order').and.callThrough();

        var ctrl = initCtrl();

        $http.expectPOST(new RegExp('ssearch')).respond({response: {docs: [item]}}); //order

        ctrl.personalSavedSearches = [{id:1},{id:2}];

        ctrl.dragControlListeners.accept();
        ctrl.dragControlListeners.orderChanged({dest:{index:1}});

        $http.flush();

        expect(savedSearchService.order).toHaveBeenCalled();
    });

});