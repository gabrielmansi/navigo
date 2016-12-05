'use strict';
angular.module('voyager.filters')
    .controller('FiltersCtrl', function ($scope, filterService, $location, $uibModal, $timeout, statsService, treeService, configService, filterQuery, translateService, filterStyle, calendarFilter, $document, catalogService) {

        var _busy = false;
        var _notifyFilter = false;

        $scope.maxFacets = 10;

        //TODO - the search controller fires a filterChanged event when initializing, causing a fetch here. move that code here.
        //_fetchFilter();

        $scope.$on('doSearch', function(){
            _notifyFilter = false;  //search event fired, don't fire back
            _fetchFilter();
        });

        $scope.$on('filterChanged', function(event, args){
            if(args && (args.from === 'filtersController' || args.refresh === false)) {
                //don't do anything if its fired from this controller
                _notifyFilter = false;
            } else {
                _notifyFilter = false;  //filter event fired, don't fire back
                _fetchFilter();
            }
        });

        function _appendIfMissing(filter, selectedFacet) {
            if (angular.isDefined(filter)) {
                var facetsMap = _.indexBy(filter.values, 'name');
                if (selectedFacet.name.indexOf('(') === 0) {  // OR filter
                    var facets = selectedFacet.name.replace(' )',')').replace(')','').replace('(','').split(' ');
                    facets.forEach(function(facet) {
                        var facetObj = angular.copy(selectedFacet);
                        facetObj.name = facet;
                        facetObj.pretty = facet;  // TODO - might need translation
                        facetObj.humanized = facet;
                        _appendIfMissing(filter, facetObj);
                    });
                } else if (angular.isUndefined(facetsMap[selectedFacet.name])) {
                    filter.values.push({name: selectedFacet.name, display: selectedFacet.humanized, style: selectedFacet.style, filter: selectedFacet.filter, isSelected: true, count: selectedFacet.count});
                }
            }
        }

        //if a facet is selected but not displayed under the filter because of the limit, add it
        function _showMissingSelectedFacets() {
            var selectedFilters = filterService.getFilters().slice(0);
            var filtersMap = _.indexBy($scope.filters, 'field');
            var i, selectedFacet, filter;
            for (i = 0; i < selectedFilters.length; i++) {
                selectedFacet = selectedFilters[i];
                if(selectedFacet.style === 'CHECK') {  //only happens on OR filters
                    filter = filtersMap[selectedFacet.filter];
                    _appendIfMissing(filter, selectedFacet);
                }
            }
        }

        $scope.$on('searchResults', function (event, data) {
            if (angular.isDefined(data.stats)) {
                filterService.setStatsFields(data.stats.stats_fields);  // jshint ignore:line
            }
        });

        //TODO put in date picker directive
        $scope.openMinDatePicker = function($event, facet) {
            $event.preventDefault();
            $event.stopPropagation();
            facet.isMinOpened = true;
            facet.isMaxOpened = false;
        };

        $scope.openMaxDatePicker = function($event, facet) {
            $event.preventDefault();
            $event.stopPropagation();
            facet.isMaxOpened = true;
            facet.isMinOpened = false;
        };

        //click events
        $scope.filterResults = function (facet) {
            var shards = [];
            // to keep the checkbox state in sync with the filters state.
            // TODO: handle this in a more elegant way.
            var forceSelectedParameter = false;
            // logic reversal!  'checked' is from the 'show all' modal (see facetscontroller $scope.filterResults).
            // the logic below this will select the facet if isSelected == false.
            if (angular.isDefined(facet.checked)) {
                facet.isSelected = !facet.checked;
                delete facet.checked;
                forceSelectedParameter = true;
            }
            if (facet.isSelected) {
                if (facet.field === 'shard') {
                    $scope.removeFilter(facet);
                } else {
                    filterService.removeFilter(facet);
                    facet.isSelected = false;
                }
                if(forceSelectedParameter) {
                    // force sync with 'show all' modal.
                    facet.isSelected = false;
                }
            } else {
                if (facet.field === 'shard') {
                    var urlShards = $location.search().shards;
                    if (urlShards !== '' && angular.isDefined(urlShards)) {
                        shards = urlShards.split(',');
                    }
                    shards.push(facet.id);
                    $location.search('shards', shards.join());  //update url
                } else {
                    filterService.addFilter(facet);
                    if(forceSelectedParameter) {
                        // force sync with 'show all' modal.
                        facet.isSelected = true;
                    }
                }
            }
            $location.search('fq', filterService.getFilterAsLocationParams());  //apply new filter param to url
            //$scope.$emit('filterEvent', {});  //fire filter event
            //$scope.$emit('searchEvent', {});
            _notifyFilter = true;
            _fetchFilter();
        };

        $scope.filterOnly = function(facet) {
            filterService.removeThisFilter(facet);
            _addFilter(facet);
        };

        function _addFilter(facet) {
            filterService.removeExisting(facet);
            filterService.addFilter(facet);
            $location.search('fq', filterService.getFilterAsLocationParams());  //apply new filter param to url
            _notifyFilter = true;
            _fetchFilter();
        }

        $scope.addRangeFilter = function (facet) {
            //facet.isSelected = true;
            var range = facet.model;
            facet.humanized = facet.display + ': [' + range[0] + ' TO ' + range[1] + ']';
            _addFilter(facet);
        };

        $scope.addCalendarFilter = function (facet) {
            var calendarFacet = calendarFilter.decorate(facet);
            if(calendarFacet) {
                _addFilter(facet);
            }
        };

        $scope.addFolderFilter = function (node) {
            //facet.isSelected = true;
            var facet = {field:'path_path', filter:'path_path', humanized : 'Path: ' + node.path, name:node.path};
            _addFilter(facet);
        };

        $scope.loadNode = function (node) {
            //facet.isSelected = true;
            node.collapsed = !node.collapsed;
            if(!node.loaded) {
                treeService.loadNode($location.search(), filterService.getFilterParams(), filterService.getBoundsParams(), $scope.filters, node);
            }
        };

        function _clearBounds() {
            $location.search('bbox', null);  //remove filter from url
            $location.search('bboxt', null);
            $scope.$emit('clearBboxEvent', {});
        }

        function _clearSearchInput() {
            $location.search('q', null);
            $scope.$emit('clearSearchEvent', {});
        }

        $scope.removeFilter = function (facet) {
            if (facet.isInput) {
                _clearSearchInput();
            } else if (facet.isBbox) {
                _clearBounds();
            } else if (facet.field === 'shard') {
                var shards = $location.search().shards.split(',');
                var urlShards = [];
                facet.selected = false;
                _.each(shards, function(shard) {
                    if(facet.id === shard) {
                        //facet.selected = false;
                    } else {
                        urlShards.push(shard);
                    }
                });
//                var urlShards = _.reject(shards,function(val) {
//                    return val === facet.display;
//                });
                $location.search('shards', urlShards.join());  //update url
            } else {
                filterService.removeFilter(facet);
                $location.search('fq', filterService.getFilterAsLocationParams());  //remove filter from url
            }

            _notifyFilter = true;
            _fetchFilter();
        };

        $scope.$on('removeFilter', function (e,facet) {
            $scope.removeFilter(facet);
        });

        $scope.hasFacets = function (filter) {
            return filter.values.length > 0;
        };

        $scope.hasMoreFacets = function (filter) {
            return filter.values.length > $scope.maxFacets;
        };

        function _scrollIntoView(filter) { // TODO create a directive for this
            $timeout(function() {  // let scope digest and render
                var clientHeight = $document[0].documentElement.clientHeight;
                var element = $('#' + filter.field);
                if (element[0].getBoundingClientRect().bottom > clientHeight) {
                    $('body').animate({scrollTop: element.offset().top}, 'slow');
                }
            }, 250);
        }

        $scope.toggleDisplayState = function (filter) {
            //timeout allows the directive to fire first
            $timeout(function() {
                if(filter.displayState !== 'in') {
                    filter.displayState = 'in';
                } else {
                    filter.displayState = '';
                }
                filterService.setFilterState(filter,filter.displayState);

                if(filter.displayState === 'in') {
                    _scrollIntoView(filter);
                }

            }, 0);
        };

        $scope.showAllFacets = function (filter) {
            var modalInstance = $uibModal.open({
                templateUrl: 'src/filters/facets.html',
                controller: 'FacetsCtrl',
                resolve: {
                    selectedFilter: function () {
                        return filter;
                    },
                    updateFilters: function () {
                        return $scope.filterResults;
                    }
                }
            });

            modalInstance.result.then(function (facet) {
                $scope.filterResults(facet);
            }, function () {
                //$log.info('Modal dismissed at: ' + new Date());
            });
        };

        $scope.getFieldName = function(key) {
            return translateService.getFieldName(key) || key;
        };

        function _fetchFilter() {
            if (_busy) {
                return;
            }

            _busy = true;
            filterService.applyFromUrl($location.search()).then(function() {
                _busy = false;
                //if ($location.search().view !== 'table' && _notifyFilter) {  //TODO table view fires a search event, don't do it twice
                //TODO will this cause the table view to fire twice
                if(_notifyFilter) {
                    $scope.$emit('filterEvent', {from:'filtersController'});
                }

                catalogService.loadRemoteLocations().then(function() {
                    filterQuery.execute($location.search(), filterService.getFilterParams(), filterService.getBoundsParams(), filterService.getSelectedFilters()).then(function(res) {
                        $scope.filters = filterStyle.apply(res.filters);

                        if(!_.isEmpty(res.badShards)) {
                            configService.getCatalogs().then(function() { //catalog facets are built
                                var catalogFilter = _.find($scope.filters, {field:'shards'}), shardUrl;
                                //flag the bad shards
                                _.each(catalogFilter.values, function(catalogFacet) {
                                    if(angular.isDefined(catalogFacet.raw)) { //local shard won't have this
                                        shardUrl = catalogFacet.raw;
                                        shardUrl = shardUrl.substring(shardUrl.indexOf('://')+3);
                                        shardUrl = shardUrl + 'solr/v0';
                                        catalogFacet.hasError = angular.isDefined(res.badShards[shardUrl]);
                                    }
                                });
                            });
                        }
                        _showMissingSelectedFacets();
                        statsService.updateStats($location.search(), filterService.getFilterParams(), filterService.getBoundsParams(), $scope.filters);
                        treeService.updateTree($location.search(), filterService.getFilterParams(), filterService.getBoundsParams(), $scope.filters);
                    });
                });
            });
        }
    });
