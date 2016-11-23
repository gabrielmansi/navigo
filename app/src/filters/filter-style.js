'use strict';

angular.module('voyager.filters').
    factory('filterStyle', function (config, facetService, configService, rangeService, filterService) {

        function _allFiltersSelected(facet) {
            var selectedFilters = filterService.getSelectedFilters();
            if(facet.name.constructor === Array && facet.filter.constructor === Array) {
                //can not apply when lengths are different
                if (facet.name.length === facet.filter.length) {
                    var containsAll = true;
                    $.each(facet.name, function (index, facetName) {
                        var facetFilter = facet.filter[index];
                        containsAll = containsAll && (!!selectedFilters[facetName] && selectedFilters[facetName].filter === facetFilter);
                        //_containsFacet(selectedFilters, facetName, facetFilter);
                    });
                    return containsAll;
                }
            } else {
                return (!!selectedFilters[facet.name] && selectedFilters[facet.name].filter === facet.filter);
            }
            return false;
        }

        function _containsFacet(facetList, facetName, facetFilter) {
            for(var i=0; i<facetList.length; i++) {
                if(facetList[i].name === facetName && facetList[i].filter === facetFilter) {
                    return true;
                }
            };
            return false;
        }

        function _decorateFacets(facetValues, filter) {
            $.each(facetValues, function (i, facet) {
                facet.style = filter.style;
                if(filter.style === 'RANGE') {
                    facet.numeric = parseInt(facet.name);
                } else if(facet.style === 'COMPLEX') {
                    facet.isSelected = _allFiltersSelected(facet);
                }
            });
        }

        function _decorateFilters(systemFilters, facets) {
            var selectedFilters = filterService.getFilters();
            $.each(systemFilters, function (index, filter) {
                var facetValues = facets[filter.field] || filter.values, selectedFilter;
                if (facetValues && facetValues.length > 0) {
                    facetValues.multivalued = filter.multivalued;
                    facetValues.stype = filter.stype;

                    _decorateFacets(facetValues, filter);
                    if(filter.style !== 'RANGE' && filter.style !== 'STATS' && filter.style !== 'HIERARCHY') {
                        filter.values = facetValues;
                    } else if (filter.style !== 'HIERARCHY') {  //hierarchy filters are loaded async via tree service
                        selectedFilter = _.find(selectedFilters,{'filter':filter.field});
                        if (filter.stype === 'date') {
                            filter.values = [rangeService.buildCalendarFilter(filter, selectedFilter)];
                        } else {
                            filter.values = [rangeService.buildRangeFilter(filter, selectedFilter)];
                        }
                    }
                }
                filter.displayState = filterService.getFilterState(filter);
            });
        }

        return {

            apply: function (filters) {
                var displayFilters = configService.getDisplayFilters();
                _decorateFilters(displayFilters, filters);
                return displayFilters;
            }
        };
    });
