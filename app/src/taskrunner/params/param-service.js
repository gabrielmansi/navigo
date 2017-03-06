/*global angular, $, _ */

angular.module('taskRunner').
    factory('paramService', function (localStorageService, $http) {
        'use strict';

        var _params = {};
        var _projections = [];
        var _groups = {};

        $http.get('projections.json').then(function(response) {
            $.each(response.data, function(name, value) {
                var info = name.split('/');
                var group = info[1];
                if (_groups[group]) {
                    _groups[group].children.push({name:info[info.length-1],value:value, group:info[1]});
                } else {
                    _groups[group] = {children:[{name:info[info.length-1],value:value, group:info[1]}], text:group};
                }
                _projections.push({name:info[info.length-1],value:value, group:info[1]});
            });
        });

        function _getParamDisplay(param, displayData) {
            var paramData = displayData.params[param.name];
            if(_.isUndefined(paramData)) {
                paramData = {'display':'', 'description':''};
                paramData.display = _.str.humanize(param.name);
                paramData.display = _.str.titleize();
            }
            return paramData;
        }

        function _decorate(param, displayData) {
            var paramDisplay = _getParamDisplay(param, displayData);
            param.label = paramDisplay.display;
            param.desc = paramDisplay.description;
            param.readOnly = true;
        }

        function _initReadOnly(response, displayData) {

            var readOnlyParams = {'params':[], 'inputItems':[], hasMap:false};

            $.each(response.data.params, function (index, param) {
                if (param.type === 'Projection') {
                    param.value = param.code;
                }
                if (param.type === 'Geometry' || param.type === 'MapView') {
                    readOnlyParams.hasMap = true;
                    param.hasMap = true;
                }

                _decorate(param, displayData);

                if(param.name === 'input_items') {
                    readOnlyParams.inputItems.push(param);
                } else {
                    readOnlyParams.params.push(param);
                }
            });

            return readOnlyParams;
        }

        function _applyChoicesAsValues(param) {
            if (_.isUndefined(param.values) && !_.isUndefined(param.choices)) {
                param.values = {};
                $.each(param.choices, function( index, value ) {
                    param.values[value] = value;
                });
            }
        }

        function _initParam(param) {
            if (param.type === 'StringChoice') {
                if (!param.value) {
                    param.value = param.choices[0];
                }
            }
            if (param.type === 'Geometry' || param.type === 'MapView') {
                param.hasMap = true;
            }
            param.readOnly = false;
        }

        function _initParams(response, reload) {
            var params = [];
            var mapParams = [];
            _params.hasMap = false;
            _params.hasAdvanced = false;

            $.each(response[0].data.params, function (index, param) {
                _initParam(param);
                if (param.hasMap) {
                    _params.hasMap = true;
                    param.reload = reload;
                    mapParams.push(param);
                } else {
                    params.push(param);
                }

                _decorate(param, response[1].data);
                _applyChoicesAsValues(param);

                if (param.advanced) {
                    _params.hasAdvanced = true;
                }
                param.readOnly = false;

            });

            _params.params = params;
            _params.mapParams = mapParams;
        }

        return {

            initParams: function (response, reload) {
                var lastRanParams = null;
                if (response[0].data.task !== 'export_result_list') {
                    lastRanParams = localStorageService.get(response[0].data.task);
                }

                if (lastRanParams === null) {
                    _initParams(response, reload);
                } else {
                    _params = lastRanParams;
                    if(_params.mapParams.length > 0) {
                        _params.mapParams[0].reload = reload;
                        //don't remember
                        delete _params.mapParams[0].wkt;
                    }
                }

                return _params;
            },

            initReadOnly: function(response, displayData) {
                return _initReadOnly(response,displayData);
            },

            getParams: function() {
                return _params;
            },

            getAllParams: function() {
                $.each(_params.params, function(index, value) {
                    if (value.type === 'Projection') {
                        if(angular.isDefined(value.code.id)) {
                            value.code = value.code.id;
                        }
                    }
                });
                var all = _params.params;
                if (!_.isUndefined(_params.mapParams)) {
                    all = all.concat(_params.mapParams);
                }
                return JSON.parse(JSON.stringify(all));
            },

            setParams: function(params) {
                _params = params;
            },

            getStorable: function() {
                var params = $.extend(true, {},_params); //create copy so we don't change _params
                params.reload = false; //force to false before saving
                $.each(params.params, function (index, param) {
                    if(param.name === 'input_items') {
                        delete param.query;
                        delete param.ids;
                    }
                    delete param.error;
                });
                if (angular.isDefined(params.mapParams)) {
                    $.each(params.mapParams, function (index, param) {
                        delete param.wkt;
                        delete param.extent;
                        delete param.center;
                        delete param.zoom;
                        delete param.error;
                    });
                }
                return params;
            },

            getProjections: function() {
                return _groups;
            },

            applyErrors: function(params, validations) {
                $.each(validations, function (index, validated) {
                    if (validated.error) {
                        $.each(params, function (index, param) {
                            if (param.name === validated.name) {
                                param.error = validated.error;
                                return;
                            }
                        });
                    }
                });
            }

        };

    });
