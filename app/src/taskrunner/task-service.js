/*global angular, $ */

angular.module('taskRunner').
    factory('taskService', function ($http, config, $q, cartService, cartItemsQuery, translateService, taskModalService, converter) {
        'use strict';

        var _items = [];
        var _extent = null;
        var errorMessage = 'All the items in the cart are invalid formats';
        if (angular.isDefined(config.defaultTask) && !_.isEmpty(config.defaultTask)) {
            errorMessage = 'All the items in the cart are invalid formats for: ' + _.classify(config.defaultTask);
        }

        function _buildQuery(isAdmin) {
            var filter = '&fq=available:true';
            if (isAdmin) {
                filter = '';
            }
            return config.root + 'solr/tasks/select?q=*:*' + filter + '&rows=1000&sort=display_sort+asc&wt=json&json.wrf=JSON_CALLBACK&rand=' + Math.random();
        }

        function _post(request, validate) {
            return $http({
                method: 'POST',
                url: config.root + 'api/rest/process/task?validate=' + validate,
                data: request,
                headers: {'Content-Type': 'application/json'}
            });
        }

        function _decorator(data) {

            var groups = {};
            _.each(data, function(item){
                _.each(item.category, function(cat) {
                    if (typeof(groups[cat]) === 'undefined') {
                        groups[cat] = [];
                        groups[cat].push(item);
                    }
                    else {
                        groups[cat].push(item);
                    }
                });
            });
            return groups;
        }

        function _convertPlaceFilter(request) {
            var inputItems = request.params.filter(function (item) {
                return item.name === 'input_items';
            });
            if (inputItems) {
                var inputItemsParam = inputItems[0];
                if (inputItemsParam.query && angular.isDefined(inputItemsParam.query.place)) {
                    var placeFq = converter.toPlaceFilter(inputItemsParam.query);
                    var fq = [];
                    if (angular.isDefined(inputItemsParam.query.fq)) {
                        fq = inputItemsParam.query.fq;
                    }
                    fq.push(placeFq);
                    inputItemsParam.query.fq = fq;
                }
            }
        }

    return {

        findAllTasks: function (isAdmin) {
            return $http.jsonp(_buildQuery(isAdmin)).then(function(data){
                    return _decorator(data.data.response.docs);
                }, function(error) {
                    return error;
                });
            },

            lookupTaskType: function(type) {
                var taskPromise =  $http.get(config.root + 'api/rest/process/task/' + type + '/init.json');
                var taskDisplayPromise = $http.get(config.root + 'api/rest/process/task/' + type + '/display.json?lang=en');
                return $q.all([taskPromise,taskDisplayPromise]);
            },

            lookupTask: function(type) {
                return $http.get(config.root + 'api/rest/process/task/' + type + '/init.json');
            },

            lookupTaskDisplay: function(type) {
                return $http.get(config.root + 'api/rest/process/task/' + type + '/display.json?lang=en');
            },

            execute: function (request) {
                _convertPlaceFilter(request);
                return _post(request, false);
            },

            validate: function (request) {
                return _post(request, true);
            },

            getTaskQueryCriteria: function (constraints, invalidItemsOnly){
                var query = cartService.getQuery();

                if (!query) {
                    query = cartItemsQuery.getQueryCriteria({});
                }

                if (angular.isUndefined(query.solrFilters)){
                    query.solrFilters = [];
                }

                _.each(constraints, function(value) {
                    if (_.isEmpty(query.solrFilters)) {
                        query.solrFilters = [];
                    }

                    if (invalidItemsOnly === true) {
                        query.solrFilters.push('-(' + value + ')');
                    } else {
                        query.solrFilters.push(value);
                    }
                });
                return query;
            },

            getTaskConstraintFormats: function (taskConstraints) {
                var constraintFormats = [];
                _.each(taskConstraints, function(value) {
                        value = value.split(':')[1];
                        var values = value.split(' ');
                        if (values){
                            angular.forEach(values, function(value){
                                value = value.replace('(', '');
                                value = value.replace(')', '');
                                value = translateService.getType(value);
                                constraintFormats.push(value);
                            });
                        }
                        else{
                            value = translateService.getType(value);
                            constraintFormats.push(value);
                        }
                    });
                return constraintFormats;
            },

            showTaskValidationError: function(constraintFormats) {
                taskModalService.showTaskValidationError(errorMessage, constraintFormats);
            },

            validateTaskItems: function (constraints, invalidItemsOnly) {
                var severity = 0;
                var items = cartService.getItemIds();
                var query = this.getTaskQueryCriteria(constraints, invalidItemsOnly, items);
                query.constraints = true;
                query.count = cartService.getCount();
                if (invalidItemsOnly === true) {
                    return cartItemsQuery.execute(query, items);
                } else {
                    // TODO - why is this clearing filters?
                    //query.solrFilters = [];
                     return cartItemsQuery.fetchItems(query, items).then(function(data) {
                        var count = data.count;
                        if (angular.isDefined(data.bbox)){
                            _extent = data.bbox;
                        }

                        if (count === query.count){
                            severity = 0; // Valid
                        }
                        else if (count === 0) {
                            severity = 2; // Error
                        }
                        else if (count < query.count) {
                            severity = 1; // Warning
                        }
                        return severity;
                    });
                }
            },

            checkStatus: function (id) {
                return $http.get(config.root + 'api/rest/process/job/' + id + '.json');
            },

            checkProgress: function (id) {
                return $http.get(config.root + 'api/rest/process/job/' + id + '/status.json');
            },

            cancel: function (id) {
                return $http['delete'](config.root + 'api/rest/process/job/' + id + '.json');
            },

            notify: function (id, email) {
                return $http.put(config.root + 'api/rest/process/job/' + id + '/callback.json?email=' + email);
            },

            cancelNotify: function (id, email) {
                return $http['delete'](config.root + 'api/rest/process/job/' + id + '/callback.json?email=' + email);
            },

            getFileUrl: function (id, name) {
                return config.root + 'api/rest/process/job/' + id + '/output/' + name;
            },

            getFileDisplayName: function(name) {
                if (name.indexOf('stdout') > 0) {
                    return 'Processing Output';
                }
                if (name.indexOf('stderr') > 0) {
                    return 'Processing Error Log';
                }
                return name;
            },

            refresh: function () {
                return $http.post(config.root + 'api/rest/process/tasks/refresh.json');
            },

            getFileData: function(file, withoutMime) {
                withoutMime = withoutMime || false;
                return $http.get(file.downloadUrl + (withoutMime ? '' : '?mime=application/json'));
            },

            setItems: function(items) {
                _items = items;
            },

            getExtent: function() {
                return _extent;
            },

            getItems: function() {
                return _items;
            },

            getFiles: function (statusResponse) {
                var _self = this;
                var files = [];
                if(statusResponse.data.output && statusResponse.data.output.children) {
                    $.each(statusResponse.data.output.children, function (index, file) {
                        if (file.format && file.name.lastIndexOf('_', 0) !== 0) {
                            file.downloadUrl = _self.getFileUrl(statusResponse.data.id, file.name);
                            files.push(file);
                        }
                    });
                }
                return files;
            },

            getLogFiles: function (statusResponse) {
                var _self = this;
                var files = [];
                if(statusResponse.data.output && statusResponse.data.output.children) {
                    $.each(statusResponse.data.output.children, function (index, file) {
                        if (file.format && file.name.lastIndexOf('_', 0) === 0) {
                            if (file.name.indexOf('stderr') > -1 || file.name.indexOf('stdout') > -1) {
                                file.downloadUrl = _self.getFileUrl(statusResponse.data.id, file.name);
                                file.displayName = _self.getFileDisplayName(file.name);
                                files.push(file);
                            }
                        }
                    });
                }
                return files;
            },

            getReport: function(statusResponse) {
                var file = this.getReportFile(statusResponse);
                if(file) {
                    return $http.get(file.downloadUrl).then(function(response) {
                        return response.data;
                    });
                } else {
                    return $q.reject();
                }
            },

            getReportFile: function (statusResponse) {
                var _self = this;
                var _file;
                if(statusResponse.data.output && statusResponse.data.output.children) {
                    $.each(statusResponse.data.output.children, function (index, file) {
                        if (file.format && file.name.lastIndexOf('_', 0) === 0) {
                            if (file.name.indexOf('report') > -1) {
                                file.downloadUrl = _self.getFileUrl(statusResponse.data.id, file.name) + '/';
                                file.displayName = _self.getFileDisplayName(file.name);
                                _file = file;
                            }
                        }
                    });
                }
                return _file;
            },

            getCopyUrl: function(id) {
                return config.root + 'api/rest/process/job/' + id + '/run.json';
            }

        };

    });
