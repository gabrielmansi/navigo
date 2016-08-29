/*global querystring */
'use strict';
angular.module('voyager.home')
	.service('featureQuery', function(config, $http, cartService, $q, configService, translateService, featuredService, savedSearchQuery, sugar, authService, resultsDecorator, $location) {

//        //TODO use featuredService in closure?  Then we don't need to pass in groups/_.partial
//        function _featureGroupVisitor(featureGroups, doc) {
//            if(angular.isDefined(doc.tag_flags)) {
//                doc.featureGroup = featureGroups[doc.tag_flags[0]];
//                if(doc.featureGroup) {
//                    doc.featuredName = doc.featureGroup.name;
//                }
//            }
//        }

        var _featureQuery;

        function _getSavedSearchQueryString(savedSearch) {
            var config = $location.search().disp; //override saved search disp if set on url
            if(angular.isUndefined(config)) {
                config = savedSearch.config;
            }
            return configService.setFilterConfig(config).then(function() {
                var solrParams = querystring.parse(sugar.trim(savedSearch.query,'&'));
                // these will get applied later to solr call - don't duplicate
                delete solrParams.facet;
                delete solrParams['facet.field'];
                delete solrParams['facet.mincount'];
                delete solrParams['extent.bbox'];

                sugar.decodeParams(solrParams);  //workaround - seems the params get encoded twice
                var queryString = _getQueryString();
                queryString += '&' + querystring.stringify(solrParams);
                return queryString;
            });
        }

        function _getDefaultQueryString() {
            var savedSearch;
            return savedSearchQuery.fetchDefault().then(function(docs) {
                if(docs && docs.length > 0) {
                    savedSearch = docs[0];
                    _featureQuery = savedSearch;
                    return _getSavedSearchQueryString(savedSearch);
                } else { //no default, just run a query
                    _featureQuery = undefined;
                    return _getQueryString();
                }
            });
        }

        // attempt to get the configured query, fallback to default, fallback to query all
        function _getConfiguredQuery() {
            var featuredQuery = '', savedSearch;
            if(config.homepage && config.homepage.featuredContentQuery) {
                featuredQuery = config.homepage.featuredContentQuery;
            }
            if(featuredQuery !== '') {
                return savedSearchQuery.fetch(featuredQuery).then(function(docs) {
                    if(docs && docs.length > 0) {
                        savedSearch = docs[0];
                        _featureQuery = savedSearch;
                        return _getSavedSearchQueryString(savedSearch);
                    } else {  //get default
                        return _getDefaultQueryString();
                    }
                });
            } else {
                return _getDefaultQueryString();
            }
        }

        //TODO use query defined in config homepage
		function _getQueryString() {
			var rows = 12;  //TODO set to what we really want
			var queryString = config.root + 'solr/v0/select?';
			queryString += 'fl=id,title, name:[name],format,abstract,fullpath:[absolute],thumb:[thumbURL], path_to_thumb, subject,download:[downloadURL],format_type,bytes,modified,shard:[shard],bbox,format_category, component_files, tag_flags';
			queryString += configService.getSolrFields();
            //queryString += '&fq=tag_featured:[* TO *]';  //TODO don't filter out those not tagged
			queryString += '&rows=' + rows;
			queryString += '&rand=' + Math.random(); // avoid browser caching?
			queryString += '&wt=json&json.wrf=JSON_CALLBACK';
			return queryString;
		}

		function _execute() {
			var deferred = $q.defer();

			var queryPromise = _getConfiguredQuery().then(function(queryString) {
                return $http.jsonp(queryString);
            });

// TODO remove this - not using feature groups for showing flags now
//            var featurePromise = featuredService.fetchFeatures();

            $q.all([queryPromise]).then(function(res) {
                var searchResult = res[0].data.response.docs;
//                var featureGroups = res[1];
//                var visitor = _.partial(_featureGroupVisitor,featureGroups);
                resultsDecorator.decorate(searchResult, []);
                return deferred.resolve(searchResult);
            });

			return deferred.promise;
		}

		return {
			execute: function() {
				return _execute();
			},
            getFeatureQuery: function() {
                return _featureQuery;
            }
		};

	});

