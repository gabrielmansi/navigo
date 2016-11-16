/*global angular, $, _, L, Wkt */

angular.module('voyager.map')
    .directive('vsClipMap', function (config, mapUtil, baseMapService, searchService, $timeout) {
        'use strict';

        var extent = $.extend({}, config.mapDefault); //copy mapDefault so it doesn't get modified
        var bbox;
        var layer;

        function _applyWkt($scope, map) {
            var wktObj = mapUtil.getWkt($scope.param.wkt);
            var layer = wktObj.addTo(map); // Add it to the map
            $timeout(function () {  //workaround for leaflet bug:  https://github.com/Leaflet/Leaflet/issues/2021
                mapUtil.moveMapTo(wktObj, map);
            }, 200);
            return layer;
        }

        function _updateScope(layer, $scope, digest) {
            var wkt = new Wkt.Wkt(layer);

            $scope.$parent.wkt = wkt.write();
            $scope.$parent.hasError = false;
            if(digest) {
                $scope.$parent.$digest();  //this works but should use $apply?
            }

            if ($scope.param) {  //used in task launcher
                $scope.param.wkt = $scope.$parent.wkt;
            }
        }

        return {
            compile: function (element) {
                element.append('<leaflet id="clip-map" defaults="defaults" layers="layers" controls="controls"></leaflet>');
            },
            controller: function ($scope, leafletData, mapControls) {

                mapControls.init($scope, 'clip-map');

                $scope.defaults = $.extend({zoomControl:false}, baseMapService.getDefaultConfig());
                $scope.layers = baseMapService.getLayers();

                var withPolygon = $scope.param && $scope.param.extentParam !== true;
                $scope.controls = {
                    custom: [mapControls.getZoomControls($scope),mapControls.getClipControls(withPolygon, $scope)]
                };

                leafletData.getMap("clip-map").then(function (map) {

                    map.on("draw:drawstart", function (e) {
                        if (layer) {  //remove existing
                            map.removeLayer(layer);
                            layer = null;
                        }
                    });

                    map.on("draw:drawstop", function (e) {
                        map.addLayer(layer);
                        _updateScope(layer, $scope, true);
                    });

                    map.on('draw:created', function (e) {
                        layer = e.layer;
                    });

                    map.on("moveend", function (e) {
                        mapControls.toggleState(map,$scope);
                    });

                    if ($scope.param && $scope.param.resultsExtent) {
                        // initialize clip shape on the map from the results
                        // extent
                        layer = mapUtil.getRectangle($scope.param.resultsExtent);
                        layer.options.fill = false;
                        layer.options.fillColor = '#f06eaa';
                        layer.addTo(map);

                        _updateScope(layer, $scope, false);
                    }
                });

                if ($scope.param && $scope.param.reload === true && $scope.param.wkt) {
                    leafletData.getMap("clip-map").then(function (map) {
                        layer = _applyWkt($scope, map);
                        _updateScope(layer, $scope);
                    });
                }

                $scope.$on("$destroy", function () {
                    leafletData.unresolveMap("clip-map");
                });
            }
        };
    });