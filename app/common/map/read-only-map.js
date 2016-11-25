/*global angular, $, _, L, Wkt */

angular.module('voyager.map')
    .directive('vsReadOnlyMap', function (mapUtil, baseMapService, $timeout, searchService) {
        'use strict';

        function _isGeometry($scope) {
            return $scope.param.type && $scope.param.type === "Geometry";
        }

        function _applyWkt($scope, map) {
            var wktObj = mapUtil.getWkt($scope.param.wkt);
            if (_isGeometry($scope)) {
                wktObj.addTo(map); // Add it to the map
            }
            $timeout(function () {  //workaround for leaflet bug:  https://github.com/Leaflet/Leaflet/issues/2021
                mapUtil.moveMapTo(wktObj, map);
            }, 200);
        }

        function _applyBbox($scope, bbox, map) {
            if(_isGeometry($scope)) {
                mapUtil.drawBBox(map,bbox,false);
                $timeout(function () {  //workaround for leaflet bug:  https://github.com/Leaflet/Leaflet/issues/2021
                    mapUtil.fitToBBox(map,bbox);
                }, 200);
            } else {
                mapUtil.fitToBBox(map,bbox);
            }
        }

        return {
            compile: function(element) {
                element.append('<leaflet id="read-only-map" style="height: 100%" defaults="defaults" layers="layers"></leaflet>');
            },
            controller: function ($scope, leafletData) {

                var config = $.extend({}, baseMapService.getDefaultConfig()); //copy config so it doesn't get modified
                //config.zoomControl = false;

                $scope.defaults = config;
                $scope.layers = baseMapService.getLayers();

                if($scope.param.wkt) {
                    leafletData.getMap("read-only-map").then(function (map) {
                        _applyWkt($scope, map);
                    });
                } else if ($scope.param.extent) {
                    leafletData.getMap("read-only-map").then(function (map) {
                        _applyBbox($scope, $scope.param.extent, map);
                    });
                }
                //TODO: this doesn't make sense in the cart there are no search results there are individual items
//                } else if ($scope.param && $scope.param.initWithResultsExtent === true && searchService.hasResults() && !_.isUndefined(searchService.getBbox())) {
//                    leafletData.getMap("read-only-map").then(function (map) {
//                        _applyBbox($scope, searchService.getBbox(), map);
//                    });
//                }

                $scope.$on("$destroy",function() {
                    leafletData.unresolveMap("read-only-map");
                });

                $timeout(function () {  //workaround for leaflet bug:  https://github.com/Leaflet/Leaflet/issues/2021
                    leafletData.getMap('read-only-map').then(function (map) {
                        map.invalidateSize();  //workaround when initially hidden
//                map.fitBounds(map.moveToLater);  //workaround when can't fit when hidden
//                map.moveToLater = null;
                    });
                }, 200);

                //needed?  wkt should always be set at this point.

//                $scope.$on("searchResults", function (scope, args) {
//                    //if($scope.param && $scope.param.initWithResultsExtent === true) {
//                        leafletData.getMap("read-only-map").then(function (map) {
//                            if($scope.param.wkt) {
//                                _applyWkt($scope, map);
//                            } else {
//                                var bbox = args['extent.bbox'];
//                                if (!_.isUndefined(bbox)) {
//                                    _applyBbox($scope, bbox, map);
//                                }
//                            }
//                        });
//                    //}
//                });

            }
        };
    });