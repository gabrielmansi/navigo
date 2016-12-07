'use strict';

angular.module('voyager.util').
    factory('systemService', function ($http, config, authService) {

        var restartAPI = 'api/rest/system/restart';

        function _doRestart() {
            if(authService.hasPermission('manage')) {
                return $http({
                    method: 'POST',
                    url: config.root + restartAPI,
                    headers: {'Content-Type': 'application/json'}
                });
            }
        }

        return {
            doRestart: function() {
                return _doRestart();
            }
        };
    });