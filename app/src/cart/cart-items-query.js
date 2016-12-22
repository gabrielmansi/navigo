'use strict';
angular.module('cart').
    factory('cartItemsQuery', function (config, filterService, configService, sugar, $http, translateService, $log, converter) {

        function _cleanFilters(filters) {
            var cleanFilters = _.clone(filters), pos;
            _.each(cleanFilters, function(filter, index) {
                pos = filter.indexOf('{!tag');
                if(pos !== -1) {
                    pos = filter.indexOf('}');
                    cleanFilters[index] = filter.substring(pos+1);
                }
            });
            return cleanFilters.join(' AND ');
        }

        function _applyItems(queryCriteria, items) {
            var itemsStr = '', sep = '', hasItems = false, filters, q = '', oper = '';
            if (items && items.length > 0) {
                itemsStr = 'id:(' + items.join(' ') + ')';
                sep = ' OR ';
                hasItems = true;
            }

            if (angular.isDefined(queryCriteria.params.q) && _.isEmpty(queryCriteria.solrFilters)) {  // no filters
                q = queryCriteria.params.q;
                if (angular.isDefined(queryCriteria.params.place)) {
                    q = '(' + q + ' AND ' + converter.toPlaceFilter(queryCriteria.params) + ')';
                }
                queryCriteria.params.q = itemsStr + sep + q;
            } else if (hasItems) {
                if (!_.isEmpty(queryCriteria.solrFilters)) {
                    filters = _cleanFilters(queryCriteria.solrFilters); // filters are AND (within OR below)
                    if (angular.isDefined(queryCriteria.params.q)) {
                        q = queryCriteria.params.q;
                        oper = ' AND ';
                    }

                    if (angular.isDefined(queryCriteria.params.place)) {
                        q += oper + converter.toPlaceFilter(queryCriteria.params);
                        oper = ' AND ';
                    }

                    // TODO - Jason - why does having constraints do this? (not include the q filter)
                    //if (_.has(queryCriteria, 'constraints')) {
                    //    queryCriteria.params.q = itemsStr + sep + filters;
                    //} else {
                    queryCriteria.params.q = itemsStr + sep + '(' + q + oper + filters + ')';
                    //}
                } else {
                    if (angular.isDefined(queryCriteria.params.place)) {
                        q = '(' + converter.toPlaceFilter(queryCriteria.params) + ')';
                        oper = ' OR ';
                    }
                    queryCriteria.params.q = itemsStr + oper + q;
                }
            }
        }

        function _convertPlaceIf(queryCriteria) {
            if (angular.isDefined(queryCriteria.params.place)) {
                var fq = [];
                if (angular.isDefined(queryCriteria.solrFilters)) {
                    fq = queryCriteria.solrFilters;
                }
                fq.push(converter.toPlaceFilter(queryCriteria.params));
                queryCriteria.solrFilters = fq;
            }
        }

        function _setParams(queryCriteria, items) {
            var queryString = '';
            if (!queryCriteria) {
                queryCriteria = {params:{}, hasQuery:false};
            }
            if (!_.isEmpty(items)) {
                _applyItems(queryCriteria, items);
            } else {
                _convertPlaceIf(queryCriteria);
            }
            queryString += '?' + sugar.toQueryString(queryCriteria.params);
            return queryString;
        }

        function _addRow(results, add, item) {
            if(add) {
                results.push({'key':item, displayFormat:translateService.getType(item)});
            } else {
                results[results.length - 1].count = item;
            }
            return !add;
        }

        function _buildRows(items) {
            var isKey = true, results = [], count = 0;
            $.each(items, function (index, item) {
                isKey = _addRow(results, isKey, item);
                if(isKey) {
                    count += item;
                }
            });
            return {results:results, count:count};
        }

        function _buildQuery(settings, queryCriteria, items, block) {
            var queryString = config.root + 'solr/v0/select';
            queryString += _setParams(queryCriteria, items);
            queryString += settings;
            if (queryCriteria && (angular.isUndefined(items) || items.length === 0)) { //setParams will apply filters
                if(!_.isEmpty(queryCriteria.solrFilters)) {
                    queryString += '&fq=' + queryCriteria.solrFilters.join('&fq=');
                }
                if(angular.isDefined(queryCriteria.bounds)) {
                    queryString += queryCriteria.bounds;
                }
            }
            if (angular.isDefined(block)) {
                queryString += '&block=' + block;
            }
            queryString += '&wt=json&json.wrf=JSON_CALLBACK&r=' + Math.random();
            $log.log('Cart queryString: ' + queryString);
            return queryString;
        }

        function _getSummaryQueryString(queryCriteria, items, block) {
            var settings = '&fl=id,name:[name],format&extent.bbox=true';
            settings += '&facet=true&stats=true&stats.field=bytes&facet.field=format&facet.mincount=1&rows=0';

            return _buildQuery(settings, queryCriteria, items, block);
        }

        function _getQueryString(queryCriteria, items, block) {
            var settings = '&fl=id,title,name:[name],format,thumb:[thumbURL]';
            settings += '&rows=100&extent.bbox=true';

            return _buildQuery(settings, queryCriteria, items, block);
        }

        function _getQueuedQueryString(queryCriteria, items, queued) {
            if(!queryCriteria) {
                queryCriteria = {params:{}, hasQuery:false};
            }
            if(queued && queued.length > 0) {
                var ids = _.pluck(queued, 'id');
                if (queryCriteria.params.fq) {
                    queryCriteria.params.fq.push('id:(' + ids.join(' ') + ')');
                } else {
                    queryCriteria.params.fq = 'id:(' + ids.join(' ') + ')';
                }
            }
            var settings = '&fl=id&rows=100&extent.bbox=true&block=false';
            return _buildQuery(settings, queryCriteria, items, false);
        }

        function _getQueryCriteria(solrParams) {
            var params = _.clone(solrParams);
            var solrFilters = filterService.getSolrList();
            delete params.fq; //filter service will apply filter params below
            delete params.sort;
            delete params.view;
            delete params.vw;
            delete params.disp;
            if(params.q === '*:*') {
                delete params.q;
            }
            return {params:params, bounds: filterService.getBoundsParams(), solrFilters: solrFilters};
        }

        function _decorate(items) {
            $.each(items, function(index, item) {
                if(angular.isDefined(item.format)) {
                    item.displayFormat = translateService.getType(item.format);
                } else {
                    item.displayFormat = 'Unknown';
                }
                if(angular.isDefined(item.thumb) && item.thumb.indexOf('vres/mime') !== -1) {
                    item.defaultThumb = true;
                }
            });
        }

        function _fetchItems(queryCriteria, items, block) {
            return $http.jsonp(_getQueryString(queryCriteria, items, block)).then(function(res) {
                var docs = res.data.response.docs;
                _decorate(docs);
                return {'docs': docs, 'bbox':res.data['extent.bbox'], count:res.data.response.numFound};
            });
        }

        function _fetchQueued(queryCriteria, items, queued) {
            return $http.jsonp(_getQueuedQueryString(queryCriteria, items, queued)).then(function(res) {
                return res.data.response.docs;
            });
        }

        function _fetchSummary(queryCriteria, items, block) {
            return $http.jsonp(_getSummaryQueryString(queryCriteria, items, block)).then(function(res) {
                var rows = _buildRows(res.data.facet_counts.facet_fields.format);
                return {'docs': rows.results, 'bbox':res.data['extent.bbox'], count:res.data.response.numFound};
            });
        }

        function _fetchItemsOnly(query) {
            return $http.jsonp(query).then(function(res) {
                return res.data.response.docs;
            });
        }

        return {

            getQueryCriteria: function (params) {
                return _getQueryCriteria(params);
            },

            execute: function (queryCriteria, items, block) {
                var count = 1;
                if (queryCriteria) {
                    count = queryCriteria.count;
                    delete queryCriteria.params.sort;
                }
                if(count <= 100) {
                    return _fetchItems(_.clone(queryCriteria), items, block);
                } else {
                    return _fetchSummary(_.clone(queryCriteria), items, block);
                }
            },

            fetchItems: function(queryCriteria, items) {
                return _fetchItems(queryCriteria, items);
            },

            fetchQueued: function(queryCriteria, items, queued) {
                return _fetchQueued(_.clone(queryCriteria), items, queued);
            },

            fetchItemsOnly: function(items) {
                var queryString = config.root + 'solr/v0/select';
                if(items) {
                    var ids = _.keys(items);
                    queryString += '?fq=id:(' + ids.join(' ') + ')';

                }
                queryString += '&fl=id';
                queryString += '&rows=100';
                queryString += '&rand=' + Math.random(); // avoid browser caching?
                queryString += '&wt=json&json.wrf=JSON_CALLBACK';
                return _fetchItemsOnly(queryString);
            }
        };
    });
