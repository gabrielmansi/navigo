'use strict';

angular.module('voyager.filters').
    factory('filterQuery', function (config, facetService, configService, sugar, $http, queryBuilder, catalogService) {

        function _getQueryString(params, filters, bounds) {
            delete params.fq; //use filter params
            delete params.sort; //don't sort
            if (angular.isDefined(params.shards)) {
                params.shards = catalogService.removeInvalid(params.shards);
            }
            if(angular.isDefined(params.disp) && angular.isUndefined(params['voyager.config.id'])) {
                params['voyager.config.id'] = params.disp;
            } else if (angular.isUndefined(params.disp) && angular.isDefined(configService.getConfigId())) {
                params['voyager.config.id'] = configService.getConfigId();
            }
            //params.q = getInput(params.q); //default to all if no input filter
            var queryString = config.root + 'solr/v0/select';
            queryString += '?' + sugar.toQueryString(params);
            var facetLimit = 11;
            queryString += '&rows=0';  //only return facets not results
            queryString += '&facet=true&facet.mincount=1&facet.limit=' + facetLimit + queryBuilder.buildFacetParams();
            queryString += filters;
            queryString += bounds;
            queryString += '&rand=' + Math.random(); // avoid browser caching?
            queryString += '&wt=json&json.wrf=JSON_CALLBACK';
            return queryString;
        }

        function checkFederations(res) {
            var shards = res.data['shards.info'], badShards = {};
            if (shards) {
                for (var shard in shards) {
                    if (!_.isEmpty(shards[shard].error)) {
                        badShards[shard] = shards[shard].shardAddress;
                    }
                }
            }
            return badShards;
        }

        return {

            execute: function (params, filters, bounds, selectedFilters) {
                var paramCopy = _.clone(params);  //params get modified, don't modify location directly
                return $http.jsonp(_getQueryString(paramCopy, filters, bounds)).then(function(res) {
                    var resultData = res.data.facet_counts.facet_fields;
                    var badShards = checkFederations(res);
                    var filterFacets = facetService.buildAllFacets(resultData, selectedFilters);
                    return {filters: filterFacets, badShards: badShards};
                });
            }
        };
    });
