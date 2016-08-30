/*global angular, _, L, Wkt, alert, $, window */

angular.module('voyager.util').
    factory('solrUtil', function (config, $http) {

        'use strict';

        var _toArray = function (val) {
            if (typeof val === 'string') {
                return [ val ];
            }
            if (_.isUndefined(val)) {
                return [];
            }
            return val.slice();
        };

        function _toFilters(ids) {
            ids = _toArray(ids);
            return 'fq=id:' + ids.join('+');
        }

        function _getFilters(params, $scope) {
            var filters;
            if (!_.isUndefined(params.id) && params.id.length > 0) {
                $scope.idsFilter = true;
                filters = _toFilters(params.id);
            } else {
                $scope.idsFilter = false;
                filters = $.param(params, true);
            }
            return filters;
        }

        function _toSolrQuery(url, params) {
            var qs = $.extend({}, params);

            if (!('rows' in qs)) {
                qs.rows = 999999;
            }
            qs.rand = Math.random(); // avoid browser caching?;
            qs.wt = 'json';

            return config.root + url + '?' + $.param(qs, true);
        }

        function _stripAugmented(value) {
            if (value.indexOf(':[') !== -1) {
                var name = value.substring(0, value.indexOf(':['));
                if (name.indexOf('_') === 0) {  // strip leading _ so its not excluded as admin field
                    name = name.replace('_','');
                }
                return name;
            }
            return value;
        }

        return {

            toSolrFilters: function (params, $scope) {
                return _getFilters(params, $scope);
            },

            /**
             * Builds a solr call.
             *
             * @param {string} url Solr path, everything after the base path, eg. '/solr/v0/select'.
             * @param {object} params Query string parameters.
             *
             * @return {string} The full solr url.
             */
            toSolrQuery: function(url, params) {
                return _toSolrQuery(url, params);
            },

            /**
             * Performs a solr search.
             *
             * @param {string} q The main query parameter, defaults to '*:*'.
             * @param {string} fq The filter query parameter, defaults to no filter.
             * @param {string} fl The field list to request, defaults to '*'
             *
             * @return {promise} The request promise.
             */
            search: function(q, fq, fl) {
                if (_.isEmpty(q)) {
                    q = '*:*';
                }
                if (_.isEmpty(fl)) {
                    fl = '*';
                }
                var p = {
                    q: q,
                    fl: fl
                };
                if (!_.isEmpty(fq)) {
                    p.fq = fq;
                }

                return $http({
                    method: 'GET',
                    url: _toSolrQuery('solr/v0/select', p)
                });
            },

            /**
             * Performs a heatmap facet query.
             *
             * @param {string} bbox The bbox parameter as a comma delimited string (eg. "x1,y1,x2,y2"). 
             *    Defaults to "-180,-90,180,90".
             * @param {object} query Object containing query parameters (q, fq, etc...) used to 
                  filter the contents of the  heatmap query.
             * @param {number} level The grid level to compute the heatmap at. Defaults to none which
             *    causes the server to determine the best grid level.
             *
             * @return {promise} The request promise.
             */
            heatmap: function(bbox, query, level) {
                var bounds = bbox.split(/ *, */);
                var params = {
                    q: '*:*',
                    rows: 0,
                    facet: true,
                    'facet.heatmap': 'geohash',
                    'facet.heatmap.geom': _.template('["<%=w%> <%=s%>" TO "<%=e%> <%=n%>"]')({
                        w: Math.max(-180, bounds[0]),
                        s: Math.max(-90, bounds[1]),
                        e: Math.min(180, bounds[2]),
                        n: Math.min(90, bounds[3])
                    })
                };
                if (level > -1) {
                    params['facet.heatmap.gridLevel'] = level;
                }

                params =$.extend(params, query || {});

                return $http({
                    url: _toSolrQuery('solr/v0/select', params)
                });
            },

            stripAugmented: _stripAugmented
        };

    });
