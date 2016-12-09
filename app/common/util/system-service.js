'use strict';

angular.module('voyager.util').
    factory('systemService', function ($http, $timeout, config, authService) {

        var restartAPI = 'api/rest/system/restart';

        function _doRestart() {
            return $http({
                method: 'POST',
                url: config.root + restartAPI,
                headers: {'Content-Type': 'application/json'}
            });
        }

        var _pollPromise;
        var _pollSuccessCallback;
        var _pollInterval;

        function _startPollUserInfo(successCallback, interval) {
            _pollSuccessCallback = successCallback;
            _pollInterval = interval;
            _nextPoll(_pollUserInfo, _pollInterval);
        }

        function _pollUserInfo() {
            authService.getUserInfo().then(function (resp) {
                if(!resp) {
                    console.log("POLLED USER INFO UNDEFINED!");
                    _nextPoll(_pollUserInfo, _pollInterval);
                } else {
                    console.log("POLLED USER INFO RETURNED: ");
                    console.log(resp);

                    _pollSuccessCallback();

                    _pollPromise = undefined;
                    _pollInterval = undefined;
                    _pollSuccessCallback = undefined;
                }
            }).catch(function (resp) {
                console.log("ERROR POLLING USER INFO!");
                console.log(resp);
                _nextPoll(_pollUserInfo, _pollInterval);
            });
        };

        function _nextPoll(pollCallback, interval) {
            interval = interval || 1000;

            $timeout.cancel(_pollPromise);
            _pollPromise = $timeout(pollCallback, interval);
        };

        return {
            doRestart: function() {
                return _doRestart();
            },

            checkForLife: function(successCallback, pollInterval) {
                _startPollUserInfo(successCallback, pollInterval);
            }
        };
    });