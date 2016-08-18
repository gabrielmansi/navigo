/*global angular, $, _ */

angular.module('voyager.filters').
    factory('filterService', function (translateService, facetService, $q, configService, rangeService, converter) {
        'use strict';
        var filters = [];  //user selected filters
        var filterMap = {}; //quick lookup for filters
        var filterState = {};  //expanded/collapsed
        var searchBounds;
        var boundsType = 'IsWithin';
        var _systemFilters = null;
        var _statsFields = {};

        function _setFilters (filterList) {
            filters = filterList;
            $.each(filters, function (index, value) {
                filterMap[value.name] = value;
            });
        }

        function _clear() {
            filters.length = 0;
            filterMap = {};
        }

        function _getKeyValue(filter) {
            var pos = filter.indexOf(':'), keyValue = {};
            keyValue.name = filter.substring(0, pos);
            keyValue.value = filter.substring(pos + 1);
            keyValue.value = keyValue.value.replace(/\\/g, '');  //remove escape characters
            return keyValue;
        }

        function _buildSelectedFilter(filterKeyValue) {
            var filterName = filterKeyValue.name, style;
            //TODO not sure if OR filters will ever be in this format
            if (filterName.indexOf('{!tag=') !== -1) {
                filterKeyValue.name = filterName.substring(filterName.indexOf('}')+1);
                style = 'CHECK';
            } else {
                style = configService.lookupFilterStyle(filterKeyValue.name);
            }
            var decodeValue = decodeURIComponent(filterKeyValue.value);
            var timeValues = decodeValue.replace(/[\[\]]/g, '').split(' TO ');
            var humanized = translateService.getFieldName(filterKeyValue.name) + ':' + (filterKeyValue.name === 'location' ? translateService.getLocation(filterKeyValue.value) : translateService.getType(decodeURI(filterKeyValue.value)));

            if (style !== 'RANGE' && Date.parse(timeValues[0])) {
                style = 'DATE';
                humanized = translateService.getFieldName(filterKeyValue.name) + ':' + decodeValue;
            }

            var selectedFilter = {'filter': filterKeyValue.name, 'name': filterKeyValue.value, 'humanized': humanized, isSelected: true, 'style': style, 'displayState': 'in'};

            // TODO add STATS and DATE styles here to decorateSelected?
            if(style === 'RANGE') {
                rangeService.decorateSelected(selectedFilter, filterKeyValue);
            }

            return selectedFilter;
        }

        function _getFilterList(urlFilters) {
            var filterList = [];
            $.each(urlFilters, function (index, filter) {
                var filterKeyValue = _getKeyValue(filter);
                var selectedFilter = _buildSelectedFilter(filterKeyValue);
                filterList.push(selectedFilter);
                //if the filter is on the url and the filterstate is not defined, default the filter state to open
                if(angular.isUndefined(filterState[filterKeyValue.name])) {
                    filterState[filterKeyValue.name] = 'in';
                }
            });
            return filterList;
        }

        function _syncFilters(urlFilters, resetState) {
            if(resetState) {
                filterState = {}; //reset if disp config changed
            }
            if (typeof urlFilters === 'string') {
                urlFilters = [ urlFilters ];
            }
            if (urlFilters) {
                var filterList = _getFilterList(urlFilters);
                _setFilters(filterList);
            } else {
                _clear();
            }
        }

        function _replaceName(target, source) {
            // TODO - regex
            var name = target.replace(source, '').replace('( ', '(').replace(' )',')');
            if (name.indexOf(' ') !== -1) {
                name = name.replace('( ', '(').replace(' )',')').replace('(','').replace(')','');
            }
            return name;
        }

        //public methods - client interface
        return {

            getSystemFilters: function() {
                return _systemFilters;
            },

            buildFacets: function (filters) {
                return facetService.buildAllFacets(filters, filterMap);
            },

            getFilterAsLocationParams: function () {
                var filterList = [], name;
                $.each(filters, function (index, facet) {
                    name = facet.name;
                    if (facet.style === 'RANGE' || facet.style === 'STATS') {
                        if (facet.stype === 'date') {
                            name = '[' + encodeURIComponent(facet.model[0] + ' TO ' + facet.model[1]) + ']';
                        } else {
                            name = '[' + facet.model[0] + ' TO ' + facet.model[1] + ']';
                        }
                    } else {
                        name = converter.solrReady(name);
                    }
                    filterList.push(facet.filter + ':' + name);
                });
                return filterList;
            },

            getFilterParams: function () {
                return converter.toSolrParams(filters);
            },

            getSolrList: function () {
                return converter.toSolrQueryList(filters);
            },

            getFilters: function () {
                return filters;
            },

            setFilters: function(fq) {
                _syncFilters(fq);
            },

            getSelectedFilters: function () {
                return filterMap;
            },

            addFilter: function (facet) {
                if (!filterMap[facet.name]) {
                    //TODO may.shi what is this for? committed on 2/20
                    if (facet.filter === 'rowCount') {
                        filters = _.reject(filters, function(el){
                            if (el.filter === 'rowCount') {
                                delete filterMap[el.name];
                                return true;
                            }
                            return false;
                        });
                    }
                    filters.push(facet);
                    filterMap[facet.name] = facet;
                }
            },

            removeFilter: function (facet) {
                var isCalendar = facet.style === 'DATE' || (!angular.isUndefined(facet.stype) && facet.stype === 'date');
                var isRange = facet.style === 'RANGE';

                filters = _.reject(filters, function (el) {
                    if (isCalendar || isRange) {
                        return el.filter === facet.filter;
                    } else {
                        return el.name === facet.name;
                    }
                });

                // remove OR filters
                filters.forEach(function(filter) {
                    if (filter.name.indexOf('(') === 0 && filter.name.indexOf(facet.name) !== -1) {
                        filter.name = _replaceName(filter.name, facet.name);
                        filter.pretty = _replaceName(filter.pretty, facet.name);
                        filter.humanized = _replaceName(filter.humanized, facet.name);
                    }
                });

                if (isCalendar || isRange) {
                    delete filterMap[facet.filter];
                } else {
                    delete filterMap[facet.name];
                }
            },

            clear: function () {
                _clear();
            },

            setBounds: function (bounds, type) {
                if (type) {
                    if (type === 'WITHIN') {
                        boundsType = 'IsWithin';
                    } else {
                        boundsType = type;
                    }
                }
                searchBounds = bounds;
            },

            getBounds: function () {
                return searchBounds;
            },

            getBoundsType: function () {
                return boundsType;
            },

            getBoundsParams: function () {
                var bounds = '';
                if (searchBounds) {
                    bounds = '&fq=bbox:\"' + boundsType + '(' + searchBounds + ')\"';
                }
                return bounds;
            },

            applyFromUrl: function (params) {
                var deferred = $q.defer();
                configService.setFilterConfig(params.disp).then(function(config) {
                    rangeService.fetchAllRangeLimits().then(function() {
                        _syncFilters(params.fq, config.configId !== params.disp);
                        deferred.resolve({});
                    });
                });
                return deferred.promise;
            },

            clearBbox: function() {
                searchBounds = null;
            },

            setStatsFields: function(statsFields) {
                _statsFields = statsFields;
            },

            getFilterState: function(filter) {
                return filterState[filter.field];
            },

            setFilterState: function(filter, state) {
                filterState[filter.field] = state;
            },

            removeExisting: function(facet) {
                var self = this;
                $.each(filters, function (index, selectedFilter) {
                    if(selectedFilter.filter === facet.filter) {
                        self.removeFilter(facet);
                        return false;
                    }
                });
            },

            removeThisFilter: function(facet) {
                filters = _.reject(filters, function (filter) {
                    if (filter.filter === facet.filter) {
                        delete filterMap[filter.name];
                        filter.isSelected = false;
                        return true;
                    }
                    return false;
                });
            }

        };

    });
