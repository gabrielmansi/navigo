/*global angular, $, _*/

angular.module('taskRunner')
    .controller('TaskCtrl', function ($scope, taskService, taskModalService, usSpinnerService, paramService, localStorageService, cartService, cartItemsQuery, sugar, $location, $stateParams, $state) {
        'use strict';

        $scope.task = $stateParams.task;
        $scope.taskList = $stateParams.taskList;
        $scope.extent = taskService.getExtent();
        $scope.params = [];
        $scope.hasMap = true;
        $scope.showAdvanced = false;

        function _applyExtentToMapParams() {
            if (!_.isEmpty($scope.extent)) {
                _.forEach(_.filter($scope.mapParams, function(p) {
                    return p.initWithResultsExtent === true;
                }), function(p) {
                    p.resultsExtent = $scope.extent;
                });
            }
        }

        var _init = function () {
            $scope.hasError = false;
            $scope.errors = {};
            $scope.hasAdvanced = false;
            $scope.showAdvanced = false;
            $scope.displayCategory = cartService.getCount() > 100;
            usSpinnerService.spin('tasks-spinner');
            if (_.isEmpty($scope.task)) {
                $scope.task = {name: $stateParams.type};
            }
            taskService.lookupTaskType($scope.task.name).then(function (response) {
                $scope.task.display = response[1].data.display;
                $scope.task.description = response[1].data.description;
                $scope.task.helpURL = response[1].data.helpURL;

                //console.log(JSON.stringify(response[0].data));

                var params = paramService.initParams(response, $scope.task.reload);
                params.reload = $scope.task.reload;
                $scope.hasAdvanced = params.hasAdvanced;
                $scope.params = params.params;
                $scope.mapParams = params.mapParams;
                $scope.hasMap = params.hasMap;

                _applyExtentToMapParams();

                usSpinnerService.stop('tasks-spinner');

            }, function() {
                $scope.setError('Error occurred loading task');
                usSpinnerService.stop('tasks-spinner');
            });
        };

        function _prepare() {
            var params = $scope.params.concat($scope.mapParams);
            $.each(params, function (index, param) {
                if (!angular.isUndefined(param)) {
                    if(param.type === 'Projection') {
                        param.code = param.selected.id;
                        param.value = param.code;
                    }
                    delete param.error;
                }
            });
            var inputItems = _.find(params,{type:'VoyagerResults'});
            var query = _getQuery(cartService.getQuery(), cartService.getItemIds());
            if (query) {
                inputItems.query = query;
                //console.log(JSON.stringify(query))
                delete inputItems.ids;
            } else {
                //console.log(JSON.stringify(query))
                inputItems.ids = cartService.getItemIds();
                delete inputItems.query;
            }
            return params;
        }

        function _validate(params) {
            var request = {'task': $scope.task.name, 'params': params};
            return taskService.validate(request);
        }

        function _errorHandler(error, params) {
            $scope.isRunning = false;
            $scope.hasError = true;
            $scope.errors = error.data.errors;
            paramService.applyErrors(params,error.data.params);
            usSpinnerService.stop('tasks-spinner');
        }

        function _applyItems(queryCriteria, items) {
            var itemsStr = '', sep = '';
            if(items && items.length > 0) {
                itemsStr = 'id:(' + items.join(' ') + ')';
                sep = ' OR ';
            }
            if(angular.isDefined(queryCriteria.params.q)) {
                queryCriteria.params.q = itemsStr + sep + queryCriteria.params.q;
            } else if (itemsStr !== '') {
                queryCriteria.params.q = itemsStr;
            }
        }

        function _getQuery(queryCriteria, items) {
            var query = {params:{}}, hasItems = false;
            if(queryCriteria) {
                query = _.clone(queryCriteria);
            }
            if(!_.isEmpty(items)) {
                _applyItems(query, items);
                hasItems = true;
            }
            if(angular.isDefined(query.solrFilters) && hasItems) {
                query.params.q += ' OR (' + query.solrFilters.join(' AND ');
                if(!_.isEmpty(query.bounds)) {
                    query.params.q += ' AND ' + query.bounds.replace('&fq=','');
                }
                query.params.q += ')';
            } else if(hasItems && !_.isEmpty(query.bounds) ) {
                query.params.q += ' OR (' + query.bounds.replace('&fq=','') + ')';
            }  else if(angular.isDefined(query.filters)) {
                if (query.filters.search('&fq=') > -1) {
                    query.params.fq = query.filters.split('&fq=');
                }
            }
            else if (angular.isDefined(query.solrFilters)) {
                query.params.fq = query.solrFilters;
            }

            //remove params the task runner doesn't use
            delete query.params.bbox;
            delete query.params.bboxt;

            return query.params;
        }

        _init();

        $scope.setError = function(val) {
            $scope.errorMessage = val;
            $scope.hasError = true;
        };

        $scope.selectTask = function(task) {
            if(task.name !== $scope.task.name && task.available === true) {
                task.isNew = true;
                $scope.task = $.extend({},task);  //clone so watcher always fires
                _init();
            }
        };

        $scope.execTask = function () {
            $scope.$emit('taskStatusEvent', 'alert-running');
            var params = _prepare();
            _validate(params).then(function() {
                var request = {'task': $scope.task.name, 'params': params};
                $scope.executeTask(request).then(function() {
                    $scope.task.isSelected = false; //so the map is reset or it gets in a weird state
                });
            }, function(error) {
                _errorHandler(error, params);
            });
        };

        $scope.executeTask = function (request) {
            usSpinnerService.spin('tasks-spinner');
            if(_.isUndefined(request)) {
                request = {'task': $scope.task.name, 'params': paramService.getAllParams()};
            }
            var params = paramService.getStorable();
            localStorageService.add(request.task, params);
            $scope.isRunning = true;
            $scope.hasError = false;
            //TODO this happens during prepare
            var inputItems = _.find(request.params,{type:'VoyagerResults'});
            delete inputItems.ids;
            inputItems.query = _getQuery(cartService.getQuery(), cartService.getItemIds());
            //console.log('Task ' + request.task + ' Query: ' + JSON.stringify(inputItems.query));
            return taskService.execute(request).then(function (response) {
                $state.go('status',{id: response.data.id});
            }, function(error) {
                _errorHandler(error, params);
            });
            //return $q.when();
        };

        $scope.showInvalidTaskItems = function() {
            return taskModalService.showInvalidTaskItems($scope.invalidTaskItems);
        };

        $scope.getInvalidTaskItems = function() {
            taskService.validateTaskItems($scope.task.constraints, true).then(function(data) {
                $scope.invalidTaskItems = data.docs;
                $scope.showInvalidTaskItems($scope.invalidTaskItems).result.then(function(){
                    $scope.task.warning = false;
                });
            });
        };
    });
