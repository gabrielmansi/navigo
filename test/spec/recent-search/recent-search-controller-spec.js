'use strict';

describe('Controller: RecentSearchCtrl', function () {

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
        $controller('RecentSearchCtrl', {
            $scope: $scope
        });

        //$http.expectGET(new RegExp('auth')).respond({response: {docs: []}}); //auth call

        $http.expectJSONP(new RegExp('ssearch')).respond({response: {docs: [item]}});

        //$http.expectJSONP().respond({response: {docs: []}});  // queued items call
        $http.flush();
        $timeout.flush();
    }

    it('should init', function () {
        //cartService.addItems([{id:'id'}]);
        initCtrl();
    });

    it('should toggle save status', function () {
        //cartService.addItems([{id:'id'}]);
        initCtrl();

        spyOn(savedSearchService,'showSaveSearchDialog').and.callThrough();
        $scope.toggleSave(item);

        expect(savedSearchService.showSaveSearchDialog).toHaveBeenCalledWith(item);

        spyOn(savedSearchService,'deleteSearch').and.callThrough();
        item.saved = true;
        $scope.toggleSave(item);

        expect(savedSearchService.deleteSearch).toHaveBeenCalledWith(item.id);
    });

    it('should delete', function () {
        //cartService.addItems([{id:'id'}]);
        initCtrl();

        spyOn(recentSearchService,'deleteSearch').and.callThrough();
        $scope.deleteSearch(item.id);

        expect(recentSearchService.deleteSearch).toHaveBeenCalledWith(item.id);
    });

    it('should apply', function () {
        //cartService.addItems([{id:'id'}]);
        initCtrl();

        spyOn(recentSearchService,'applyRecentSearch').and.callThrough();
        $scope.applyRecentSearch(item);

        expect(recentSearchService.applyRecentSearch).toHaveBeenCalledWith(item, $scope);

    });

});