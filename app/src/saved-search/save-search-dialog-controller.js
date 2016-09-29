/*global angular */
'use strict';

angular.module('voyager.search')
    .controller('SaveSearchDialog', function($scope, $modalInstance, savedSearchService, $location, authService, $analytics, recentSearchService, searchItem) {

        $scope.savedSearch = {query:searchItem.query};

        var _shareGroups = [];
        var _coreRoles = [{id:'_EVERYONE',text:'EVERYONE'},{id:'_LOGGEDIN',text:'LOGGEDIN'},{id:'_ANONYMOUS',text:'ANONYMOUS'}];
        var _existingSearch = {};

        $scope.sharedOptions = {
            'multiple': true,
            'tags': _shareGroups
        };

        function _loadGroups() {
            if($scope.canAdmin) { // use system groups
                $.merge(_shareGroups, _coreRoles);
                authService.fetchGroups().then(function(groups) {
                    $.merge(_shareGroups, groups);
                });
            } else if ($scope.canShare) {  // use user's groups
                authService.getUserInfo().then(function(user) {
                    var groups = [];
                    _(user.groups).forEach(function(n) {groups.push({id:n,text:n});});
                    $.merge(_shareGroups, groups);
                });
            }
        }

        function _getPrivileges() {
            authService.getPrivileges().then(function() {
                $scope.canAdmin = authService.hasPermission('manage');
                $scope.canSave = authService.hasPermission('save_search');
                $scope.canShare = authService.hasPermission('share_saved_search');

                _loadGroups();
            });
        }

        function _activate() {
            _getPrivileges();
        }

        _activate();

        $scope.ok = function () {

            if (_.isEmpty($scope.savedSearch.title)) {
                return;
            }
            if($scope.savedSearch.makeDefault) {
                $scope.savedSearch.order = new Date().getTime();
            }

            var savedSearchCopy = _.cloneDeep($scope.savedSearch);  //copy so not to alter binding
            savedSearchCopy.share = _.pluck(savedSearchCopy.share,'id');

            savedSearchService.fetch(savedSearchCopy).then(function(docs) {
                if (docs.length === 0 || _.contains($scope.error,'Overwrite')) {
                    delete $scope.error;
                    savedSearchCopy.labels = _existingSearch.labels;
                    if (docs.length > 0) {
                        savedSearchCopy.id = docs[0].id;
                    }
                    return _saveSearch(savedSearchCopy);
                } else {
                    if (docs[0].owner === authService.getUser().id || authService.hasPermission('manage')) {
                        _existingSearch = docs[0];
                        $scope.error = 'Saved Search exists. Overwrite?';
                    } else {
                        $scope.error = 'Saved Search exists. You don\'t have permission to overwrite. Please rename your search.';
                    }
                }
            });

        };

        function _saveSearch(savedSearch) {
            return savedSearchService.saveSearch(savedSearch, searchItem).then(function(response) {

                $modalInstance.close();
                $analytics.eventTrack('saved-search', {
                    category: 'save'
                });

                recentSearchService.updateSearchID(searchItem, response.data);

                //TODO this should not submit event, just return success to controller using it
                $scope.$emit('saveSearchSuccess', response.data);

            }, function(error) {
                console.log(error.data);
            });
        }

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.hasPermission = function(permission) {
            return authService.hasPermission(permission);
        };

        $scope.handleEnter = function(ev) {
            delete $scope.error;
            if (ev.which === 13) {
                $scope.ok();
            }
        };

    });
