/*global angular, $, _, alert, L */

angular.module('voyager.map').
factory('baseMapService', function (config, converter, mapUtil, $http, $q) {
    'use strict';

    var _baselayerStorageName = 'selected-base-layer';

    var _defaultConfig = {
        //tileLayer: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}/",
        attributionControl: false,
        scrollWheelZoom: true,
        zoomControl: false,
//            noWrap: true,
//            continuousWorld: false,
        minZoom: 1
    };

    var _layers = {
        baselayers: {
            base: {
                name: 'arcgis',
                type: 'xyz',
                url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}/',
                layerParams: {
//                        noWrap: true,
//                        continuousWorld: false
                },
                layerOptions: {
                    showOnSelector: false
                }
            }
        }
    };

    var _baselayers, _defaultBaselayer;

    var baseMap = _.getPath(config, 'map.config.url');

    if(angular.isDefined(baseMap)) {
        if (config.map.config.proxy) {
            baseMap = config.root + 'proxy?' + baseMap;
        }
        if(config.map.type === 'WMSLayerDefinition') {
            delete _defaultConfig.tileLayer;
            _defaultConfig.crs = 'EPSG4326';
            _layers = {
                baselayers: {
                    base: {
                        name: config.map.config.name,
                        type: 'wms',
                        url: baseMap,
                        layerOptions: {
                            layers: config.map.config.layers,
                            showOnSelector: false
                        },
                        layerParams: {
//                                noWrap: true,
//                                continuousWorld: false
                        }
                    }
                }
            };
        } else if (config.map.type === 'MapboxLayerDefinition') {
            _layers.baselayers.base.url = baseMap.replace(/\$/g, '');  //remove $ needed for OL (classic) map
        } else {  // assumes ArcGIS
            if(config.map.config.cached === true) {
                _layers.baselayers.base.url = baseMap + 'tile/{z}/{y}/{x}/';
                if(config.map.config.simpleWGS84) {
                    _defaultConfig.crs = mapUtil.getWGS84CRS();
                }
            } else {  // not a cached base map - assume ArcGIS dynamic base // TODO - support other types?  which ones?
                delete _defaultConfig.tileLayer;
                // TODO - support other crs/spatial reference?  If not leaflet supported will need proj4j
                //_defaultConfig.crs = 'EPSG4326';
                _layers = {
                    baselayers: {
                        base: {
                            name: config.map.config.name,
                            type: 'agsDynamic',
                            url: baseMap,
                            layerOptions: {
                                layers: config.map.config.layers,
                                showOnSelector: false
                            }
                        }
                    }
                };
            }
        }
    }


    function _fetchBaselayers() {
        var service = config.root + 'api/rest/display/maps';
        return $http.get(service).then(function(response) {
            return response.data;
        });
    }

    function _getBaselayers() {
        if (!angular.isDefined(_baselayers)) {
            return _fetchBaselayers().then(function (data) {
                _baselayers = _processBaselayerData(data);
                if(Object.keys(_baselayers).length <= 0) {
                    var layerData = [{
                        'name': _layers.baselayers.base.name,
                        'url': _layers.baselayers.base.url,
                        'layers': _layers.baselayers.base.layerOptions.layers,
                        'selected': true
                    }];
                    _baselayers = _processBaselayers(_baselayers, layerData, _layers.baselayers.base.type);
                }
                return _baselayers;
            });
        } else {
            return $q.when(_baselayers);
        }
    }

    function _processBaselayerData(layerData) {
        var baselayers = {};

        if (layerData.ags) {
            baselayers = _processBaselayers(baselayers, layerData.ags, 'ags');
        }
        if (layerData.bing) {
            baselayers = _processBaselayers(baselayers, layerData.bing, 'bing');
        }
        if (layerData.google) {
            baselayers = _processBaselayers(baselayers, layerData.google, 'google');
        }
        if (layerData.mapbox) {
            baselayers = _processBaselayers(baselayers, layerData.mapbox, 'mapbox');
        }
        if (layerData.wms) {
            baselayers = _processBaselayers(baselayers, layerData.wms, 'wms');
        }

        return baselayers;
    }

    function _processBaselayers(baselayers, layers, type) {
        baselayers = baselayers || {};

        $.each(layers, function (index, layer) {
            var layerType = type;
            var layerUrl = layer.url;
            if (config.map.config.proxy) {
                layerUrl = config.root + 'proxy?' + layerUrl;
            }

            var layerOptions = {
                continuousWorld: false,
                showOnSelector: true
            };
            var layerDefault = layer.selected || false;
            var layerCached = false;

            if(layerUrl) {
                switch (type) {
                    case 'ags':
                        if (layer.cached === true) {
                            layerUrl += 'tile/{z}/{y}/{x}/';
                            layerType = 'xyz';
                            layerCached = true;
                        } else {
                            layerType = 'agsDynamic';
                        }
                        layerOptions.layers = layer.layers;
                        break;
                    case 'google':
                        layerCached = true;
                        break;
                    case 'bing':
                        layerCached = true;
                        break;
                    case 'mapbox':
                        layerUrl = layerUrl.replace(/\$/g, '');  //remove $ needed for OL (classic) map
                        layerCached = true;
                        break;
                    case 'wms':
                        layerOptions.layers = layer.layers;
                        layerOptions.format = 'image/png';
                        layerOptions.transparent = true;
                        layerCached = true;
                        break;
                    default:
                        //fall-through for non-cached
                }

                var layerInfo = {
                    name: layer.name,
                    type: layerType,
                    url: layerUrl,
                    cached: layerCached,
                    default: layerDefault,
                    options: layerOptions
                };

                if(layerDefault)
                {
                    _defaultBaselayer = {
                        name: layerInfo.name,
                        type: layerInfo.type,
                        url: layerInfo.url,
                        cached: layerCached,
                        layerOptions: layerInfo.options
                    };

                    _defaultBaselayer.layerOptions.showOnSelector = false;
                }

                baselayers[layerInfo.name] = layerInfo;
            }
        });

        return baselayers;
    }

    return {
        BASELAYER_STORAGE_NAME: _baselayerStorageName,

        getDefaultConfig: function() {
            return _defaultConfig;
        },

        getLayers: function(origin) {
            if(origin === 'home') {
                var homeLayer = _.clone(_layers, true);
                if (config.homepage.wrapMap === false) {
                    homeLayer.baselayers.base.layerParams.noWrap = true;
                }
                return homeLayer;
            }
            return _layers;
        },

        getBaselayers: function() {
            return _getBaselayers();
        },

        getDefaultBaselayer: function() {
            return _defaultBaselayer;
        },

        getCRSForLayerType: function(type) {
            if(type === 'wms') {
                return L.CRS.EPSG4326;
            } else {
                return L.CRS.EPSG3857;
            }
        }
    };
});