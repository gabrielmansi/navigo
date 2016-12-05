/*global angular, $ */

angular.module('voyager.util').
    factory('urlUtil', function (filterService) {

        'use strict';
        var lastUrl = 'search';

        var getPrefix = function (url) {
            var prefix = '&';
            if (url.indexOf('?') === -1) {
                prefix = '?';
            }
            return prefix;
        };

        return {
            //TODO pass params as JSON object
            buildSearchUrl2: function (solrParams, page, mapView, view, sort) {
                var url = 'search';
                var sep = '?';
                $.each(solrParams,function(key, value) {
                    if(value !== '*:*' && key !== 'sort') {  //don't apply all (default) wildcard to url, its implicit
                        url += sep + key + '=' + value;
                        sep = '&';
                    }
                });
                $.each(filterService.getFilters(), function (index, facet) {
                    if (facet.filter !== '') {
                        url += sep + 'fq=' + facet.filter + ':' + facet.name;
                    } else {  //solr function
                        url += sep + 'fq=' + encodeURIComponent(facet.name);
                    }
                    sep = '&';
                });

                if (page > 1) {
                    url += getPrefix(url) + 'pg=' + page;
                }
                if (!mapView) {
                    mapView = '0 0 0'; //default TODO get from config
                }
                url += getPrefix(url) + 'vw=' + mapView;

                if(view) {
                    url += getPrefix(url) + 'view=' + view;
                }

                if(sort) {
                    url += getPrefix(url) + 'sort=' + sort;
                }

                lastUrl = url;
                return url;
            },

            getLastUrl: function () {
                return lastUrl;
            },

            updateParam: function(name, oldValue, value) {
                var toReplace = name + '=' + oldValue;
                var update = name + '=' + value;
                if(lastUrl.indexOf(toReplace) !== -1) {
                    lastUrl = lastUrl.replace(toReplace,update);
                } else {
                    this.addParam(name, value);
                }
            },

            addParam: function(name, value) {
                lastUrl += '&' + name + '=' + value;
            },

            removeParam: function(name, value) {
                var toReplace = '&' + name + '=' + value;
                lastUrl = lastUrl.replace(toReplace,'');
            }
        };

    });
