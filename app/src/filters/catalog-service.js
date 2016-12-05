'use strict';
angular.module('voyager.filters')
    .factory('catalogService', function (config, $http, $location, $q) {

        var _catalogLookup = {};
        var _cachedCatalogs = [];
        var _fetched = false;

        function _fetch() {
            if (!_fetched) {
                return $http.get(config.root + 'api/rest/index/config/federation.json').then(function(res) {
                    var catalogs = res.data.servers;
                    catalogs.forEach(function(catalog) {
                        if (angular.isDefined(catalog.url)) {
                            _catalogLookup[catalog.url.replace('http://','').replace('https://','')] = catalog;
                        }
                    });
                    _cachedCatalogs = res.data.servers;
                    _fetched = true;
                    return res.data.servers;
                });
            } else {
                return $q.when(_cachedCatalogs);
            }
        }

        function _loadRemoteLocations() {
            if ($location.path() === '/search' && (angular.isDefined($location.search().shards) || config.settings.data.queryAllCatalogs)) {
                // load remote location names
                return _fetch().then(function (catalogs) {
                    var catalogPromises = [];
                    _.each(catalogs, function (catalog) {
                        if(angular.isDefined(catalog.url)) {
                            var url = catalog.url + config.require.locations;
                            // don't use credentials/cookies on remote call
                            var catalogPromise = $http.get(url, {withCredentials: false}).then(function (response) {
                                _.extend(config.locations.data.VALUE.location, response.data.VALUE.location);
                            });
                            catalogPromises.push(catalogPromise);
                        }
                    });
                    return $q.all(catalogPromises).then(function(res) {
                        return res;
                    }, function(error) {
                        return error; // failure means the remote catalogs are offline, allow to continue, the search should show an error
                    });
                });
            } else {
                return $q.when({});  // don't need to load
            }
        }

        function _lookup(shard) {
            var catalog = shard.replace('http://','').replace('https://','').toLowerCase();
            var pos = catalog.indexOf('solr');
            if (pos > -1) {
                catalog = catalog.substring(0, pos);
            }
            return _catalogLookup[catalog];
        }

        function _isRemote(shard) {
            return angular.isDefined(_lookup(shard));
        }

        function _removeInvalid(shards) {
            var arr = shards.split(',');
            var valid = arr.filter(function(shard) {
                return _.findIndex(_cachedCatalogs, {id: shard}) !== -1;
            });
            return valid.join(',');
        }

        return {
            fetch: _fetch,
            loadRemoteLocations: _loadRemoteLocations,
            isRemote: _isRemote,
            removeInvalid: _removeInvalid,
            lookup: _lookup
        };
    });