/*global angular, $, _ */

angular.module('voyager.search').
    factory('searchService', function ($http, translateService, filterService, urlUtil, config, queryBuilder, sugar, $q, configService, solrGrunt, cartService, $analytics, authService, resultsDecorator) {
        'use strict';
        var _page = 1;
        var _idsPage = _page;
        var _itemsPerPage = 48;
        var _solrService = '';
        var _lastResult = {};
        var _recordIds = [];
        var _sortDirection = angular.isDefined(config.defaultSortDirection)? config.defaultSortDirection : 'desc';
        var _defaultSortField = angular.isDefined(config.defaultSort)? config.defaultSort : 'score';
        var _sortField = 'score';
        var _mapView = '0 0 0';
        var _searchParams;

        var getMapView = function (mapView) {
            var val;
            if (_mapView) {  //_view is set via map. use it. will now be synced on url
                val = _mapView;
                _mapView = null;
                return val;
            }
            return mapView;
        };

        function _setParams(params) {
            if(angular.isUndefined(_sortField)) {
                _sortField = _defaultSortField;
            }
            if(angular.isDefined(params.sort)) {
                if(params.sort.indexOf(' ') !== -1) {
                    var sortInfo = params.sort.split(' ');
                    _sortField = sortInfo[0];
                    _sortDirection = sortInfo[1];
                } else {
                    _sortField = params.sort;
                }
            }
            if(angular.isDefined(params.sortdir)) {
                _sortDirection = params.sortdir;
            }
            _searchParams = solrGrunt.getSolrParams(params);
        }

        function _track(solrPage, data, endTime) {
            $analytics.eventTrack('search', {
                category: 'time', label: solrPage, value:endTime  // jshint ignore:line
            });
            $analytics.eventTrack('search', {
                category: 'size', label: solrPage, value:data.response.docs.length  // jshint ignore:line
            });
            $analytics.eventTrack('search-group', {
                category: authService.getGroupsJoined(), label: solrPage  // jshint ignore:line
            });
        }

//        function _featureGroupVisitor(featureGroups, doc) {
//            if(angular.isDefined(doc.tag_flags)) {
//                doc.featureGroup = featureGroups[doc.tag_flags[0]];
//                if(doc.featureGroup) {
//                    doc.featuredName = doc.featureGroup.name;
//                }
//            }
//        }

        //public methods - client interface
        return {
            doSearch2: function (params, append) {
                _setParams(params);
                var service = queryBuilder.doBuild2(_searchParams, _page, _itemsPerPage, _sortDirection, _sortField, true);
                _solrService = service;
                var solrPage = service.substring(service.indexOf('solr')-1);
                urlUtil.buildSearchUrl2(_searchParams, _page, getMapView(params.vw), params.view, _sortField); //keeps the url in sync
                var startTime = Date.now();
                return $http.get(service).success(function (data) {
                    var endTime = Date.now() - startTime;
                    _lastResult = data;
                    if(!append) {
                        _recordIds = [];
                        _idsPage = _page;
                    }
                    //var visitor = _.partial(_featureGroupVisitor,featuredService.getFeatures());
                    resultsDecorator.decorate(data.response.docs, _recordIds);
                    _track(solrPage, data, endTime);
                });
            },

            setPage: function (value) {
                _page = value;
            },

            getPage: function () {
                return _page;
            },

            clear: function () {
                filterService.clear();
                _page = 1;
            },

            getLastQuery: function () {
                return _solrService;
            },

            getLastSearch: function () {
                return urlUtil.getLastUrl();
            },

            setSort: function (direction) {
                _sortDirection = direction;
            },

            setSortField: function (field) {
                _sortField = field;
            },

            getSortField: function () {
                return _sortField;
            },

            getPrettySortField: function () {
                return translateService.getFieldName(_sortField);
            },

            getSort: function () {
                return _sortDirection;
            },

            setMapView: function (val) {
                _mapView = val;
            },

            setItemsPerPage: function(val) {
                _itemsPerPage = val;
            },

            getItemsPerPage: function() {
                return _itemsPerPage;
            },

            getResults: function() {
                return _lastResult;
            },

            hasRecords: function() {
                return _recordIds.length > 0;
            },

            getPageIds: function() {
                return _recordIds;
            },

            getPreviousId: function(id) {
                var index = _.findIndex(_recordIds,{id:id});
                if(index !== 0) {
                    return _recordIds[index-1];
                }
                return null;
            },

            getNextId: function(id) {
                var deferred = $q.defer();
                var index = _.findIndex(_recordIds,{id:id}), nextId = null;
                if(index !== _recordIds.length-1) {
                    nextId = _recordIds[index+1];
                    deferred.resolve(nextId);
                }
                if(nextId === null) {
                    _idsPage = _idsPage + 1;
                    var service = queryBuilder.doBuild2(_searchParams, _idsPage, _itemsPerPage, _sortDirection, _sortField);
                    $http.jsonp(service).success(function (data) {
                        $.each(data.response.docs, function (index, doc) {
                            if(index === 0) {  //first one in the next chunk is the next record
                                nextId = {id:doc.id, shard:doc.shard};
                            }
                            _recordIds.push({id:doc.id, shard:doc.shard});
                        });
                        deferred.resolve(nextId);
                    });
                }
                return deferred.promise;
            },

            getAllIds: function() {
                var service = queryBuilder.buildAllIds(_searchParams);
                return $http.jsonp(service);
            },

            getAllBboxes: function() {
                var service = queryBuilder.buildAllBboxes(_searchParams);
                return $http.jsonp(service);
            },

            reset: function() {
                _sortDirection = angular.isDefined(config.defaultSortDirection)? config.defaultSortDirection : 'desc';
                _sortField = _defaultSortField || 'score';
            },

            testEsriGeocodeService: function() {
                var d = $q.defer();
                $http.jsonp(queryBuilder.buildEsriGeocodeServiceTestQuery())
                    .success(function(rsp) {
                        if (!_.isEmpty(rsp.placefinder.results)) {
                            d.resolve(true);
                        }
                        else {
                            d.resolve(false);
                        }
                    });
                return d.promise;
            }
        };

    });
