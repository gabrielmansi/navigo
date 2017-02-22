'use strict';

angular.module('taskRunner')
    .directive('vsListParam', function (authService) {

        return {
            replace: true,
            scope: {
                param: '=',
                show: '=',
                list: '@list'
            },
            template: '<input type="hidden" ui-select2="listOptions" ng-model="param.value" data-placeholder="Private" style="width: 100%;">',
            controller: function ($scope, $element, $attrs) {
                var _options = [];
                var _coreRoles = [{id:'_EVERYONE',text:'EVERYONE'},{id:'_LOGGEDIN',text:'LOGGEDIN'},{id:'_ANONYMOUS',text:'ANONYMOUS'}];

                var isMultiple = $attrs.multi !== 'false';

                $scope.listOptions = {
                    'multiple': isMultiple,
                    'simple_tags': true,
                    dropdownAutoWidth: true,
                    data: function() {
                        return {results:_options};
                    }
                };

                if ($scope.list == 'permissions'){
                    authService.getPrivileges().then(function() {
                        if (authService.hasPermission('manage')) {
                            $.merge(_options, _coreRoles);
                        }
                        else {
                            authService.fetchGroups().then(function(groups) {
                                $.merge(_options, groups);
                            });
                        }
                    });
                }
            }
        };
    });