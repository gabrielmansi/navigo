/*global angular, $, _, alert, L */

angular.module('voyager.map').
factory('baseMapService', function (config, converter, $http, $q) {
    'use strict';

    var _baselayers, _defaultBaselayer;

    var _baselayerStorageName = 'selected-base-layer';


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
        getBaselayers: function() {
            return _getBaselayers();
        },
        getDefaultBaselayer: function() {
            return _defaultBaselayer;
        }
    };
});