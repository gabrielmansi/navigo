'use strict';

angular.module('voyager.filters').
    factory('filterStyle', function (config, facetService, configService, rangeService, filterService, complexFilterService) {

        function _decorateFacets(facetValues, filter) {
            $.each(facetValues, function (i, facet) {
                facet.style = filter.style;
                if(filter.style === 'RANGE') {
                    facet.numeric = parseInt(facet.name);
                } else if(facet.style === 'COMPLEX') {
                    facet.isSelected = complexFilterService.calculateIsSelected(facet, filterService.getSelectedFilters());
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
