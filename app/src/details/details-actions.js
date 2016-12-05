(function() {
    'use strict';

    angular.module('voyager.details').factory('detailsActions', detailsActions);

    function detailsActions($window, $analytics, config, sugar, authService) {

        function _isVisible(action, doc, $scope) {
            var visible = action.visible;
            action.enabled = angular.isUndefined(action.enabled) ? true : action.enabled;
            visible = action.enabled ? visible : false;
            if (visible === true || visible === false) {
                return visible;
            } else if (visible.indexOf('doc.') > -1) {
                // expression
                visible = $scope.$eval(visible) && (action.action !== 'preview' && action.action !== 'tag');
            } else {
                // add has a separate button, preview is automatic when page loads, tag is handled below the actions
                visible = doc[action.visible] && (action.action !== 'preview' && action.action !== 'tag');
            }
            return action.enabled ? visible : false;
        }

        function _setAction(action, doc, $scope) {
            action.visible = _isVisible(action, doc, $scope);
            doc.isopen = false;
            if (action.action === 'download') {
                if(angular.isDefined(doc.download)) {
                    if(sugar.canOpen(doc)) {
                        action.text = action.alt;
                    }
                }
                action.do = function() {
                    $analytics.eventTrack('download', {
                        category: 'results', label: doc.format // jshint ignore:line
                    });
                    if(sugar.canOpen(doc)) {
                        $window.open(doc.download);
                    } else {
                        authService.getUserInfo().then(function(user) {
                            $window.location.href = doc.download + sugar.paramDelimiter(doc.download) + '_vgp=' + user.exchangeToken ;
                        });
                    }
                };
            } else if (action.action === 'open') {
                action.do = function() {
                    $analytics.eventTrack('openWith', {
                        category: 'results', label: action.url // jshint ignore:line
                    });
                    var param = '';
                    if (action.url.indexOf('?') === -1) {
                        param = '?url='; //default for esri if not supplied
                    }
                    if (action.param) {
                        param = '?' + action.param + '=';
                    }
                    $window.open(action.url + param + encodeURIComponent(doc.fullpath));
                };
            } else if (action.action === 'openArcMap') {
                action.do = function() {
                    $analytics.eventTrack('openArcMap', {
                        category: 'results', label: doc.id // jshint ignore:line
                    });
                    $window.location.href = doc.layerURL;
                };
            }
        }

        function _getActions(doc, $scope) {
            var actions = _.cloneDeep(config.docActions);
            _.each(actions, function(action) {
                _setAction(action, doc, $scope);
                action.display = angular.isDefined(action.display) ? action.display : action.text;
            });
            return actions;
        }

        //public methods - client interface
        return {
            setAction : _setAction,
            getActions: _getActions
        };
    }

})();