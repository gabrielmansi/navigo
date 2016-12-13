angular.module('portalApp', [
    'ngResource',
    'ngSanitize',
    'ngTable',
    'ngTableResizableColumns',
    'ngAria',
    'angularSpinner',
    'ui.router',
    'ui.bootstrap',
    'ui.slider',
    'ui.select2',
    'ui.sortable',
    'LocalStorageModule',
    'cart',
    'taskRunner',
    'voyager.config',
    'voyager.security',
    'voyager.filters',
    'voyager.map',
    'voyager.util',
    'voyager.modal',
    'voyager.layout',
    'voyager.home',
    'voyager.search',
    'voyager.results',
    'voyager.details',
    'voyager.tagging',
    'voyager.component',
    'tree.directive',
    'angulartics',
    'angulartics.google.analytics',
    'voyager.common.featured'
])
.factory('httpRequestInterceptor', function ($analytics, $injector, $q, $log) {
    'use strict';
    return {
        response: function(response) {
            var err = response.headers('x-access-token-error');
            if(!_.isEmpty(err)) {
                $log.error('Error with JWT Token', err);
                var $state = $injector.get('$state');
                $state.go('login');
            }
            return response;
        },
        responseError: function(response) {
            if (response.status === 419) { // token timed out
                $log.error('token timed out');
                var $state = $injector.get('$state');
                $state.go('login');
            } else {  // call analytics and reject
                var url = 'unknown';
                if(response.config) {
                    url = response.config.url;
                }
                $analytics.eventTrack('error', {
                    category: 'http', label: url, value:response.status  // jshint ignore:line
                });
            }
            return $q.reject(response);
        }
    };
});