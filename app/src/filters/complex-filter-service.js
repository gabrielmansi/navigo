'use strict';
angular.module('voyager.filters')
    .factory('complexFilterService', function () {
        //NOTE: facets with the complex type must have their name and filter values stored in arrays of equal length
        var _complexFilterStyle = 'COMPLEX';

        var _discoveryStatusFilter_Field = 'discoveryStatus';
        var _discoveryStatusFilter_Value = 'Discovery Status';
        var _discoveryStatusFilter_Values = [
            {
                name: ['(SCAN SCAN_FULL)', 'false'],
                value: 'First Pass: Scan Complete',
                filter: ['_index_reason', '__to_extract'],
                humanized: '1st Pass: Scan Complete',
                count: 0,
                hasCount: false,
                display: '1st Pass: Scan Complete',
                style: 'COMPLEX'
            },
            {
                name: ['true'],
                value: 'Second Pass: Read Pending',
                filter: ['__to_extract'],
                humanized: 'nd Pass: Read Pending',
                count: 0,
                hasCount: false,
                display: '2nd Pass: Read Pending',
                style: 'COMPLEX'
            },
            {
                name: ['CHECKOUT', 'false'],
                value: 'Second Pass: Read Complete',
                filter: ['_index_reason', '__to_extract'],
                humanized: '2nd Pass: Read Complete',
                count: 0,
                hasCount: false,
                display: '2nd Pass: Read Complete',
                style: 'COMPLEX'
            }
        ];


        function _createComplexFilter(filterField, filterValue, filterValues) {
            var complexFilter = {
                field: filterField,
                value: filterValue,
                values: [],
                style: _complexFilterStyle
            };

            return _updateComplexFilter(complexFilter, filterValue, filterValues);
        }

        function _updateComplexFilter(filter, filterValue, filterValues) {
            if(filterValue) {
                filter.value = filterValue;
            }

            if(filterValues) {
                filter.values = filterValues;
            }

            return filter;
        }

        function _calculateIsSelected(facet, selectedFilters) {
            var isSelected = true;
            //assume that complex facets have name and filter values that are both arrays of the same length
            $.each(facet.name, function (index, facetName) {
                var facetFilter = facet.filter[index];
                isSelected = isSelected && (!!selectedFilters[facetName] && selectedFilters[facetName].filter === facetFilter);
            });
            return isSelected;
        }


        return {
            calculateIsSelected: function(facet, selectedFilters) {
                return _calculateIsSelected(facet, selectedFilters);
            },

            createDiscoveryStatusFilter: function(discoveryStatusFilter, facetTypes) {
                if(!discoveryStatusFilter) {
                    discoveryStatusFilter = _createComplexFilter(_discoveryStatusFilter_Field, _discoveryStatusFilter_Value, _discoveryStatusFilter_Values);
                    facetTypes.unshift(discoveryStatusFilter);
                } else {
                    _updateComplexFilter(discoveryStatusFilter, _discoveryStatusFilter_Value, _discoveryStatusFilter_Values);
                }
            }
        };
    });