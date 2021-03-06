/*global angular */
'use strict';
angular.module('voyager.search').directive('savedContent', function(authService) {

	return {
		restrict: 'E',
		templateUrl: 'src/saved-content/saved-content-modal.html',
		link: function(scope) {

			scope.showSearch = true;
			scope.showTab = scope.tab || 'suggested';

			scope.showCategory = function($event, category) {
				$event.preventDefault();

				if (category === 'search') {
					if (!scope.showSearch) {
						scope.showSearch = true;
						scope.showTab = scope.canSave ? 'saved' : 'suggested';
					}
				} else {
					scope.showSearch = false;
					scope.showTab = scope.canSave ? 'saved' : 'suggested';
				}

				return false;
			};

			scope.changeTab = function(tab) {
				if (scope.showTab !== tab) {
					scope.showTab = tab;
				}
			};

			scope.cancel = function() {
				scope.$dismiss();
			};

			//fired when selecting a saved search
			scope.$on('filterChanged', function(){
				scope.cancel();
			});

			scope.isAnonymous = authService.isAnonymous();
			scope.canSave = authService.hasPermission('save_search');

			function _syncState() {
				scope.isAnonymous = authService.isAnonymous();
				scope.canSave = authService.hasPermission('save_search');
			}

			authService.addObserver(_syncState);

			scope.$on('$destroy', function() {
				authService.removeObserver(_syncState);
			});
		}
	};

});