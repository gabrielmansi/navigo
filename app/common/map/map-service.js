/*global angular, $, _, alert, L */

angular.module('voyager.map').
    factory('mapService', function (config, converter, $http, $q, $timeout) {
        'use strict';

        var loaded = true;
        var mappable = {'application/x-arcgis-image-server': true, 'application/x-arcgis-feature-server': true, 'application/x-arcgis-feature-server-layer': true, 'application/x-arcgis-map-server': true, 'application/x-arcgis-map-server-layer': true, 'application/vnd.ogc.wms_xml': true, 'application/vnd.ogc.wms_layer_xml': true};

        //todo: use var for baselayer/default baselayer cache and use localstorage to store user selection (check if user selection still exists)
        var _baselayers;
        var _defaultBaselayer = {
            name: 'arcgis',
            type: 'xyz',
            url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}/',
            layerOptions: {
                 showOnSelector: false
            }
        };


        function _createDynamicLayer(map, mapInfo, spatialReference) {
            var options = {url: mapInfo.root};
            if (mapInfo.isLayer) {
                options.layers = [mapInfo.layer];
            }
            var layer = L.esri.dynamicMapLayer(options);
            layer.addTo(map);

            if (spatialReference.wkid !== 102100 && spatialReference.wkid !== 102113) {
                //workaround for old servers that don't support leaflet's default projection
                layer.options.bboxSR = 102100;
                layer.options.imageSR = 102100;
                layer._update(); // private method but will be exposed in the next version.
            }
            return layer;
        }

        function _createTiledLayer(map, mapInfo, spatialReference) {
            var options = {url: mapInfo.root};
            if (mapInfo.isLayer) {
                options.layers = [mapInfo.layer];
            }
            var layer = L.esri.tiledMapLayer(options);
            layer.addTo(map);

//            if (spatialReference.wkid !== 102100) {
//                //workaround for old servers that don't support leaflet's default projection
//                layer.options.bboxSR = 102100;
//                layer.options.imageSR = 102100;
//                layer._update(); // private method but will be exposed in the next version.
//            }
            return layer;
        }

        function _createCustomTiledLayer(map, mapInfo, spatialReference) {

            var options = {url: mapInfo.root};
            if (mapInfo.isLayer) {
                options.layers = [mapInfo.layer];
            }
            var layer = L.esri.tiledMapLayer(options);
            layer.addTo(map);

//            if (spatialReference.wkid !== 102100) {
//                //workaround for old servers that don't support leaflet's default projection
//                layer.options.bboxSR = 102100;
//                layer.options.imageSR = 102100;
//                layer._update(); // private method but will be exposed in the next version.
//            }
            return layer;
        }

        function _createImageLayer(map, mapInfo, spatialReference) {
            var layer = new L.esri.imageMapLayer({url:mapInfo.path});
            map.addLayer(layer);
            return layer;
        }

        function _getSpatialReference(data) {
            var spatialReference = data.spatialReference;
            if (angular.isUndefined(spatialReference)) {
                spatialReference = data.extent.spatialReference;
            }
            return spatialReference;
        }

        function _getExtent(data) {
            var extent = data.initialExtent;
            if (angular.isUndefined(extent)) {
                extent = data.extent;
            }
            return extent;
        }

        function _moveToExtent(data, map, layer) {
            var extent = _getExtent(data);
            var spatialReference = _getSpatialReference(data);
            converter.toWebMercator(extent, spatialReference).then(function (bounds) {
                layer.bounds = bounds;
                map.fitBounds(bounds);
                map.currentBounds = bounds;
                //usSpinnerService.stop('map-spinner');
            });
        }

        function _getWmsExtent(data) {
            var extent = data.targetBoundingBox;
            var crs = extent.CRS;
            if (angular.isUndefined(crs)) {
                crs = extent.SRS; //TODO WMS service version?
            }
            if(extent.version === '1.1.1') { //axis is flipped in this version
                return {ymin:parseFloat(extent.minx), xmin:parseFloat(extent.miny), ymax:parseFloat(extent.maxx), xmax:parseFloat(extent.maxy), crs:crs.replace('EPSG:','')};
            } else {
                return {xmin:parseFloat(extent.minx), ymin:parseFloat(extent.miny), xmax:parseFloat(extent.maxx), ymax:parseFloat(extent.maxy), crs:crs.replace('EPSG:','')};
            }
        }

        function _moveToWmsExtent(data, map, layer) {
            if (angular.isDefined(data.geoBbox)) {
                var geoBox = data.geoBbox;
                //TODO this can change axis based on WMS version
                var bounds = [[geoBox.southBoundLatitude, geoBox.westBoundLongitude],[geoBox.northBoundLatitude, geoBox.eastBoundLongitude]];
                layer.bounds = bounds;
                map.fitBounds(bounds);
                map.currentBounds = bounds;
            } else {
                var extent = _getWmsExtent(data);
                var spatialReference = {wkid:parseInt(extent.crs)};
                converter.toLatLng(extent, spatialReference).then(function (bounds) {
                    layer.bounds = bounds;
                    map.fitBounds(bounds);
                    map.currentBounds = bounds;
                    //usSpinnerService.stop('map-spinner');
                });
            }
        }

        function _validate(data) {
            var validation = {'isValid': true};
            if (angular.isDefined(data.error)) {
                validation.isValid = false;
                validation.error = data.error;
            }
            return validation;
        }

        function _getError(e, name) {
            //alert(JSON.stringify(e));
            var details = e.statusText;
            if (details === 'abort') {
                details = "Timed out getting info for: " + name;
            }
            return {'message': 'Unable to add to map', 'details': [details]};
        }

        function _getMetadata(mapInfo, isFeature) {
            var deferred = $q.defer();
            var p = $.getJSON(mapInfo.path + "?f=json&callback=?", function (data) {
                var validation = _validate(data);
                if (validation.isValid) {
                    if (!mapInfo.isLayer || isFeature) {
                        deferred.resolve(data);
                    } else {
                        //get the root to determine if its a tiled layer
                        var rootInfo = {'path': mapInfo.root, 'isLayer': false, 'name': mapInfo.name};
                        _getMetadata(rootInfo, false).then(function (rootData) {
                            data.singleFusedMapCache = rootData.singleFusedMapCache;
                            deferred.resolve(data);
                        });
                    }
                } else {
                    deferred.reject(validation);
                }
            })
                .error(function (e) {
                    deferred.reject({'isValid': false, 'error': _getError(e, mapInfo.name)});
                });
            //force a timeout so the error handler is called. jsonp timeouts don't by default
            $timeout(function () {
                p.abort();
            }, 5000);

            return deferred.promise;
        }

        function _getWmsMetadata(mapInfo) {
            var deferred = $q.defer();
            var url = encodeURIComponent(mapInfo.path);
            var p = $.getJSON(config.proxy + ':callback=?', url, function (data) {
                var validation = _validate(data);
                if (validation.isValid) {
                    var root = 'WMS_Capabilities';
                    if(angular.isUndefined(data[root])) {
                        root = 'WMT_MS_Capabilities';  //TODO: because of version?
                    }
                    if (!mapInfo.isLayer) {
                        data.targetBoundingBox = data[root].Capability.Layer.BoundingBox;
                        data.geoBbox = data[root].Capability.Layer.EX_GeographicBoundingBox;
                        data.version = data[root].version;
                        if (data.version === '1.1.1') {
                            data.targetBoundingBox = data[root].Capability.Layer.LatLonBoundingBox;
                            data.targetBoundingBox.CRS = 'EPSG:4326';
                            data.targetBoundingBox.version = '1.1.1';
                        }
                        var layerNames = _.pluck(data[root].Capability.Layer.Layer, 'Name');
                        data.name = layerNames.join();
                        deferred.resolve(data);
                    } else {
                        var pathTokens = mapInfo.path.split('&'), param, layerName;
                        $.each(pathTokens, function(index, value) {
                            param = value.split('=');
                            if (param[0] === 'layer.name') {
                                layerName = param[1];
                            }
                        });
                        var layers = data[root].Capability.Layer.Layer;
                        var targetLayer = _.find(layers, { 'Name': layerName });
                        targetLayer.targetBoundingBox = targetLayer.BoundingBox;
                        data.geoBbox = data[root].Capability.Layer.EX_GeographicBoundingBox;
                        data.version = data[root].version;
                        if (data.version === '1.1.1') {
                            data.targetBoundingBox = data[root].Capability.Layer.LatLonBoundingBox;
                            data.targetBoundingBox.CRS = 'EPSG:4326';
                            data.targetBoundingBox.version = '1.1.1';
                        }
                        targetLayer.name = targetLayer.Name;
                        deferred.resolve(targetLayer);
                    }
                } else {
                    deferred.reject(validation);
                }
            })
                .error(function (e) {
                    deferred.reject({'isValid': false, 'error': _getError(e, mapInfo.name)});
                });
            //force a timeout so the error handler is called. jsonp timeouts don't by default
            $timeout(function () {
                p.abort();
            }, 5000);

            return deferred.promise;
        }

        function _addMapServerLayer(map, mapInfo) {
            var deferred = $q.defer();
            _getMetadata(mapInfo, false).then(function (data) {
                var spatialReference = _getSpatialReference(data);

                var layer;
                if (mapInfo.format.indexOf('application/x-arcgis-image-server') > -1) {
                    layer = _createImageLayer(map, mapInfo, spatialReference);
                } else {
                    if (data.singleFusedMapCache === true) {
                        if (spatialReference.wkid === 102100) {
                            layer = _createTiledLayer(map, mapInfo, spatialReference);
                        } else {
                            layer = _createDynamicLayer(map, mapInfo, spatialReference);
                        }
                    } else {
                        layer = _createDynamicLayer(map, mapInfo, spatialReference);
                    }
                }
                _moveToExtent(data, map, layer);
                deferred.resolve(layer);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function _addFeatureServiceLayer(map, mapInfo) {
            var deferred = $q.defer();
            _getMetadata(mapInfo, false).then(function (data) {
                //add each layer to map
                var layer = null;
                if (mapInfo.isLayer) {
                    layer = new L.esri.FeatureLayer({url:mapInfo.path}).addTo(map);
                } else {
                    $.each(data.layers, function (index, value) {
                        var url = mapInfo.path + "/" + value.id;
                        layer = new L.esri.FeatureLayer({url:url}).addTo(map);
                    });
                }
                //move to last layer TODO replace with zoom to extent like above
                layer.on('load', function () {  //wait until loaded until moving
                    if (!loaded) {
                        loaded = true;
                        layer.query().bounds(function (error, latlngbounds) {
                            layer.bounds = latlngbounds;
                            map.fitBounds(latlngbounds);
                            map.currentBounds = latlngbounds;
                            //usSpinnerService.stop('map-spinner');
                        });
                    }
                });
                deferred.resolve(layer);
            }, function (error) {
                deferred.reject(error);
            });
            return deferred.promise;
        }

        function _addWMSLayer(map, mapInfo) {

            var deferred = $q.defer();

            var urlInfo = mapInfo.path.split('?');

            _getWmsMetadata(mapInfo, false).then(function (data) {
                var layer = L.tileLayer.wms(urlInfo[0], {
                    layers: data.name,
                    format: 'image/png',
                    transparent: true
                });

                layer.on('load', function () {  //wait until loaded until moving
                    if (!loaded) {
                        loaded = true;
                        //usSpinnerService.stop('map-spinner');
                    }
                });

                layer.addTo(map);

                _moveToWmsExtent(data, map, layer);

                deferred.resolve(layer);
            });

            return deferred.promise;
        }

        function _fetchBaselayers() {
            var service = config.root + 'api/rest/display/maps';
            return $http.get(service).then(function(response) {
                return response.data;
            });
        }

        function _getBaselayers() {
            if (!_baselayers) {
                return _fetchBaselayers().then(function (data) {
                    _baselayers = _processBaselayerData(data);
                    return _baselayers;
                });
            } else {
                return $q.when(_baselayers);
            }
        }

        function _processBaselayerData(layerData) {
            var baselayers = [];

            if (layerData.ags) {
                baselayers = baselayers.concat(_processBaselayers(layerData.ags, 'ags'));
            }
            if (layerData.bing) {
                baselayers = baselayers.concat(_processBaselayers(layerData.bing, 'bing'));
            }
            if (layerData.google) {
                baselayers = baselayers.concat(_processBaselayers(layerData.google, 'google'));
            }
            if (layerData.mapbox) {
                baselayers = baselayers.concat(_processBaselayers(layerData.mapbox, 'mapbox'));
            }
            if (layerData.wms) {
                baselayers = baselayers.concat(_processBaselayers(layerData.wms, 'wms'));
            }

            return baselayers;
        }

        function _processBaselayers(layers, type) {
            var baselayers = [];

            $.each(layers, function (index, layer) {
                var layerType = type;
                var layerUrl = layer.url;
                var layerOptions = {
                    continuousWorld: false,
                    showOnSelector: true
                };
                var layerDefault = layer.selected || false;

                if(layerUrl) {
                    switch (type) {
                        case 'ags':
                            if (layer.cached === true) {
                                layerUrl += 'tile/{z}/{y}/{x}/';
                                layerType = 'xyz';
                            } else {
                                layerType = 'agsDynamic';
                            }
                            layerOptions.layers = layer.layers;
                            break;
                        case 'mapbox':
                            layerUrl = layerUrl.replace(/\$/g, '');  //remove $ needed for OL (classic) map
                            break;
                        case 'wms':
                            layerOptions.layers = layer.layers;
                            layerOptions.format = 'image/png';
                            layerOptions.transparent = true;
                            break;
                        default:
                            //fall-through for bing, google, etc...
                    }

                    var layerInfo = {
                        name: layer.name,
                        type: layerType,
                        url: layerUrl,
                        options: layerOptions,
                        default: layerDefault
                    };

                    if(layerDefault)
                    {
                        _defaultBaselayer = {
                            name: layerInfo.name,
                            type: layerInfo.type,
                            url: layerInfo.url,
                            layerOptions: layerInfo.options
                        };

                        _defaultBaselayer.layerOptions.showOnSelector = false;
                    }

                    baselayers.push(layerInfo);
                }
            });

            return baselayers;
        }

        return {
            addToMap: function (mapInfo, map) {
                loaded = false;
                if (mapInfo.format.indexOf('application/x-arcgis-map-server') > -1 || mapInfo.format.indexOf('application/x-arcgis-image-server') > -1) {
                    return _addMapServerLayer(map, mapInfo);
                } else if (mapInfo.format.indexOf('application/x-arcgis-feature-server') > -1) {
                    return _addFeatureServiceLayer(map, mapInfo);
                } else if (mapInfo.format.indexOf('application/vnd.ogc.wms') > -1) {
                    return _addWMSLayer(map, mapInfo);
                } else {
                    return $q.reject({'isValid': false, 'error': 'Not Supported'});
                }
            },
            isMappable: function (format) {
                return mappable[format];
            },
            getBaselayers: function() {
                return _getBaselayers();
            },
            getDefaultBaselayer: function() {
                return _defaultBaselayer;
            }
        };

    });