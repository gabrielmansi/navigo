/*global angular, $, _, L, Wkt */

angular.module('voyager.map')
    .directive('vsViewMap', function (config, mapUtil, baseMapService, searchService, $timeout) {
        'use strict';

        var extent = $.extend({}, config.mapDefault); //copy mapDefault so it doesn't get modified
        var zoomLayer;

        function _setParam($scope, map) {
            if ($scope.param) {
                mapUtil.setExtent(map, $scope.param);
            }
        }

        return {
            compile: function (element) {
                element.append('<leaflet id="view-map" style="height: 100%" defaults="defaults" layers="layers" controls="controls"></leaflet>');
            },
            controller: function ($scope, leafletData, mapControls) {

                mapControls.init($scope, 'view-map');

                $scope.defaults = $.extend({zoomControl: false}, baseMapService.getDefaultConfig());
                $scope.layers = baseMapService.getLayers();

                $scope.controls = {
                    custom: [mapControls.getZoomControls($scope)]
                };

                leafletData.getMap("view-map").then(function (map) {
                    _setParam($scope, map);

                    map.on("draw:drawstop", function (e) {
                        map.fitBounds(zoomLayer.getBounds());
                    });

                    map.on('draw:created', function (e) {
                        zoomLayer = e.layer;
                    });

                    map.on("moveend", function (e) {
                        _setParam($scope, e.target);
                        mapControls.toggleState(map, $scope);
                    });
                });

                $scope.$on("$destroy", function () {
                    leafletData.unresolveMap("view-map");
                });
            }
        };
    });