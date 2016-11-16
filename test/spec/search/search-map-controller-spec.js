'use strict';

describe('Controller: SearchMapCtrl', function () {

    var $scope, $timeout, usSpinnerService, $location, $http, $controller, q, leafletData, mapServiceFactory, baseMapService, mapUtil;
    var cfg = _.clone(config);

    beforeEach(function () {
        module('voyager.search');
        module('voyager.results');
        module('voyager.config');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });

        inject(function (_$controller_, _$timeout_, _usSpinnerService_, _$location_, $httpBackend , $rootScope, _$q_, _leafletData_, _mapServiceFactory_, _baseMapService_, _mapUtil_) {
            $scope = $rootScope.$new();
            $timeout = _$timeout_;
            usSpinnerService = _usSpinnerService_;
            $location = _$location_;
            $http = $httpBackend;
            $controller = _$controller_;
            q = _$q_;
            leafletData = _leafletData_;
            mapServiceFactory = _mapServiceFactory_;
            baseMapService = _baseMapService_;
            mapUtil = _mapUtil_;
        });

    });

    // Specs here

    function initController() {
        $controller('SearchMapCtrl', {$scope: $scope});
    }

    it('should init', function () {
        initController();
    });

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
            e.layer.getLatLngs = function() {
                return [[0,0],[0,0]];
            };
            e.target = {};
            e.target.fitBounds = function() {

            };
            if (callback) {
                callback(e);
            }
        };
        return map;
    }

    L.CanvasLayer = L.Class.extend({
        getCanvas: function() {
            return {
                getContext: function() {
                    return {
                        clearRect: function() {

                        }
                    };
                }
            };
        }
    });

    L.Control.Layers = function() {
        return {
            addTo: function() {
                return this;
            },
            addOverlay: function() {

            },
            removeLayer: function() {

            },
            addBaseLayer: function() {

            }
        };
    };
    L.Control.Layers.extend = function(obj) {
        return $.extend(this, obj);
    };

    it('should handle search event', function () {

        var map = getMapMock();
        spyOn(leafletData, 'getMap').and.callFake(function() {
            return q.when(map);
        });

        $controller('SearchMapCtrl', {$scope: $scope});

        //$http.expectGET(new RegExp('auth')).respond({}); // auth call
        var geoHash = {
            geohash: ['gridLevel', 3, 'columns', 162, 'rows', 105, 'minX', -180, 'maxX', 47.8125, 'minY', -90, 'maxY', 57.65625, 'counts_ints2D', [[36449, 42205]]]
        };

        $http.expectGET(new RegExp('heatmap')).respond({facet_counts:{facet_heatmaps:geoHash}}); // heatmap call
        $http.expectGET(new RegExp('maps')).respond({});

        $http.flush();

        $timeout.flush();

        $scope.$emit('searchResults', {response:{docs:[]}});

        //expect($scope.search.place).toEqual('0.00 0.00 0.00 0.00');
    });

    it('should add and remove layer', function () {

        var map = getMapMock();

        var layer = {
            layer:map,
            bounds:'0 0 0 0',
            on: map.on
        };

        var mapService = function() {};
        mapService.addToMap = function() {
            return {
                then: function(func) {
                    func(layer);
                }
            };
        };

        spyOn(mapServiceFactory,'getMapService').and.callFake(function() {
            return mapService;
        });


        spyOn(leafletData, 'getMap').and.callFake(function() {
            return q.when(map);
        });

        spyOn(map,'removeLayer').and.callThrough();
        spyOn(map,'removeControl').and.callThrough();

        $location.search().place = 'place';

        $controller('SearchMapCtrl', {$scope: $scope, mapServiceFactory: mapServiceFactory});

        //$http.expectGET(new RegExp('auth')).respond({}); // auth call

        $http.expectGET(new RegExp('heatmap')).respond({facet_counts:{facet_heatmaps:{}}}); // heatmap call
        $http.expectGET(new RegExp('maps')).respond({});

        $http.flush();

        $timeout.flush();

        $scope.mapInfo = {path:'path',format:'application/x-arcgis-map-server', bbox: '0 0 0 0', name:'name', mapKey:'mapKey'};
        $scope.$emit('addToMap');

        $scope.removeLayer($scope.mapInfo.name);

        expect(map.removeLayer).toHaveBeenCalled();
        expect(map.removeControl).toHaveBeenCalled();

        $scope.mapInfo = {path:'path',format:'application/x-arcgis-map-server', bbox: '0 0 0 0', name:'Place', mapKey:'mapKey'};
        $scope.$emit('addToMap');

        $scope.removeLayer($scope.mapInfo.name);

        expect($location.search().place).toBeUndefined();

    });

    it('should handle search event with place', function () {

        var map = getMapMock();
        spyOn(leafletData, 'getMap').and.callFake(function() {
            return q.when(map);
        });

        $controller('SearchMapCtrl', {$scope: $scope});

        //$http.expectGET(new RegExp('auth')).respond({}); // auth call

        $http.expectGET(new RegExp('heatmap')).respond({facet_counts:{facet_heatmaps:[]}}); // heatmap call
        $http.expectGET(new RegExp('maps')).respond({});

        $http.flush();

        $timeout.flush();

        var geo = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [0, 0]
            }
        };

        var place = {
            match: {extent: [0, 0, 0, 0],geo:geo},
            search: {op: 'within'},
            geo:geo
        };

        $scope.$emit('searchResults', {response:{docs:[{id:'id', geo:geo}]}, placefinder: place});

        //expect($scope.search.place).toEqual('0.00 0.00 0.00 0.00');
    });

    it('should handle search event with extent.bbox', function () {

        var map = getMapMock();
        spyOn(leafletData, 'getMap').and.callFake(function() {
            return q.when(map);
        });

        spyOn(mapUtil,'fitToBBox').and.callThrough();

        $controller('SearchMapCtrl', {$scope: $scope});

        //$http.expectGET(new RegExp('auth')).respond({}); // auth call

        $http.expectGET(new RegExp('heatmap')).respond({facet_counts:{facet_heatmaps:[]}}); // heatmap call
        $http.expectGET(new RegExp('maps')).respond({});

        $http.flush();

        $timeout.flush();

        var geo = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [0, 0]
            }
        };

        $scope.$emit('searchResults', {response:{docs:[{id:'id', geo:geo}]},'extent.bbox':'0 0 0 0'});

        expect(mapUtil.fitToBBox).toHaveBeenCalledWith(map,'0 0 0 0');

        //expect($scope.search.place).toEqual('0.00 0.00 0.00 0.00');
    });

    it('should process baselayers', function () {

        var mapsResponse = {
            'wms': [
                {
                    'name': 'OSGeo Basic WMS',
                    'url': 'http://vmap0.tiles.osgeo.org/wms/vmap0',
                    'layers': 'basic',
                    'defaultView': '-98, 40.5, 3'
                }
            ],
            'mapbox': [
                {
                    'name': 'Mapbox Streets',
                    'url': 'https://api.mapbox.com/v4/mapbox.streets/${z}/${x}/${y}.png?access_token=pk.eyJ1Ijoiam9obi1hdGtpbnNvbi1vY2kiLCJhIjoiY2l2aTN3azF1MDFjNjJ1bHY3aXRqbHd4cSJ9.c1weU_V4nYIP8rZlFf1wpQ',
                    'layers': 'basic',
                    'defaultView': '-98, 40.5, 3'
                }
            ],
            'ags': [
                {
                    'name': 'ESRI Street Map',
                    'url': 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/',
                    'cached': true,
                    'selected': true,
                    'defaultView': '-98, 40.5, 3'
                }
            ],
            'bing': [
                {
                    'name': 'Bing Map',
                    'url': 'http://www.bing.com/mapspreview/',
                    'defaultView': '-98, 40.5, 3'
                }
            ],
            'google': [
                {
                    'name': 'Google Map',
                    'url': 'http://www.google.com/maps/',
                    'defaultView': '-98, 40.5, 3'
                }
            ]
        };


        var map = getMapMock();
        spyOn(leafletData, 'getMap').and.callFake(function() {
            return q.when(map);
        });

        $controller('SearchMapCtrl', {$scope: $scope});

        //$http.expectGET(new RegExp('auth')).respond({}); // auth call

        $http.expectGET(new RegExp('heatmap')).respond({facet_counts:{facet_heatmaps:[]}}); // heatmap call
        $http.expectGET(new RegExp('maps')).respond(mapsResponse);

        $http.flush();

        $timeout.flush();

        baseMapService.getBaselayers().then(function(data) {
            expect(data.length).toBe(5);
            expect(baseMapService.getDefaultBaselayer()).toBeDefined();
            expect(baseMapService.getDefaultBaselayer().name).toBe(mapsResponse.ags[0].name);
        });

        $scope.$digest();
    });

});