/*global angular, $ */

angular.module('voyager.filters').
    factory('facetService', function ($http, config, translateService, $injector) {
        'use strict';

        var QueryBuilder;

        var isEven = function (someNumber) {
            return (someNumber % 2 === 0) ? true : false;
        };

        var _buildFacet = function (facetName, value, filter, selectedFilters) {
            var filterName = angular.isString(filter)? filter:filter.field;
            var builtValue = facetName + ' (' + value + ')';

            var facet = {name: facetName, value: builtValue, filter: filterName, style:filter.style};
            if (!config.rawFields[filterName]) {
                if(facet.filter === 'location') {
                    facet.humanized = translateService.getLocation(facet.name);
                } else {
                    facet.humanized = translateService.getType(facet.name);
                }
            } else {
                facet.humanized = facet.name;
            }
            facet.count = value;
            facet.display = facet.humanized;

            if (selectedFilters) {
                var selectedFilter = selectedFilters[facet.name];
                if (selectedFilter) {
                    facet.isSelected = true;
                } else {
                    // check for OR facets selected
                    _checkSelectedOr(selectedFilters, facet);
                }
            }
            return facet;
        };

        function _checkSelectedOr(selectedFilters, facet) {
            var selectedKeys = Object.keys(selectedFilters);
            for (var i=0; i<selectedKeys.length; i++) {
                var selected = selectedFilters[selectedKeys[i]];
                if (selected.name.indexOf('(') === 0) {
                    _checkSelectedOrFacet(selected, facet);
                    if (facet.isSelected) {
                        break;
                    }
                }
            }
        }

        function _checkSelectedOrFacet(selected, facet) {
            var facets = selected.name.replace('(','').replace(' )','').replace(')','');
            facets = facets.split(' ');
            for (var i=0; i<facets.length; i++) {
                if (facets[i] === facet.name) {
                    facet.isSelected = true;
                    break;
                }
            }
        }

        var _buildFacets = function (rawFacets, filter, selectedFilters) {
            var facets = [];
            $.each(rawFacets, function (index, value) {
                if (!isEven(index)) {
                    var facetName = rawFacets[index - 1];
                    var facet = _buildFacet(facetName, value, filter, selectedFilters);
                    facets.push(facet);
                }
            });
            return facets;
        };

        function lookup(filter, params, callback) {

            //TODO: circular ref here so can't inject via constuctor - fix
            if (!QueryBuilder) { QueryBuilder = $injector.get('queryBuilder'); }

            var service = QueryBuilder.buildAllFacets(params, filter.field);

            $http.jsonp(service).success(function (data) {
                var rawFacets = data.facet_counts.facet_fields[filter.field]; // jshint ignore:line
                callback(_buildFacets(rawFacets, filter));
            });

        }

        return {
            doLookup: function (filter, params, callback) {
                lookup(filter, params, callback);
            },
            buildFacet: function(facetName, value, filterName, selectedFilters) {
                return _buildFacet(facetName, value, filterName, selectedFilters);
            },
            buildFacets: function(rawFacets, filter, selectedFilters) {
                return _buildFacets(rawFacets, filter, selectedFilters);
            },
            buildAllFacets: function (filters, selectedFilters) {
                var nameValues = {};
                $.each(filters, function (filterName, values) {
                    var prettyFacetValues = _buildFacets(values,filterName, selectedFilters);
                    nameValues[filterName] = prettyFacetValues;
                });
                return nameValues;
            }
        };
    });
