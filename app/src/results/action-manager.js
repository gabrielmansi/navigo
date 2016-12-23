(function() {
    'use strict';

// just add this to your controller.  then reference trustSrc in your template: (edited)

    angular.module('voyager.results')
        .controller('geocortexController', function($scope, $modalInstance, lyrName, $sce) {
            $scope.lyrName = $sce.trustAsResourceUrl("http://google.ca/#/q="+lyrName);
        })
        .controller('tableauController', function($scope, $modalInstance, lyrName, $sce, $timeout) {
            $scope.lyrName = lyrName;
            $timeout(function(){
                $scope.loaded=true;
            });
        })
        .factory('actionManager', actionManager);

    function actionManager($window, $analytics, $modal, authService, sugar) {

        function _isVisible(action, scope) {
            if (action.visible === true) {
                return true;
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
                    var param = 'url'; //default for esri
                    if(action.param) {
                        param = action.param;
                    }
                    var sep = '?';
                    if(action.url.indexOf(sep) !== -1) {
                        sep = '&';
                    }
                    $window.open(action.url + sep + param + '=' + encodeURIComponent(scope.doc.fullpath));
                };
            } else if (action.action === 'openArcMap') {
                action.do = function() {
                    scope.doc.isopen = false;
                    $analytics.eventTrack('openArcMap', {
                        category: 'results', label: scope.doc.id // jshint ignore:line
                    });
                    $window.location.href = scope.doc.layerURL;
                };
            } else if (action.action === 'openGeocortex') {
                action.do = function() {
                    scope.doc.isopen = false;
                    $analytics.eventTrack('openGeocortex', {
                        // nothing
                    });
                    // var lyrName = scope.doc.path;
                    var lyrName = 'sde://svr=sdw;inst=sde%3aoracle11g%3asdw;user=VOYAGER_OPENDATA;ver=SDE.DEFAULT/SDW.cwaVulnerabilityScore';
                    lyrName = lyrName.toLowerCase();                    
                    if (lyrName.indexOf('sde://') < 0) {
                        alert('Sorry. This option is only possible for SDE layers');
                        return;
                    }                    
                    lyrName = lyrName.split('/');
                    lyrName = lyrName[lyrName.length-1];
                    $modal.open({
                        templateUrl: 'common/york/geocortex.html',
                        windowClass: 'york-modal-geocortex.html',
                        controller: 'geocortexController',
                        resolve: {
                            lyrName: function () {
                                return lyrName;
                            }
                        }
                    });                    
                };
            } else if (action.action === 'openTableau') {
                action.do = function() {
                    scope.doc.isopen = false;
                    $analytics.eventTrack('openTableau', {
                        // nothing ...
                    });
                    // var lyrName = scope.doc.path;
                    var lyrName = 'one/two/EnergySummary_test.zip';
                    lyrName = lyrName.toLowerCase();
                    if (lyrName.indexOf('.xls') < 0 && lyrName.indexOf('.zip') < 0) {
                        alert('Sorry. This option is only possible for XLS(X) or ZIP files');
                        return;
                    }                    
                    lyrName = lyrName.split('/');
                    lyrName = lyrName[lyrName.length-1];
                    lyrName = lyrName.split('.');
                    lyrName = lyrName[0];                    
                    $modal.open({
                        templateUrl: 'common/york/tableau.html',
                        windowClass: 'york-modal-tableau',
                        controller: 'tableauController',
                        resolve: {
                            lyrName: function () {
                                return lyrName;
                            }
                        }
                    });                    
                };
            } else if (action.action === 'tag') {
                action.do = function() {
                    scope.doc.isopen = false;
                    $analytics.eventTrack('tag', {
                        category: 'results', label: action.url // jshint ignore:line
                    });
                    $modal.open({
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

        //public methods - client interface
        return {
            setAction : _setAction,
            toggleDisplay : _toggleDisplay
        };
    }

})();