/*global angular, $, querystring, config */

angular.module('voyager.search').
    factory('savedSearchService', function (
    sugar, $http, configService, $q, authService, $uibModal, recentSearchService, $location, filterService, $analytics, converter, displayConfigResource, solrGrunt, $timeout, catalogService) {
        'use strict';

        var observers = [];

        function _applyBbox(solrParams, voyagerParams) {
            if(_.isArray(solrParams.fq)) {
                var index = sugar.getIndex(solrParams.fq, 'bbox');
                solrParams.fq.splice(index, 1);  //remove bbox param from fq and add as explicit bbox param?
            } else {
                delete solrParams.fq;  //remove bbox param
            }
            solrParams.place = voyagerParams.bbox;
            solrParams['place.op'] = (voyagerParams['bbox.mode'] === 'WITHIN') ? 'within':'intersects';
        }

        function _getView(voyagerParams, defaultView) {
            defaultView = ((defaultView) ? defaultView.toLowerCase() : 'card');
            var view = {'type':defaultView};
            if(angular.isDefined(voyagerParams.view)) {
                voyagerParams.view = voyagerParams.view.toLowerCase();
                if(voyagerParams.view === 'table' || voyagerParams.view === 'map') {
                    view.type = voyagerParams.view;
                }
            }
            return view;
        }

        function _decode(params) {
            $.each(params, function(index, param) {
                if( typeof param === 'string' ) {
                    params[index] = decodeURIComponent(param);
                } else {  //array
                    $.each(param, function(index, value) {
                        param[index] = decodeURIComponent(value);
                    });
                }
            });
        }

        function _doSave(request) {
            if(configService.hasChanges()) {
                var settings = configService.getUpdatedSettings();
                request.display_override = {listView: {fields: settings.listView.fields}};
            }
            //request.query += '/disp=' + request.config;
            request.path += '/disp=' + request.config;
            return sugar.postJson(request, 'display', 'ssearch');
        }

        function _getQueryString(name) {
            var rows = 150;  //TODO set to what we really want
            var queryString = config.root + 'solr/ssearch/select?&fl=*,display:[display]&';
            queryString += 'rows=' + rows + '&rand=' + Math.random();
            if (angular.isDefined(name)) {
                name = name.replace(/ /g, '\\%20');  // jshint ignore:line
                queryString += '&fq=title:' + name;
            }
            queryString += '&wt=json&json.wrf=JSON_CALLBACK';
            return queryString;
        }

        function _fetch(name) {
            return $http.jsonp(_getQueryString(name)).then(function (data) {
                return data.data.response.docs;
            }, function(error) {
                //@TODO: handle error
                console.log(error);
                return error;
            });
        }

        //public methods - client interface
        return {
            getSavedSearches: function() {
                return _fetch();
            },

            fetch: function(savedSearch) {
                return _fetch(savedSearch.title);
            },

            getParams: function(saved) {
                var solrParams = querystring.parse(sugar.trim(saved.query,'&'));

                // these will get applied later to solr call - don't duplicate
                delete solrParams.facet;
                delete solrParams['facet.field'];
                delete solrParams['facet.mincount'];
                delete solrParams['extent.bbox'];

                _decode(solrParams);  //workaround - seems the params get encoded twice

                var voyagerParams;

                //@TODO: need to change in the back end to use path instead query
                if (saved.path === undefined) {
                    voyagerParams = querystring.parse(sugar.trim(saved.query.replace(/\//g,'&'),'&'));
                } else {
                    voyagerParams = querystring.parse(sugar.trim(saved.path.replace(/\//g,'&'),'&'));
                }

                if (angular.isDefined(voyagerParams.catalog) && angular.isUndefined(solrParams.shards)) {
                    // TODO why is shards missing on a federated saved search?
                    solrParams.shards = _.isArray(voyagerParams.catalog) ? voyagerParams.catalog.join(',') : voyagerParams.catalog;
                }

                if (angular.isDefined(solrParams.shards)) {
                    solrParams.shards = catalogService.removeInvalid(solrParams.shards);
                }

                if(angular.isDefined(voyagerParams.bbox)) {
                    _applyBbox(solrParams, voyagerParams);
                }

                if(angular.isDefined(voyagerParams.disp)) {
                    solrParams.disp = voyagerParams.disp;
                }

                var view = _getView(voyagerParams, ((saved.display) ? saved.display.defaultView : undefined));
                solrParams.view = view.type;
                if (angular.isDefined(solrParams.sort)) {
                    var sort = solrParams.sort.split(' ');
                    solrParams.sort = sort[0].replace('_sort','');  //TODO workaround, bug with saved search?
                    solrParams.sortdir = sort[1];
                } else {
                    //solrParams.sortdir = 'desc';
                }
                return solrParams;
            },

            addObserver: function (obs) {
                var index = _.findIndex(observers, obs);
                if (index === -1) {
                    observers.push(obs);
                }
            },

            removeObserver: function (observer) {
                observers = _.without(observers, observer);
            },

            saveSearch: function(savedSearch, params) {
                savedSearch.config = configService.getConfigId();

                // TODO - remove - .query is derived from path
                //var solrParams = solrGrunt.getSolrParams(params);
                //savedSearch.query = $.param(solrParams, true);
                savedSearch.path = converter.toClassicParams(params, true);
                return _doSave(savedSearch);
            },

            deleteSearch: function(id){
                return $http.delete(config.root + 'api/rest/display/ssearch/' + id).then(function(){
                    observers.forEach(function (entry) {
                        entry(id);
                    });
                });
            },

            showSaveSearchDialog: function (item) {
                var modalInstance = $uibModal.open({
                    templateUrl: 'src/saved-search/save-search-dialog.html',
                    size: 'md',
                    controller: 'SaveSearchDialog',
                    resolve: {
                        searchItem: function() {
                            return item;
                        }
                    }
                });

                modalInstance.result.then(function () {

                }, function () {
                    //$log.info('Modal dismissed at: ' + new Date());
                });
            },

            showSearchModal: function(tab) {
                var modalInstance = $uibModal.open({
                        templateUrl: 'src/saved-search/saved-search-modal.html',
                        size:'lg',
                        controller: 'SavedSearchModalCtrl',
                        resolve: {
                            tab: function() {
                                return tab;
                            }
                        }
                    });

                modalInstance.result.then(function () {

                }, function () {
                    //$log.info('Modal dismissed at: ' + new Date());
                });
            },
            applySavedSearch: function(saved, $scope) {
                var currentView = $location.search().view;
                var solrParams = this.getParams(saved);

                $scope.$emit('clearSearchEvent');

                $location.search(solrParams);
                // force redirection to /search from home page (VG-4050)
                if ($location.path() !== '/search') {
                    $location.path('/search');
                }
                configService.updateConfig(saved.display);
                filterService.applyFromUrl($location.search()).then(function() {
                    // when the table renders it will force a search event so don't emit here
                    var params = {};
                    if (solrParams.view === 'table' && currentView === 'table') {
                        params.refresh = false;  // table fires its own search during init
                    }
                    $timeout(function() {  // let scope digest so table is removed/columns reset in case sizes change
                        $scope.$emit('filterEvent', params);
                    });
                });

                $analytics.eventTrack('saved-search', {
                    category: 'run'
                });
                this.addToRecent(saved);
            },
            addToRecent: function(searchItem) {
                var item = {};
                item.id = searchItem.id;
                item.title = searchItem.title;
                item.query = this.getParams(searchItem);
                item.query = sugar.toQueryStringEncoded(item.query);
                item.saved = true;
                recentSearchService.addItem(item);
            },
            order: function(id, beforeId, afterId) {
                var data = '';
                if(beforeId !== null) {
                    data += 'before=' + beforeId;
                }
                if(data !== '') {
                    data += '&';
                }

                if(afterId !== null) {
                    data += 'after=' + afterId;
                }
                return sugar.postForm('api/rest/display/ssearch/' + id + '/order', data);
            },
            sortSavedSearches: function(savedSearches) {
                var global = [], personal = [];
                var userHasSaveSearch = authService.hasPermission('save_search');
                var authUser = authService.getUser();
                $.each(savedSearches, function(index, saved) {
                    if((authUser) && (userHasSaveSearch))
                    {
                        if(saved.owner === authUser.name) {
                            personal.push(saved);
                        } else {
                            global.push(saved);
                        }
                    } else {
                        global.push(saved);
                    }
                });

                var sortedSavedSearches = {
                    global: global,
                    personal: personal
                };

                return sortedSavedSearches;
            }
        };
    });
