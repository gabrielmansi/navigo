'use strict';
angular.module('voyager.config').
    factory('configLoader', function ($http, $q, config, configService, savedSearchQuery, $location, $timeout, translateService, savedSearchService, catalogService, baseMapService) {

        var _configId;
        var _prepared = false;

        function _setConfigRoot(hostname) {
            //localhost won't work in a prod env, replace if its configured wrong
            if(hostname !== '127.0.0.1' && hostname !== 'localhost') {
                config.root = config.root.replace('localhost', window.location.hostname);
            }
            if (window.location.protocol === 'https:') { //ajax calls have to be https if browser is https
                if(config.root.indexOf('https:') === -1) {
                    config.root = config.root.replace('http:','https:');
                }
            }
        }

        function _setProxy(hostname) {
            //try to set the proxy url if not set correctly
            if(hostname !== '127.0.0.1' && hostname !== 'localhost' && config.proxy.indexOf('localhost') > -1) {
                var port = window.location.port;
                if (port !== '') {
                    port = ':' + port;
                }
                var root = location.pathname;
                root = _.str.trim(root,'/');
                root = root.split('/');
                if(root.length > 1) {
                    root.pop();  //remove "portal" or whatever it's named from the path
                    root = root.join('/');
                    //config.proxy += '/' + root;
                }
                config.proxy = config.proxy.replace('http://localhost:8888',window.location.protocol + '//' + window.location.hostname + port + '/' + root);
            }
        }

        function _loadDependencies() {

            var promises = [], url;
            $.each(config.require, function (index, value) {
                url = config.root + value;
                var promise = $http.get(url, {headers: {'Content-Type': 'application/json; charset=utf-8'}, withCredentials: true}).then(function (response) {
                    config[index] = response;
                });
                promises.push(promise);
            });
            promises.push(catalogService.fetch());
            promises.push(baseMapService.getBaselayers());

            return $q.all(promises);
        }

        function _prepare() {
            if(!_prepared) {
                if(angular.isDefined(config.rootOverride)) {
                    config.root = config.rootOverride;
                }

                var hostname = window.location.hostname;
                _setConfigRoot(hostname);
                _setProxy(hostname);
                return _loadDependencies($q,$http);
            } else {
                _prepared = true;
                return $q.when({});
            }
        }

        //public methods - client interface
        return {
            load: function(configId) {
                return _prepare().then(function() {
                    translateService.init();

                    // load map config
                    var defaultView = _.getPath(config, 'map.config.defaultView');
                    if (angular.isDefined(defaultView)) {
                        configService.setDefaultMapView(
                            configService.parseMapViewString(defaultView));
                    }

                    if (angular.isUndefined(configId)) {
                        return savedSearchQuery.fetchDefault().then(function(docs) {
                            var defaultSearch = docs[0];
                            if(!defaultSearch) {
                                defaultSearch = {};  //configService will handle this gracefully
                            }
                            return configService.setFilterConfig(defaultSearch.config).then(function(config) {
                                $timeout(function() { //apply after digest and route is complete
                                    var params = {};
                                    if(defaultSearch) {
                                        params = savedSearchService.getParams(defaultSearch);
                                    }
                                    params.disp = config.configId;
                                    $location.search(params);
                                });
                            });
                        });
                    } else {
                        if(_configId !== configId) {
                            return configService.setFilterConfig(configId).then(function() {
                                if($location.search().disp !== configId) {
                                    $timeout(function() { //apply after digest and route is complete
                                        $location.search('disp', configId);
                                    });
                                }
                                _configId = configId;
                            });
                        } else {
                            return $q.when();
                        }

                    }
                });
            },

            prepare: function() {
                return _prepare();
            }
        };

    });
