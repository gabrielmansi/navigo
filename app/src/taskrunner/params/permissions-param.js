'use strict';

angular.module('taskRunner')
    .directive('vsPermissionsParam', function (authService) {

        return {
            replace: true,
            scope: {
                param: '=',
                show: '='
            },
            template: '<input type="hidden" ui-select2="permissionOptions" ng-model="param.value" style="width: 100%;">',
            controller: function ($scope, $element, $attrs) {
                var _shareGroups = [];
                var _coreRoles = [{id:'_EVERYONE',text:'EVERYONE'},{id:'_LOGGEDIN',text:'LOGGEDIN'},{id:'_ANONYMOUS',text:'ANONYMOUS'}];

                var isMultiple = $attrs.multi !== 'false';

                $scope.permissionOptions = {
                    'multiple': isMultiple,
                    'simple_tags': true,
                    dropdownAutoWidth: true,
                    data: function() {
                        return {results:_shareGroups};
                    }
                };

                authService.getPrivileges().then(function() {
                    if (authService.hasPermission('manage')) {
                        $.merge(_shareGroups, _coreRoles);
                    }
                    else {
                        authService.fetchGroups().then(function(groups) {
                            $.merge(_shareGroups, groups);
                        });
                    }
                });
            }
        };
    });