'use strict';

angular.module('voyager.util').
    factory('queryBuilder', function (config, filterService, configService, sugar) {

        var actionFields = null;
        var selectPath = 'solr/v0/select';
        var customFields = ['shards', 'discoveryStatus']; //all custom fields must be entered here in order to not impact query string

        var getFacetParams = function (field) {
            var facetParams = '';
            if (field && !($.inArray(field, customFields) >= 0)) {
                var fieldConfig = _.find(config.settings.data.filters, function(filter) {return filter.field === field;});
                if(angular.isDefined(fieldConfig.minCount)) {
                    facetParams += '&f.' + fieldConfig.field + '.facet.mincount=' + fieldConfig.minCount;
                }
                if(angular.isDefined(fieldConfig.sort)) {
                    facetParams += '&f.' + fieldConfig.field + '.facet.sort=' + fieldConfig.sort;
                }
                if(fieldConfig.style === 'CHECK') {
                    facetParams += '&facet.field={!ex=' + field + '}' + field;
                } else {
                    facetParams += '&facet.field=' + field;
                }
                return facetParams;
            }
            var filters = config.settings.data.filters;

            $.each(filters, function (index, filter) {
                if(!($.inArray(filter.field, customFields) >= 0)) {
                    if(filter.style === 'CHECK') {
                        facetParams += '&facet.field={!ex=' + filter.field + '}' + filter.field;
                    } else if(filter.style === 'STATS') {
                        //facetParams += '&stats.field=' + filter.field;  //stats is a separate call - see range-service.js
                        facetParams += '&facet.field=' + filter.field;
                        //stats = true;
                    } else {
                        facetParams += '&facet.field=' + filter.field;
                    }
                    if(angular.isDefined(filter.minCount)) {
                        facetParams += '&f.' + filter.field + '.facet.mincount=' + filter.minCount;
                    }
                    if(angular.isDefined(filter.sort)) {
                        facetParams += '&f.' + filter.field + '.facet.sort=' + filter.sort;
                    }
                }
            });
            return facetParams;
        };

        var getInput = function (query) {
            var input = '*:*';
            if (angular.isDefined(query)) {
                input = query;
            }
            return input;
        };

        function getActionFields() {
            if (actionFields !== null) {
                return actionFields;
            }
            var fields = [];
            var actions = config.docActions;
            var pos = -1;
            var fieldArr = [];
            actions.forEach(function(action) {
                pos = action.visible.indexOf('doc.');
                if (pos > -1) {
                    fieldArr = action.visible.split('doc.');
                    fieldArr.forEach(function(field) {
                        if (field !== '' && !sugar.containsAny(field, ['canCart','isService','hasDownload','isEsriLayer'])) {
                            fields.push(field.substring(0, field.indexOf(' ')));
                        }
                    });
                }
            });
            actionFields = fields.join(',');
            return actionFields;
        }

        function build2(solrParams, page, itemsPerPage, sortDirection, sortField) {
            if(solrParams) {
                delete solrParams.fq; //filter service will apply filter params below
            } else {
                solrParams = {};
            }
            //solrParams.q = getInput(solrParams.q); //default to all if no input filter  //TODO do we need to convert empty to *:* seems to work without it
            var queryString = config.root + selectPath;
            queryString += '?' + sugar.toQueryString(solrParams);
            var rows = 0;
            if (page) {
                var start = (page - 1) * itemsPerPage;
                rows = itemsPerPage;
                queryString += '&start=' + start;
                queryString += '&fl=id,title, name:[name],format,abstract,fullpath:[absolute],absolute_path:[absolute],thumb:[thumbURL], path_to_thumb, subject,download:[downloadURL],format_type,bytes,modified,shard:[shard],bbox,geo:[geo],format_category, component_files, ags_fused_cache, linkcount__children, contains_name, wms_layer_name,tag_flags,hasMissingData,layerURL:[lyrURL]';
                queryString += configService.getSolrFields();
                queryString += getActionFields();  // add fields configured for action display
                //prevent adding extra comma when table field name is empty
                if (configService.getTableFieldNames().length) {
                    queryString += ',' + configService.getTableFieldNames().join(',');
                }
            }
            queryString += '&rows=' + rows;
            queryString += '&extent.bbox=true&block=false';
            queryString += filterService.getFilterParams();
            queryString += filterService.getBoundsParams();
            if(angular.isDefined(configService.getConfigId()) && angular.isUndefined(solrParams['voyager.config.id'])) {
                queryString += '&voyager.config.id=' + configService.getConfigId();
            }
            if (angular.isDefined(sortField)) {
                if(angular.isUndefined(sortDirection)) {
                    sortDirection = angular.isDefined(config.defaultSortDirection)? config.defaultSortDirection : 'desc';
                }
                queryString += '&sort=' + sortField + ' ' + sortDirection;
            }
            queryString += '&rand=' + Math.random(); // avoid browser caching?
            queryString += '&wt=json&json.wrf=JSON_CALLBACK';

            return queryString;
        }

        function buildByIds(ids) {
            var queryString = config.root + selectPath + '?q=';
            queryString += 'id:(';
            $.each(ids, function (index, id) {
                queryString += ' ' + id;
            });
            queryString += ')';
            queryString += '&fl=id,name:[name],thumb:[thumbURL],format:[format]&extent.bbox=true&rows=999999';
            queryString += '&wt=json&json.wrf=JSON_CALLBACK';

            return queryString;
        }

        function _buildIdList(solrParams) {
            delete solrParams.fq; //filter service will apply filter params below
            solrParams.q = getInput(solrParams.q); //default to all if no input filter
            var queryString = config.root + selectPath;
            queryString += '?' + sugar.toQueryString(solrParams);
            queryString += '&fl=id&rows=999999';
            queryString += filterService.getFilterParams();
            queryString += filterService.getBoundsParams();
            queryString += '&rand=' + Math.random(); // avoid browser caching?
            queryString += '&wt=json&json.wrf=JSON_CALLBACK';
            return queryString;
        }

        function _buildBboxList(solrParams) {
            delete solrParams.fq; //filter service will apply filter params below
            solrParams.q = getInput(solrParams.q); //default to all if no input filter
            var queryString = config.root + selectPath;
            queryString += '?' + sugar.toQueryString(solrParams);
            queryString += '&fl=bbox,name,id&rows=' + config.markerLimit + '&fq=bbox:[-90,-180 TO 90,180]';
            queryString += filterService.getFilterParams();
            queryString += filterService.getBoundsParams();
            queryString += '&rand=' + Math.random(); // avoid browser caching?
            queryString += '&wt=json&json.wrf=JSON_CALLBACK';
            return queryString;
        }

        return {

            doBuild2: function (params, page, itemsPerPage, sortDirection, sortField) {
                return build2(params, page, itemsPerPage, sortDirection, sortField);
            },

            doByIds: function (ids) {
                return buildByIds(ids);
            },

            buildAllFacets: function(params, field) {
                delete params.fq; //filter service will apply filter params below
                delete params.sort; //don't sort
                params.q = getInput(params.q); //default to all if no input filter
                var queryString = config.root + selectPath, facetLimit = -1, rows = 0;
                queryString += '?' + sugar.toQueryString(params);
                queryString += '&rows=' + rows;
                queryString += '&facet=true&facet.mincount=1&facet.limit=' + facetLimit + getFacetParams(field);
                var fieldConfig = _.find(config.settings.data.filters, function(filter) {return filter.field === field;});
                if(field !== 'shards') {
                    if(fieldConfig.style === 'CHECK') {
                        queryString += '&facet.field={!ex=' + field + '}' + field;
                    } else {
                        queryString += '&facet.field=' + field;
                    }
                }
                queryString += filterService.getFilterParams();
                queryString += filterService.getBoundsParams();
                queryString += '&rand=' + Math.random(); // avoid browser caching?
                queryString += '&wt=json&json.wrf=JSON_CALLBACK';
                return queryString;
            },

            buildAllIds: function(params) {
                return _buildIdList(params);
            },

            buildAllBboxes: function(params) {
                return _buildBboxList(params);
            },

            buildBulkUpdaterUrl: function(url, params) {
                delete params.fq; //filter service will apply filter params below
                delete params.sort; //don't sort
                delete params.view;
                params.q = getInput(params.q); //default to all if no input filter
                var queryString = config.root + url, rows = 999999;
                queryString += '?' + sugar.toQueryString(params);
                queryString += '&rows=' + rows;
                queryString += filterService.getFilterParams();
                queryString += filterService.getBoundsParams();
                queryString += '&rand=' + Math.random(); // avoid browser caching?
                queryString += '&wt=json';
                return queryString;
            },

            buildEsriGeocodeServiceTestQuery: function() {
                return config.root + selectPath + '?' + $.param({
                    wt: 'json',
                    'json.wrf': 'JSON_CALLBACK',
                    rows: 0,
                    place: 'california',
                    'place.finder': 'esri'
                });
            },

            buildFacetParams: function(field) {
                return getFacetParams(field);
            }

        };
    });
