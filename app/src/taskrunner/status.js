/*global angular, $, _, document */

angular.module('taskRunner')
    .controller('StatusCtrl', function ($scope, taskService, $stateParams, $timeout, config, $location, paramService, $window, usSpinnerService, $analytics, $uibModal, sugar) {

        'use strict';

        $scope.messageType = 'alert-info';
        $scope.state = 'RUNNING';
        //$scope.id = $routeParams.id;
        //$scope.statusIcon = 'fa-cog';
        $scope.allowNotify = false;
        $scope.email = '';
        $scope.emailButtonText = 'Notify Me When Done';
        $scope.isRunning = true;
        $scope.hasItems = false;
        $scope.isSuccess = false;
        $scope.downloadUrl = '';
        $scope.messages = [];
        $scope.isDetailsOpen = true;
        $scope.statusMessage = '';

        $scope.isDetailsCollapsed = true;
        $scope.showLog = true;
        $scope.logFiles = [];
        $scope.showFile = false;
        $scope.$emit('taskStatusEvent', 'alert-running');

        //var info = 'This task as well as a list of your recent tasks can be found under the Home > Processing > History page should you need to access the download of the log after this session.';
        var info = '';

        var _self = this;
        var attempts = 0;
        //var mapSet = false;
        var timer;
        var canNotify = true;

        var done = function (messageType) {
            attempts = 0;
            //$scope.statusIcon = '';
            $scope.messageType = messageType;
            $scope.allowNotify = false;
            $scope.isRunning = false;
            $scope.hasProgressMessage = false;
            $scope.progress = [];
            $scope.$emit('taskStatusEvent', messageType);
        };

        this.statusError = function (data) {
            done('alert-danger');
            $scope.messages.push({'message': data.error, 'trace': data.error});
            $scope.state = 'FAILED';
            $scope.statusIcon = _getIcon($scope.state);
        };

        function _removeSolrBbox(query) {
            var solrBbox;
            if(_.isArray(query.fq)) {
                var index = sugar.getIndex(query.fq, 'bbox');
                if (index !== -1) {
                    solrBbox = query.fq[index];
                    query.fq.splice(index, 1);  //remove solr bbox param, use bbox compatible with navigo
                }
            } else {
                if(angular.isDefined(query.fq) && query.fq.indexOf('bbox') !== -1) {
                    solrBbox = query.fq;
                    delete query.fq;  //remove bbox param
                }
            }
            return solrBbox;
        }

        function _applyBbox(query) {
            var solrBbox = _removeSolrBbox(query);  //not compatible with navigo
            if(query.bbox) {  //use navigo bbox if its here
                return;
            }
            if(angular.isDefined(solrBbox)) {
                query.bboxt = 'i';
                if (solrBbox.indexOf('IsWithin') !== -1) {
                    query.bboxt = 'w';
                }
                query.bbox = solrBbox.substring(solrBbox.indexOf('(')+1, solrBbox.indexOf(')'));
            }
        }

        var updateStatusCallback = function (id) {
            //console.log($scope.id + ' ' + id);
            $scope.statusReady = true;
            usSpinnerService.stop('status-spinner');
            if(_.isUndefined(id)) {
                id = $scope.id;
            }
            if ($scope.id === id) {
                taskService.checkProgress(id).then(_self.updateStatus);
            }
        };

        this.startCheckStatus = function (response) {
            $scope.copyUrl = taskService.getCopyUrl($scope.id);
            //$scope.task = response.data.task;
            taskService.lookupTaskDisplay(response.data.task).then(function(res) {

                $scope.type = res.data.display;

                if(!_.isUndefined(response.data.params)) {
                    var readOnlyParams = paramService.initReadOnly(response, res.data);
                    var searchParams = $location.search();

                    $scope.params = readOnlyParams.params;
                    $scope.inputItems = readOnlyParams.inputItems;
                    var query = readOnlyParams.inputItems[0].query;
                    if(query) {
                        _applyBbox(query);
                        $scope.searchItemURL = 'search?disp=' + searchParams.disp + '&' + sugar.toNavigoQueryString(query);
                    } else {
                        var ids = readOnlyParams.inputItems[0].ids;
                        var idParams = ids.join('&fq=id:');
                        $scope.searchItemURL = 'search?disp=' + searchParams.disp + '&fq=id:' + idParams;
                    }

                    $scope.hasMap = readOnlyParams.hasMap;
                    $scope.taskItems = readOnlyParams.inputItems[0].response.docs;
                    $scope.itemCount = readOnlyParams.inputItems[0].response.numFound;
                }

                updateStatusCallback(response.data.id);
            });
        };

        function _confirmStatus() {
            taskService.checkStatus($scope.id).then(function(statusResponse) {
                    $scope.messages = statusResponse.data.errors;
                    $scope.files = taskService.getFiles(statusResponse);
                    $scope.logFiles = taskService.getLogFiles(statusResponse);
                    taskService.getReport(statusResponse).then(function(report) {
                        $scope.report = report;
                    });
                    $scope.warnings = statusResponse.data.warnings;
                    if (!angular.isUndefined($scope.warnings) && $scope.warnings.length > 0) {
                        $scope.hasWarning = true;
                    }
                },
                _self.statusError);
        }

        function _showFailureInfo(data) {
            done('alert-danger');
            if(data.state === 'FAILED') {
                if(!angular.isUndefined(data.status)) {
                    $scope.errorMessage = data.status.text + ' for ' +  $scope.type + ' Task ' + data.taskId;
                } else {
                    $scope.errorMessage = $scope.type + ' Task ' + data.taskId + ' ' + data.state;
                }
                $scope.hasError = true;
                $scope.statusMessage = 'ERROR';
                $scope.statusDetail = 'Your task could not be completed. View task log for details. ' + info;
                $scope.statusIcon = _getIcon(data.state);
                $scope.statusColor = 'alert-error';
                $scope.statusStyle = 'background-color: #f2dede;';
            } else {
                $scope.statusMessage = 'Cancelled';
                $scope.statusDetail = 'Your task was cancelled.';
                $scope.statusIcon = _getIcon('CANCELED');
            }

            _confirmStatus();

            $analytics.eventTrack('process', {
                category: $scope.type , label: data.state  // jshint ignore:line
            });
        }

        function _showActivityInfo(data) {
            if(data.state === 'RUNNING') {
                $scope.statusIcon = _getIcon(data.state);
            }
            $scope.statusMessage = _.str.classify(data.state);
            if (!_.isUndefined(data.status)) {
                $scope.progressMessage = data.status.text;
                $scope.hasProgressMessage = true;
            }
            if (!_.isUndefined(data.progress)) {
                $scope.progress = data.progress;
            }
            $scope.messageType = 'alert-info';
        }

        function _showSuccessInfo(data, statusResponse) {
            $scope.files = taskService.getFiles(statusResponse);
            $scope.logFiles = taskService.getLogFiles(statusResponse);
            taskService.getReport(statusResponse).then(function(report) {
                $scope.report = report;
            });
            $scope.statusMessage = 'Completed';
            if(data.state === 'WARNING') {
                $scope.statusMessage += ' With Warnings';
                $scope.statusDetail = 'Completed with Warnings. See task log for details.';
                $scope.statusIcon = _getIcon(data.state);
                $scope.statusColor = 'alert-warning';
                $scope.messageType = 'alert-warning';
            } else {
                $scope.statusDetail = 'Your task was successful.';
                $scope.statusIcon = _getIcon('SUCCESS');
                $scope.statusColor = 'alert-success';
                $scope.messageType = 'alert-success';
            }

            if($scope.files.length > 0) {
                $scope.statusDetail = 'You can now download your data by clicking the link below. ' + $scope.statusDetail;
            }
            $scope.statusDetail += info;

            $timeout(function() {
                _confirmStatus();  //seems generating log files can be delayed
            }, 1000);

            done($scope.messageType);

            $analytics.eventTrack('process', {
                category: $scope.type, label: data.state  // jshint ignore:line
            });
        }

        this.updateStatus = function (response) {
            var data = response.data;
            $scope.hasItems = true;
            $scope.state = _.str.classify(data.state);

            //console.log('update status ' + data.state);
            //uncomment for testing the notify
            //data.state = 'RUNNING'

            if (data.state === 'FAILED' || data.state === 'CANCELED') {
                _showFailureInfo(data);
            } else if (data.state === 'RUNNING' || data.state === 'PENDING') {
                _showActivityInfo(data);
                attempts++;
                if ($scope.allowNotify === false && config.enableEmail === true && canNotify === true) {
                    $scope.allowNotify = true;
                }
                timer = $timeout(function () {
                    updateStatusCallback(data.taskId);
                }, 1000);
            } else {  //success
                $scope.isSuccess = true;
                taskService.checkStatus($scope.id).then(function(statusResponse) {
                    $scope.warnings = statusResponse.data.warnings;
                    if (!angular.isUndefined($scope.warnings) && $scope.warnings.length > 0) {
                        $scope.hasWarnings = true;
                    }
                    _showSuccessInfo(data, statusResponse);
                }, _self.statusError);
            }
        };

        function _getIcon(status) {
            switch(status)
            {
                case 'PENDING':
                    return {'icon':'icon-queue_status_waiting','color':'black'};
                case 'RUNNING':
                    return {'icon':'fa fa-cog fa-spin','color':'#337ab7'};
                case 'FAILED':
                    return {'icon':'icon-queue_status_error','color':'red'};
                case 'CANCELED':
                    return {'icon':'icon-queue_status_cancled','color':'black'};
                case 'WARNING':
                    return {'icon':'icon-queue_status_complete','color':'orange'};
                default:
                    return {'icon':'icon-queue_status_complete','color':'green'};
            }
        }

        function _reset(isRunning) {
            $scope.params = [];  //clear params so tab resets (this should destroy map directive and unresolve the map)
            $scope.inputItems = [];
            $scope.files = [];
            $scope.statusDetail = '';
            $scope.progressMessage = '';
            $scope.isRunning = isRunning;
            $scope.hasProgressMessage = false;
            $scope.hasProgressMessage = '';
            $scope.statusMessage = 'is Initializing';
            $scope.progress = [];
            $scope.hasError = false;
            $scope.hasWarning = false;
            $scope.statusIcon = '';
            $scope.showFile = false;
            $scope.messages = [];
            $scope.logFiles = [];
            $scope.warnings = [];
            if(isRunning) {
                $scope.statusIcon = _getIcon('RUNNING');
            }
        }

        if($location.path().indexOf('status') > -1) {  //standalone
            $scope.id = $stateParams.id;
            taskService.checkStatus($scope.id).then(_self.startCheckStatus, _self.statusError);
            $scope.isStandalone = true;
        }

        $scope.hasMessage = function () {
            return $scope.messages && $scope.messages.length > 0;
        };

        $scope.emailClick = function () {
            if ($scope.emailButtonText === 'Cancel Notify') {
                taskService.cancelNotify($scope.id, $scope.email);
                $scope.emailButtonText = 'Notify Me When Done';
            } else {
                taskService.notify($scope.id, $scope.email);
                $scope.emailButtonText = 'Cancel Notify';
            }
            //close the popup - not the angular way, but the popover directive is global to the body
            $('.hover_flyout, .opened').removeClass('opened');
        };

        $scope.cancelClick = function () {
            usSpinnerService.spin('status-spinner');
            if (timer) {
                $timeout.cancel(timer);
            }
            _reset(false);
            $scope.statusMessage = 'Cancelled';
            taskService.cancel($scope.id).then(function() {
                usSpinnerService.stop('status-spinner');
                //TODO this is slow to update the status so just forcing status to cancelled above
                //taskService.checkProgress($scope.id).then(_self.updateStatus);
            }, function() {
                //this errors out but seems to work
                usSpinnerService.stop('status-spinner');
                //TODO this is slow to update the status so just forcing status to cancelled above
                //taskService.checkProgress($scope.id).then(_self.updateStatus);
            });
        };

        $scope.$on('$destroy', function() {
            //console.log('destroy!');
            if (timer) {
                $timeout.cancel(timer);
            }
        });

        $scope.getData = function(file) {
            $uibModal.open({
                templateUrl: 'src/taskrunner/task-log.html',
                controller: 'TaskLogCtrl',
                size: 'lg',
                resolve: {
                    file: function () {
                        return file;
                    },
                    task: function() {
                        return {
                            id : $scope.id,
                            type: $scope.type
                        };
                    }
                }
            });
        };

        $scope.showDetails = function() {
            $uibModal.open({
                templateUrl: 'src/taskrunner/task-details.html',
                controller: 'TaskDetailsCtrl',
                size: 'lg',
                resolve: {
                    inputItems: function () {
                        return $scope.inputItems;
                    },
                    params: function() {
                        return $scope.params;
                    },
                    task: function() {
                        return {id : $scope.id,type: $scope.type};
                    }
                }
            });
        };

        // TODO removed when new design was added - re-implement?
        //function _getParams(inputItems) {
        //    var params = '';
        //    if (inputItems.query) {
        //        params = $.param(inputItems.query, true);
        //    } else {
        //        params = 'id=' + inputItems.ids.join('&id=');
        //    }
        //    return params;
        //}
        //
        //$scope.rerun = function() {
        //    if(angular.isDefined($scope.tabs)) {
        //        $scope.task.reload = true;
        //        $scope.selectTask($scope.task);
        //    } else {
        //        var params = _getParams($scope.inputItems[0]); //this is an array so it doesn't get rendered if empty (could use ng-if instead)
        //        $window.location.href = 'cart?' + params + '&rerun=' + $stateParams.id;
        //    }
        //};

        $scope.showUrl = function() {
            $scope.showCopyUrl = true;
            $timeout(function() {
                document.getElementById('copy-url').select();
            }, 0);
        };

        $scope.showReport = function() {
            var size = 'sm';
            if($scope.report.Skipped || $scope.report.Errors) {
                size = 'lg';
            }
            $uibModal.open({
                templateUrl: 'src/taskrunner/task-report.html',
                controller: 'TaskReportCtrl',
                size: size,
                resolve: {
                    data: function () {
                        return {'report':$scope.report, size: size};
                    }
                }
            });
        };

    });
