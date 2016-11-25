/*global angular, _, L, $ */
// this controller wraps the search map directive - TODO: refactor - its confusing since the direcive has its own controller method
angular.module('voyager.search')
    .controller('SearchMapCtrl', function ($scope, filterService, $location, localStorageService, searchService, $stateParams, mapUtil, usSpinnerService,
                                           $compile, $timeout, dialogs, config, leafletData, $analytics, mapServiceFactory, baseMapService, inView,
                                           heatmapService, configService, searchViewService) {

        'use strict';
        var _points;
        var _searchBoundary;
        var _searchBoundaryLayer;
        var _resultsBoundary;
        var _heatmapLayer;
        var loaded = false;
        var layersControl = null;
        var layers = {};
        var addedLayer = false;
        var _geoGroup;
        var _cancelledDraw = false;
        var _geoHighlightLayer;
        var _docs;
        var _baselayers;

        $scope.hasMapError = config.hasMapError;
        $scope.$on('drawingTypeChanged', function(event, args){
            $scope.selectedDrawingType = args;
        });

        $scope.selectedDrawingType = ($location.search())['place.op'] === 'intersects' ? 'Intersects' : 'Within';

        function _setCurrentView(local) {
            var point = $scope.map.getCenter();
            var vw = point.lng + ' ' + point.lat + ' ' + $scope.map.getZoom();
            if(angular.isUndefined(local)) {
                searchService.setMapView(vw);
            }
            searchViewService.setUserView({lat: point.lat, lng: point.lng, zoom: $scope.map.getZoom()});
            return vw;
        }

        leafletData.getMap('search-map').then(function(map) {
            $scope.map = map;

            map.on('moveend', function() {
                _setCurrentView(true);
            });

        });

        function _compileLayersControl() {
            var elem = $('.leaflet-control-layers-overlays');
            $compile(elem.contents())($scope);
            var mapSizeClass = $scope.view === 'table' ? 'leaflet-bottom-search' : '';
            $('.leaflet-control-layers .leaflet-control-layers-toggle').addClass('icon-map_layers').parents('.leaflet-right').removeClass('leaflet-top').addClass('leaflet-bottom ' + mapSizeClass);
        }

        $scope.removeLayer = function (layerName) {
            if (layersControl !== null && angular.isDefined(layers[layerName])) {
                var layer = layers[layerName];
                delete layers[layerName];
                layersControl.removeLayer(layer);
                $scope.map.removeLayer(layer);

                if(layerName === 'Place') {
                    $location.search('place', null);
                    $location.search('place.op', null);
                    $location.search('place.id', null);
                    $scope.$emit('removeFilterEvent', {isBbox:true});  //fire filter event
                }
                if (_.isEmpty(layers)) {
                    $scope.map.removeControl(layersControl);
                    layersControl = null;
                    delete $scope.map.currentBounds;
                } else {
                    //recompile after dom change
                    _compileLayersControl();
                }
            }
        };

        // hack to enable layers control to be toggleable by
        // click, first extend it and disable the default behaviour
        function _addClickToggleLayersControl(map) {
            var LayersControl = L.Control.Layers.extend({
                _expand: function() {
                },
                _collapse: function() {
                }
            });
            layersControl = new LayersControl(null, null, {
                collapsed: true
            }).addTo(map);

            $timeout(function() { // wait for scope to digest and render layers control before adding click events
                $('.leaflet-control-layers-toggle').click(function(e) {
                    $('.leaflet-control-layers').toggleClass('leaflet-control-layers-expanded');
                    e.preventDefault();
                });


                $('.leaflet-control-layers-list').click(function(e) {
                    var tagClicked = e.target.tagName;
                    if(tagClicked !== 'INPUT' && tagClicked !== 'SPAN') { // don't remove for checkbox or label click
                        e.preventDefault(); // stop the checkbox from getting set by leaflet
                        $('.leaflet-control-layers').removeClass('leaflet-control-layers-expanded');
                    }
                });
                $('.leaflet-control-layers-list').mouseleave(function(e) {
                    e.preventDefault();
                    $('.leaflet-control-layers').removeClass('leaflet-control-layers-expanded');
                });
            });
        }

        function _refreshMap(baselayerType) {
            var center = $scope.map.getCenter();
            $scope.map.options.crs = baseMapService.getCRSForLayerType(baselayerType);
            $scope.map.setView(center);
            $scope.map._resetView($scope.map.getCenter(), $scope.map.getZoom(), true);
        }

        function _addToLayerControl(layer, map, mapInfo, permanent) {
            addedLayer = true;
            layers[mapInfo.mapKey] = layer;
            if (layersControl === null) {
                _addClickToggleLayersControl(map);
            }

            var template = '<a class="btn btn-xs" style="cursor: pointer;" ng-click="removeLayer(\'' + mapInfo.mapKey + '\')">X</a>';
            if(permanent) {
                template = '';
            }

            if (!_.isEmpty(mapInfo.extra)) {
                template += ' ' + mapInfo.extra;
            }
            layersControl.addOverlay(layer, mapInfo.mapKey + template);
            $timeout(function() {  //wait for scope to digest so control is added to leaflet
                _compileLayersControl();
            });
        }

        function _removeSearchBoundary() {
            if(layersControl) {
                delete layers.Place;
                layersControl.removeLayer(_searchBoundaryLayer);
            }
            $scope.map.removeLayer(_searchBoundaryLayer);
            _searchBoundaryLayer = null;
            if (_.isEmpty(layers) && layersControl) {
                $scope.map.removeControl(layersControl);
                layersControl = null;
                delete $scope.map.currentBounds;
            } else if(layersControl) {
                //recompile after dom change
                _compileLayersControl();
            }
            $scope.map.currentBounds = null;
        }

        function _getDefaultExtent(params) {
            //copy mapDefault so it doesn't get modified
            var extent = $.extend({}, configService.getDefaultMapView());
            if (params.vw) {  //use query string if on url
                extent = configService.parseMapViewString(params.vw, ' ');
            }
            return extent;
        }

        $scope.$on('clearBbox', function () {
            if(_searchBoundaryLayer) {
                _removeSearchBoundary();
            }
        });

        $scope.$on('addToMap', function () {
            if (angular.isDefined(layers[$scope.mapInfo.name])) {
                return;
            }
            usSpinnerService.spin('map-spinner');
            $scope.addToMap();
        });

        function _addGeoJson(docs) {
            if(_geoGroup) {
                $scope.map.removeLayer(_geoGroup);
                _geoGroup = null;
            }
            var boxes = [];
            _.each(docs, function(doc) {
                if (angular.isDefined(doc.geo)) {
                    boxes.push(mapUtil.getGeoJson(doc.geo));
                }
            });
            if(boxes.length > 0) {
                _geoGroup = L.featureGroup(boxes);
                _geoGroup.vgCount = boxes.length;
                $scope.map.addLayer(_geoGroup);
            }
        }

        inView.setViewObserver(_addGeoJson);

        function _moveToDefaultExtent() {
            var defaultExtent = _getDefaultExtent($stateParams);
            $scope.map.setView([defaultExtent.lat, defaultExtent.lng], defaultExtent.zoom);
        }

        $scope.$on('searchResults', function (event, results) {
            if (results.scrolled === true) {  //ignore when scrolling
                return;
            }

            if(results.placefinder && results.placefinder.match) {
                if (_searchBoundaryLayer) {
                    _removeSearchBoundary();
                }
                var place = results.placefinder.match;
                _searchBoundary = place.extent.join(' ');
                _searchBoundaryLayer = mapUtil.drawGeoJson($scope.map, place.geo, true, results.placefinder.search.op, false);
                _addToLayerControl(_searchBoundaryLayer, $scope.map, {mapKey:'Place'});
            } else if(_searchBoundaryLayer) {  //if no place remove the search boundary layer
                _removeSearchBoundary();
                if (angular.isDefined(results['extent.bbox'])) {
                    _resultsBoundary = results['extent.bbox'];
                    mapUtil.fitToBBox($scope.map, _resultsBoundary);
                } else {
                    _moveToDefaultExtent();
                }
            } else if (searchViewService.viewChanged()) {
                // don't move the map if only changing views
            } else if (angular.isDefined(results['extent.bbox'])) {
                _resultsBoundary = results['extent.bbox'];
                mapUtil.fitToBBox($scope.map, _resultsBoundary);
            } else {
                _searchBoundary = null;
                _resultsBoundary = null;
                _moveToDefaultExtent();
            }

            //TODO only show what is in the viewport?
            _docs = results.response.docs;
            _addGeoJson(results.response.docs);
        });

        function _showError(error) {
            var message = null;
            if(angular.isDefined(error.details)) {
                message = error.details[0];
            }
            dialogs.error(error.message, message);
        }

        $scope.addToMap = function () {
            addedLayer = true;

            $scope.map.invalidateSize(false);  //workaround when initially hidden

            var mapService = mapServiceFactory.getMapService($scope.mapInfo);
            mapService.addToMap($scope.mapInfo, $scope.map).then(function (layer) {
                $scope.mapInfo.mapKey = $scope.mapInfo.name.replace(/'/g, '');
                if (layer.isValid !== false) {
                    loaded = false;
                    layer.on('loading', function () {
                        if(loaded === false) {
                            usSpinnerService.spin('map-spinner');
                        }
                    });
                    _addToLayerControl(layer, $scope.map, $scope.mapInfo);
                    usSpinnerService.stop('map-spinner');
                    layer.on('load', function () {
                        loaded = true;
                        usSpinnerService.stop('map-spinner');
                    });
                    $analytics.eventTrack('addToMap', {
                        category: 'results', label: $scope.mapInfo.format // jshint ignore:line
                    });
                } else {
                    usSpinnerService.stop('map-spinner');
                    $analytics.eventTrack('addToMap', {
                        category: 'error', label: $scope.mapInfo.format // jshint ignore:line
                    });
                    _showError(layer.error);
                }
            }, function (error) {
                usSpinnerService.stop('map-spinner');
                $analytics.eventTrack('addToMap', {
                    category: 'error', label: $scope.mapInfo.format // jshint ignore:line
                });
                _showError(error.error);
            });
        };

        // TODO - why not use leafletData.getMap?
        $scope.$watch('map',function(old) {  //fires when map is created in directive

            if(angular.isUndefined(old)) {
                return;
            }

            $scope.map.on('overlayadd', function (e) {
                //html is added dynamically by leaflet so need to compile it here
                _compileLayersControl();
                e.target.fitBounds(e.layer.bounds);
            });

            $scope.map.on('layeradd', function () {
                if (addedLayer) {
                    addedLayer = false;
                    //html is added dynamically by leaflet so need to compile it here
                    _compileLayersControl();
                }
            });

            $scope.map.on('draw:drawstart', function () {
//                if (_searchBoundaryLayer) {  //remove existing
//                    $scope.map.removeLayer(_searchBoundaryLayer);
//                    _searchBoundaryLayer = null;
//                }
                _cancelledDraw = false;
            });

            $scope.map.on('draw:drawstop', function () {
                $timeout(function() {  //wait for scope digest
                    if (!_cancelledDraw) {
                        if (_searchBoundaryLayer) {  //remove existing
                            _removeSearchBoundary();
                        }

                        //update url params
                        $location.search('place', $scope._bbox);
                        var placeType = $scope.selectedDrawingType.toLowerCase();
                        $location.search('place.op', placeType);
                        var vw = _setCurrentView();
                        $location.search('vw', vw);
                        //search controller will capture this event and fire a search
                        $scope.$emit('bboxChangeEvent', {'bbox': $scope._bbox, 'bboxt': placeType, 'vw': vw, 'place':$scope._bbox, 'place.op':placeType});
                    }
                });

            });

            $scope.map.on('baselayerchange', function(e) {
                localStorageService.set(baseMapService.BASELAYER_STORAGE_NAME, e.name);
                if(_baselayers) {
                    _refreshMap(_baselayers[e.name].type);
                }
            });

            $scope.$on('cancelledDraw', function() {
                _cancelledDraw = true;
            });

            $scope.map.on('draw:created', function (e) {
                _cancelledDraw = false;
                if ($scope.toolType === 'point') {
                    _points = e.layer.getLatLng();
                    _searchBoundary = e.layer.getLatLng();
                }
                else {
                    _points = e.layer.getLatLngs();
                    _searchBoundary = e.layer.getBounds().toBBoxString();
                }
            });

            //@TODO: add search on map move feature
            // $scope.map.on('dragend', function (e){
            //     if ($scope.moveMapOption.value) {
            //         $scope.$emit('searchEvent', {});
            //     }
            // });

            $scope.$on('resultHover', function(evt, data) {
                if (!_geoHighlightLayer) {
                    _geoHighlightLayer = L.geoJson(null, {
                        style: {
                            color: '#e6e600',
                            weight: 6,
                            fill: true
                        },
                        pointToLayer: function(f, ll) {
                            return L.circleMarker(ll, {
                                radius: 6,
                                color: '#e6e600',
                                fillOpacity: 0.65
                            });
                        }
                    }).addTo($scope.map);
                }

                if (data.doc && data.doc.geo) {
                    try {
                        _geoHighlightLayer.addData(data.doc.geo);
                    } catch(err) {
                        console.log('WARNING: failed adding geojson layer to search map');
                    }
                }
                else {
                    _geoHighlightLayer.clearLayers();
                }
            });

            // set up the heatmap layer, but first check there is actual data to
            // render (ie. the geo field is configured and populated)
            $scope.heatmapOpts = {opacity: config.searchMap.heatmapOpacity*100.0};
            $scope.$watch('heatmapOpts.opacity', function(newVal) {
                if (angular.isDefined(newVal) && angular.isDefined(_heatmapLayer)) {
                    heatmapService.opacity(newVal/100.0);
                    _heatmapLayer.render();
                }
            });
            $scope.heatmapOpacityClick = function(e) {
                e.preventDefault();
                e.stopPropagation();
            };
            heatmapService.fetch('-180,-90,180,90', 1).then(function(hm) {
                if (!_.isEmpty(hm.counts_ints2D)) {
                    _heatmapLayer = heatmapService.init($scope.map);
                    _addToLayerControl(_heatmapLayer, $scope.map, {
                            mapKey: 'Heatmap',
                            extra: '<slider floor="0" ceiling="100" step="1" ng-model="heatmapOpts.opacity" class="heatmap-opacity-control" ng-click="heatmapOpacityClick($event)"></slider>'
                        }, true);
                }
            });

            baseMapService.getBaselayers().then(function(baselayers) {

                _baselayers = baselayers;

                if(layersControl === null) {
                    _addClickToggleLayersControl($scope.map);
                }

                if(baselayers) {
                    var defaultBaselayer;
                    var defaultBaselayer_Type;
                    var selectedBaselayer;
                    var selectedBaselayer_Type;
                    var selectedBaselayer_Name = localStorageService.get(baseMapService.BASELAYER_STORAGE_NAME);

                    $.each(baselayers, function(index, layerInfo) {
                        var layer;

                        layerInfo.options.crs = baseMapService.getCRSForLayerType(layerInfo.type);

                        switch(layerInfo.type) {
                            case 'wms':
                                layer = new L.TileLayer.WMS(layerInfo.url, layerInfo.options);
                                break;
                            default:
                                if(layerInfo.cached) {
                                    layer = new L.TileLayer(layerInfo.url);
                                } else {
                                    layerInfo.options.url = layerInfo.url;
                                    layer = L.esri.dynamicMapLayer(layerInfo.options);
                                }
                        }

                        layersControl.addBaseLayer(layer, layerInfo.name);

                        if(layerInfo.name === selectedBaselayer_Name) {
                            selectedBaselayer = layer;
                            selectedBaselayer_Type = layerInfo.type;
                        }

                        if(layerInfo.default) {
                            defaultBaselayer = layer;
                            defaultBaselayer_Type = layerInfo.type;
                        }
                    });

                    if(selectedBaselayer) {
                        selectedBaselayer.addTo($scope.map);
                        _refreshMap(selectedBaselayer_Type);
                    } else if(defaultBaselayer) {
                        defaultBaselayer.addTo($scope.map);
                        _refreshMap(defaultBaselayer_Type);
                    }
                }

                $timeout(function() {  //wait for scope to digest so control is added to leaflet
                    _compileLayersControl();
                });
            });
        });

        $scope.$on('filterChanged', function() {
            var params = _.pick($location.search(), function(val, key) {
                return 'q' === key || 'fq' === key || key.indexOf('place') === 0;
            });
            heatmapService.filter(params);

        });

        $scope.$on('renderHeatmapStarting', function() {
            $('.leaflet-control-layers-list').unbind('mouseleave');
        });

        $scope.$on('renderHeatmapEnding', function() {
            $timeout(function() {
                $('.leaflet-control-layers-list').mouseleave(function (e) {
                    e.preventDefault();
                    $('.leaflet-control-layers').removeClass('leaflet-control-layers-expanded');
                });
            }, 300);
        });

    });