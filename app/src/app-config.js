/*global config */
angular.module('portalApp')
    .config(function ($stateProvider, $httpProvider, $urlRouterProvider, $analyticsProvider, $locationProvider) {
        'use strict';

        $locationProvider.html5Mode(true);

        function _loadIfAllowed(authService, $q, configLoader, $location) {
            return authService.getPrivileges().then(function() {
                if(!authService.hasPermission('view')) {
                    return $q.reject('Not Authorized');
                } else {
                    return configLoader.load($location.search().disp);
                }
            });
        }

        function _canProcess(authService, $q) {
            return authService.getPrivileges().then(function() {
                if(!authService.hasPermission('process')) {
                    return $q.reject('Not Authorized');
                } else {
                    return $q.when({});
                }
            });
        }

        $stateProvider
            .state('search', {
                url: '/search?fq&q&vw&place',
                reloadOnSearch: false,
                views: {
                    '' : {
                        templateUrl: 'src/search/search.html'
                    },
                    'filters@search': {
                        'templateUrl':'src/filters/filters.html',
                        'controller':'FiltersCtrl'
                    },
                    'card-results@search': {
                        'templateUrl':'src/results/card-results.html'
                    },
                    'table-results@search': {
                        'templateUrl':'src/results/table-results.html'
                    },
                    'grid-results@search': {
                        'templateUrl':'src/results/grid-results.html'
                    },
                    'selected-filters@search': {
                        'templateUrl':'src/filters/selected-filters.html',
                        'controller':'SelectedFiltersCtrl'
                    }
                },
                resolve: {
                    load: function (configLoader, $location, $q, authService) {
                        return _loadIfAllowed(authService, $q, configLoader, $location);
                    }
                }
            })
            .state('home', {
                url: '/home',
                templateUrl: 'src/home/home.html',
                resolve: {
                    load: function (configLoader, $location, $q, authService) {
                        if(config.homepage.showHomepage === true) {
                            return _loadIfAllowed(authService, $q, configLoader, $location);
                        } else {
                            return $q.reject('Not Visible');
                        }
                    }
                }
            })
            .state('details', {
                reloadOnSearch: true,
                url: '/show?id&disp&shard',
                views: {
                    '': {
                        templateUrl: 'src/details/details.html'
                    },
                    'preview@details': {
                        templateUrl: 'src/details/preview.html'
                    }
                },
                resolve: {
                    load: function (detailConfig, $location, $q, authService) {
                        return _loadIfAllowed(authService, $q, detailConfig, $location);
                    }
                }
            })
            .state('login', {
                url: '/login',
                templateUrl: 'common/security/login.html',
                controller: 'AuthPageCtrl',
                resolve: {
                    load: function ($q, authService) {
                        return authService.loadPrivileges();
                    }
                }
            })
            .state('queue', {
                url: '/queue',
                templateUrl: 'src/cart/cart.html',
                resolve: {
                    load: function ($q, authService) {
                        return _canProcess(authService, $q);
                    }
                }
            })
            .state('tasks', {
                url: '/tasks',
                templateUrl: 'src/taskrunner/tasks.html',
                resolve: {
                    load: function ($q, authService) {
                        return _canProcess(authService, $q);
                    }
                }
            })

            .state('task', {
                url: '/task',
                templateUrl: 'src/taskrunner/task.html',
                params: {task: {}},
                resolve: {
                    load: function ($q, authService) {
                        return _canProcess(authService, $q);
                    }
                }
            })

            .state('history', {
                url: '/history',
                templateUrl: 'src/jobs/view-jobs.html',
                resolve: {
                    load: function ($q, authService) {
                        return _canProcess(authService, $q);
                    }
                }
            })
            .state('status', {
                url: '/status?id',
                templateUrl: 'src/taskrunner/status.html',
                resolve: {
                    load: function ($q, authService) {
                        return _canProcess(authService, $q);
                    }
                }
            })
            .state('chart', {
                url: '/chart',
                templateUrl: 'src/chart/chart.html'
            });

        $urlRouterProvider.otherwise(function($injector){
            $injector.invoke(function($state, config) {
                if (config.homepage.showHomepage === true) {
                    $state.go('home');
                } else {
                    $state.go('search');
                }
            });
        });

        //maintain session state
        $httpProvider.defaults.withCredentials = true;
        //cors
//        $httpProvider.defaults.useXDomain = true;
//        delete $httpProvider.defaults.headers.common['X-Requested-With'];

        //disable rest calls caching
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
//        //$httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';  // jshint ignore:line
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';  // jshint ignore:line
        $httpProvider.interceptors.push('httpRequestInterceptor');

        // TODO - send to custom analytics
        //$analyticsProvider.registerPageTrack(function (path) {
        //    console.log('analytics path: ' + path);
        //});

        $analyticsProvider.registerEventTrack(function (action, properties) {
            if (angular.isDefined(config.analyticsUrl)) {
                properties.action = action;
                //TODO - enable when log analytics api is added
                //$.post(config.analyticsUrl, {message: JSON.stringify(properties)});
            }
        });

    }).constant('config',config);