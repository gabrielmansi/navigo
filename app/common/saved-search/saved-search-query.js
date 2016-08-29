'use strict';
/*global querystring */
var SavedSearchQuery = (function () {

    var _config, _http, _sugar;

    function _getQueryString(rows, filter) {
        var queryString = _config.root + 'solr/ssearch/select?';
        queryString += 'rows=' + rows + '&rand=' + Math.random();
        if(angular.isDefined(filter)) {
            queryString += '&fq=' + filter;
        }
        queryString += '&wt=json&json.wrf=JSON_CALLBACK';
        return queryString;
    }

    function _execute(rows, filter) {
        return _http.jsonp(_getQueryString(rows, filter)).then(function (data) {
            return data.data.response.docs;
        }, function(error) {
            //@TODO: handle error
            console.log(error);
            return error;
        });
    }

    function _getSavedSearchParams(savedSearch) {
        var solrParams = querystring.parse(_sugar.trim(savedSearch.query,'&'));

        // these will get applied later to solr call - don't duplicate
        delete solrParams.facet;
        delete solrParams['facet.field'];
        delete solrParams['facet.mincount'];
        delete solrParams['extent.bbox'];

        if(angular.isUndefined(solrParams.shards) && savedSearch.path.indexOf('catalog=') !== -1) {
            //workaround - query is missing the shards
            var voyagerParams = querystring.parse(_sugar.trim(savedSearch.path.replace(/\//g,'&'),'&'));
            solrParams.shards = voyagerParams.catalog;
        }
        _sugar.decodeParams(solrParams);  //workaround - seems the params get encoded twice
        solrParams.disp = savedSearch.config;
        return solrParams;
    }

    return function(config, $http, sugar) {

        _config = config;
        _http = $http;
        _sugar = sugar;

        return {

            execute: function () {
                return _execute(100);
            },

            fetchDefault: function () {
                return _execute(1);
            },

            fetch: function(id) {
                return _execute(1, 'id:' + id);
            },

            fetchDefaultParams: function() {
                return _execute(1).then(function(docs) {
                    if(docs && docs.length > 0) {
                        var savedSearch = docs[0];
                        return _getSavedSearchParams(savedSearch);
                    } else { //no default, just run a query
                        return {};
                    }
                });
            }
        };
    };
})();

angular.module('voyager.common.savedsearch',['voyager.util'])
    .factory('savedSearchQuery', function (config, $http, sugar) {
        return new SavedSearchQuery(config, $http, sugar);
    });
