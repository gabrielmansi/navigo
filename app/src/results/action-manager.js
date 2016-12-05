(function() {
    'use strict';

    angular.module('voyager.results')
        .factory('actionManager', actionManager);

    function actionManager($window, $analytics, $uibModal, authService, sugar, config, $location) {

        function _isVisible(action, scope) {
            var visible = action.visible;
            if (visible === true || visible === false) {
                return visible;
            } else if (visible.indexOf('doc.') > -1) {
                // expression
                return scope.$eval(visible);
            }

            return scope.doc[action.visible];
        }

        function _toggleDisplay(action, scope) {
            if(scope.doc[action.toggle] === true) {
                action.display = action.off;
                action.icon = action.offIcon;
                if (scope.isTable) {
                    action.display = action.offList;
                }
                action.buttonType = 'btn-default';
            } else {
                action.display = action.text;
                action.icon = action.onIcon;
                action.buttonType = 'btn-primary';
            }
        }

        function _setAction(action, scope) {
            action.visible = _isVisible(action, scope);
            if(action.action === 'add') {
                action.do = function() {
                    scope.doc.isopen = false;
                    scope.toggleCart(scope.doc);
                    _toggleDisplay(action, scope);
                };
                _toggleDisplay(action, scope);
            } else if (action.action === 'preview') {
                action.do = function() {
                    scope.doc.isopen = false;
                    scope.addToMap(scope.doc);
                    $window.scrollTo(0,0);
                };
            } else if (action.action === 'download') {
                action.do = function() {
                    scope.doc.isopen = false;
                    $analytics.eventTrack('download', {
                        category: 'results', label: scope.doc.format // jshint ignore:line
                    });
                    //TODO not sure if we need category of GIS but we don't want to do this with general images
                    //if(scope.doc.format_category === 'GIS' && scope.doc.component_files && scope.doc.component_files.length > 0) { // jshint ignore:line
                    //    var url = config.root + 'stream/' + scope.doc.id + '.zip';
                    //    $window.location.href = url;
                    //} else {
                    if(sugar.canOpen(scope.doc)) {
                        $window.open(scope.doc.download);
                    } else {
                        authService.getUserInfo().then(function(user) {
                            $window.location.href = scope.doc.download + sugar.paramDelimiter(scope.doc.download) + '_vgp=' + user.exchangeToken ;
                        });
                    }
                    //}
                };
            } else if (action.action === 'open') {
                action.do = function() {
                    scope.doc.isopen = false;
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
                    $window.open(action.url + param + encodeURIComponent(scope.doc.fullpath));
                };
            } else if (action.action === 'openArcMap') {
                action.do = function() {
                    scope.doc.isopen = false;
                    $analytics.eventTrack('openArcMap', {
                        category: 'results', label: scope.doc.id // jshint ignore:line
                    });
                    $window.location.href = scope.doc.layerURL;
                };
            } else if (action.action === 'tag') {
                action.do = function() {
                    scope.doc.isopen = false;
                    $analytics.eventTrack('tag', {
                        category: 'results', label: action.url // jshint ignore:line
                    });
                    $uibModal.open({
                        templateUrl: 'common/tagging/tagging.html',
                        size: 'md',
                        controller: 'TagDialog',
                        resolve: {
                            doc: function () {
                                return scope.doc;
                            }
                        }
                    });
                };
            }
        }

        function _initActions(scope, view) {
            var actionMap = {}, defaultAction = null, displayActions = [], actions = sugar.copy(config.docActions);  //copy so we don't change config and every card has separate instance of actions

            $.each(actions, function(index, action) {
                action.buttonType = 'btn-primary';
                _setAction(action, scope);
                actionMap[action.action] = action;

                if(action.action === 'preview' && $location.path() === '/home') {
                    action.visible = false;
                }

                action.display = angular.isDefined(action.display) ? action.display : action.text;
                action.enabled = angular.isUndefined(action.enabled) ? true : action.enabled;
                action.visible = action.enabled ? action.visible : false;

                if(action.visible) {
                    if(defaultAction === null && view !== 'table') {
                        defaultAction = action;
                    } else {
                        displayActions.push(action);
                    }

                    if(action.action === 'download' && angular.isDefined(scope.doc.download)) {
                        if(sugar.canOpen(scope.doc)) {
                            action.text = action.alt;
                        }
                    }
                }
            });
            if (displayActions.length > 0 && angular.isDefined(displayActions[0].sort)) {
                displayActions = _.sortBy(displayActions, 'sort');
            }
            return {display:displayActions, defaultAction: defaultAction, types: actionMap};
        }

        //public methods - client interface
        return {
            setAction : _setAction,
            toggleDisplay : _toggleDisplay,
            initActions : _initActions
        };
    }

})();