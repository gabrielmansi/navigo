/*global angular, $, L */

angular.module('voyager.details')
    .directive('vsDetailsMap', function ($compile, config, mapUtil, baseMapService, mapControls, $timeout) {
        'use strict';

        //var extent = $.extend({}, config.mapDefault); //copy mapDefault so it doesn't get modified
        var geoLayer;

        return {
            compile: function(element) {
                element.append('<leaflet style="height: 100%" defaults="defaults" controls="controls" layers="layers" id="details-map"></leaflet>');
            },
            link: function () {
                geoLayer = null;
            },
            controller: function ($scope, leafletData) {
                if($scope.doc.isMappable) {

                } else if ($scope.doc.geo) {
                    var geo = $scope.doc.geo;
                    leafletData.getMap('details-map').then(function (map) {
                        $timeout(function() {
                            map.invalidateSize(false);  //workaround when initially hidden
                            //TODO if we can map it do it by default
                            var geoType = angular.isDefined(geo.type) ? geo.type.toLowerCase() : '';
                            var checkArea = geoType.indexOf('point') === -1;  // don't check area of a Point/MultiPoint
                            geoLayer = mapUtil.drawGeoJson(map, geo, true, undefined, checkArea);
                        });

                        map.on('layeradd', function () {
                            // dynamic basemaps produce image layers which overlap drawing and jeojson - force image layers behind
                            if(!config.map.config.cached) {
                                $('.leaflet-image-layer').css('z-index','-1');
                            }
                        });
                    });
                }

                $scope.defaults = baseMapService.getDefaultConfig();
                $scope.layers = baseMapService.getLayers();

                var spinControl = L.control();
                spinControl.setPosition('topright');
                spinControl.onAdd = function () {

                    var template = '<div class="leaflet-bar leaflet-draw-toolbar">';
                    template += '<span us-spinner="{top:\'-25px\',left:\'-5px\',radius:4, width:3, length: 5}" spinner-key="map-spinner"></span>';
                    template += '</div>';

                    return $compile($(template))($scope)[0];
                };

                $scope.controls = {
                    custom: [spinControl]
                };

                mapControls.init($scope, 'details-map');
                if(geoLayer) {
                    mapControls.setBounds(geoLayer.getBounds());
                }
                $scope.controls.custom.push(mapControls.getZoomControls($scope).setPosition('bottomleft'));
            }
        };
    });