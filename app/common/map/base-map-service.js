/*global angular, $, _, alert, L */

angular.module('voyager.map').
factory('baseMapService', function (config, converter, $http, $q) {
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
                    // custom crs - snagged from leaflet 1.0 to support 4326 better
                    var wgs84Proj = L.extend({}, L.Projection.LonLat, {bounds:L.bounds([-180, -90], [180, 90])});
                    var wgs84 = L.extend({}, L.CRS, {
                        projection: wgs84Proj,
                        transformation: new L.Transformation(1 / 180, 1, -1 / 180, 0.5),
                        getSize: function (zoom) {
                            var b = this.projection.bounds,
                                s = this.scale(zoom),
                                min = this.transformation.transform(b.min, s),
                                max = this.transformation.transform(b.max, s);

                            return L.point(Math.abs(max.x - min.x), Math.abs(max.y - min.y));
                        }
                    });
                    _defaultConfig.crs = wgs84;
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

                baselayers.push(layerInfo);
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
        }
    };
});