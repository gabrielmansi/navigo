'use strict';

describe('Controller: HomeCtrl', function () {

    var $scope, $timeout, $uibModal, usSpinnerService, $location, $http, $controller, leafletData, q, cartService;
    var cfg = _.clone(config);

    beforeEach(function () {
        module('voyager.home');
        module('voyager.search');
        module('voyager.tagging');
        module('ui.bootstrap');
        module('voyager.config');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });

        inject(function (_$controller_, _$timeout_, _$uibModal_, _usSpinnerService_, _$location_, $httpBackend , $rootScope, _leafletData_, _$q_, _cartService_) {
            $scope = $rootScope.$new();
            $timeout = _$timeout_;
            $uibModal = _$uibModal_;
            usSpinnerService = _usSpinnerService_;
            $location = _$location_;
            $http = $httpBackend;
            $controller = _$controller_;
            leafletData = _leafletData_;
            q = _$q_;
            cartService = _cartService_;
        });

        cfg.settings.data.display.showMap = true;
    });

    // Specs here

    function initController() {
        spyOn(cartService, 'fetch').and.returnValue(q.when({}));
        spyOn(cartService, 'setQueryCount');

        $controller('HomeCtrl', {$scope: $scope, $uibModalInstance: {}, resultTotalCount: 1, leafletData: leafletData, cartService: cartService});

        $http.expectJSONP(new RegExp('ssearch')).respond({response:{docs:[]}}); // saved searches
        $http.expectJSONP(new RegExp('ssearch')).respond({response:{docs:[]}}); // get default saved search
        $http.expectJSONP(new RegExp('v0')).respond({response:{docs:[]}}); // featured search

        $http.flush();
    }

    function getMapMock() {
        var map = new LeafletMapMock();
        map.vsSearchType = 'searchType';
        map.on = function (event, callback) {
            var e = {};
            e.layer = {};
            e.layer.getBounds = function () {
                return {
                    toBBoxString: function () {
                        return '0 0 0 0';
                    }
                };
            };
            if (callback) {
                callback(e);
            }
        };
        return map;
    }

    it('should init', function () {
        var map = getMapMock();
        spyOn(leafletData, 'getMap').and.callFake(function() {
            return q.when(map);
        });

        initController();

        //TODO failing after Cainkade merge
        //expect($scope.search['place.op']).toEqual('searchType');
    });

    it('should init with map hidden', function () {
        // cfg.settings.data.display.showMap = false; // TODO does pageElements control the home page?
        cfg.settings.data.pageElements.showMap = false;

        initController();

        // expect($scope.containerStyle.indexOf('-60') > -1).toBeTruthy();
        expect($scope.mapTypes).toEqual(['Place']);
        expect($scope.showMap).toBeFalsy();
        expect($scope.selectedMapType).toBe('Place');
    });

    it('should init with place finder hidden', function () {
        cfg.settings.data.pageElements.showMap = true;
        cfg.homepage.showPlaceQuery = false;

        initController();

        expect($scope.mapTypes).toEqual(['Map']);
        expect($scope.showMap).toBeTruthy();
        expect($scope.selectedMapType).toBe('Map');

        delete cfg.homepage.showPlaceQuery; //reset to default
    });

    it('should init with place finder and map hidden', function () {
        cfg.homepage.showPlaceQuery = false;
        //cfg.settings.data.display.showMap = false;  // TODO does pageElements control the home page?
        cfg.settings.data.pageElements.showMap = false;

        initController();

        expect($scope.searchInputClass).toEqual('col-xs-12');
        expect($scope.showSpatialInput).toBeFalsy();

        delete cfg.homepage.showPlaceQuery; //reset to default
    });

    it('should showAll', function () {
        initController();

        $scope.search = {query:'text', location:'place'};

        $scope.selectedMapType = 'Place';

        $location.search().disp = 'disp';
        $location.search()['place.id'] = 'placeId';

        $scope.showAll();

        $http.expectJSONP(new RegExp('ssearch')).respond({response:{docs:[]}}); // get default saved search
        $http.flush();
    });
});