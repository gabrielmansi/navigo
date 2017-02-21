/*global angular, $*/
angular.module('taskRunner')
    .directive('vsParam', function ($compile, templateService, leafletData, paramService, $timeout, mapUtil) {
        'use strict';

        function _isGeometry($scope) {
            return $scope.param.type && $scope.param.type === 'Geometry';
        }

        function _isProjection($scope) {
            return $scope.param.type && $scope.param.type === 'Projection';
        }

        function _isCatalogPath($scope) {
            return $scope.param.type && $scope.param.type === 'CatalogPath';
        }

        function _setMapHeight(scope) {
            var mapId = 'view-map';
            if (_isGeometry(scope)) {
                mapId = 'clip-map';
            }
            var type = scope.param.type;
            if(scope.param.readOnly === true) {
                mapId = 'read-only-map';
            }
            leafletData.getMap(mapId).then(function (map) {
                //var width = $('.map').width();

                var width = $(map.getContainer()).width();
                var height = Math.round((width/4)*3);
                //var height = width/3*2;
                if (height === 0) {
                    height = 250;
                }

                $(map.getContainer()).css('height',height);
                map.invalidateSize(false);  //workaround when initially hidden

                if (scope.param.resultsExtent) {
                    mapUtil.fitToBBox(map, scope.param.resultsExtent);
                }
            });
        }

        function _link(scope, element, attrs) {
            if(!scope.param.hidden) { //don't render hidden
                var type = scope.param.type;
                var name = scope.param.name;
                if (type === 'List' && name === 'groups'){
                    type = 'Permissions';
                }
                var template = templateService.get(type, scope.param.readOnly);
                //scope.param.label = scope.param.name;
                element.html(template).show();
                $compile(element.contents())(scope);
                if (scope.param.hasMap === true) {
                    $timeout(function () {
                        _setMapHeight(scope);
                    });
                }
            }
        }

        function _controller($scope, $uibModal) {

            var lastTerm = '';
            var filteredGroups = [];

            $scope.browserType = 'folder';
            if(_isCatalogPath($scope)) {
                $scope.browserType = 'file';
            }

            if(_isProjection($scope)) {

                var defaultSelect = {id:0,text:'Same As Input'};
                if ($scope.param.selected) {
                    defaultSelect = $scope.param.selected;
                }
                $scope.select2Options = {
                    dropdownAutoWidth: 'true',
                    minimumResultsForSearch: 5,
                    minimumInputLength: 3,
                    initSelection : function (element, callback) {
                        callback(defaultSelect);
                    },
                    query: function (query) {
                        var groups;
                        if(query.term.length === 3) {  //clear, new search
                            groups = paramService.getProjections();
                        } else if (query.term.length > lastTerm.length) { //typing more, keep filtering down
                            groups = filteredGroups.slice();
                        } else {  //removing chars, clear
                            groups = paramService.getProjections();
                        }
                        filteredGroups = [];
                        lastTerm = query.term;
                        var data = {results: []}, name, term;
                        $.each(groups, function(key, group) {
                            var filteredGroup = {text:group.text, children:[]};
                            $.each(group.children, function(i, projection) {
                                name = projection.name.toLowerCase();
                                term = query.term.toLowerCase();
                                if(name.indexOf(term) !== -1) {
                                    projection.id = projection.value;
                                    projection.text = projection.name;
                                    filteredGroup.children.push(projection);
                                }
                            });
                            if(filteredGroup.children.length > 0) {
                                filteredGroups.push(filteredGroup);
                            }
                        });
                        data.results = filteredGroups;
                        query.callback(data);
                    }
                };
            }

            $scope.open = function (size) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'common/filebrowser/file-browser.html',
                    controller: 'ModalBrowseCtrl',
                    size: size,
                    resolve: {
                        type: function () {
                            return $scope.browserType;
                        },
                        path: function() {
                            return $scope.param.value;
                        }
                    }
                });

                modalInstance.result.then(function (path) {
                    $scope.param.value = path;
                });
            };

            $scope.search = function (size) {

                var modalInstance = $uibModal.open({
                    templateUrl: 'common/simple-search/search.html',
                    controller: 'ModalSearchCtrl',
                    size: size,
                    resolve: {
                        queryCriteria: function () {
                            return {query: $scope.param.query, fields: $scope.param.fields};
                        }
                    }
                });

                modalInstance.result.then(function (item) {
                    $scope.param.value = item;
                    $scope.param.display = item.name;
                });
            };

            $scope.openDatePicker = function($event) {
                $event.stopPropagation();
                $scope.isDateOpen = true;
            };
        }

        return {
            restrict: 'E',
            replace: true,
            link: _link,
            controller: _controller,
            scope: {
                param: '=',
                show: '='
            }
        };
    });