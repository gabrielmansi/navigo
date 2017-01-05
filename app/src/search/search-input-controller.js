/*global angular, _ */

angular.module('voyager.search')
	.controller('SearchInputCtrl', function ($scope, config, $location, searchService, $timeout, filterService, mapUtil, sugar, $uibModal) {
		'use strict';

		var placeChanged = false;

		$scope.search = {};
		$scope.submitSearch = _submitSearch;
		$scope.clearField = _clearField;
		$scope.locationChange = _locationChange;
        $scope.showLocation = config.homepage && config.homepage.showPlaceQuery !== false;
		$scope.drawingTypes = ['Within', 'Intersects'];
		$scope.selectedDrawingType = ($location.search())['place.op'] === 'intersects' ? 'Intersects' : 'Within';

		$scope.placeOpChange = function(type) {
			if ($scope.selectedDrawingType !== type) {
				$scope.selectedDrawingType = type;
			}
			$scope.$emit('selectedDrawingTypeChanged', type);
		};

		$scope.saveLocation = function() {
			$uibModal.open({
                template: '<vs-save-location-dialog />',
                size: 'md',
                scope: $scope
            });
		};

		_init();

		// listen to stateChangeSuccess event to toggle search form
		$scope.$on('$stateChangeSuccess', _init);
		$scope.$on('updateBBox', function(event, args){
			_updatePlaceToBbox(args);
		});

		$scope.$on('clearSearch', _clearAllField);

		$scope.$on('filterChanged', function(args){
            if(args && args.refresh === false) {
                return;
            }
			_init();
		});

		/**
		 * @function Populate query and location fields based on querystring
		 */
		function _init() {

			if ($location.path() !== '/search') {
				$scope.showSearch = false;
				return;
			}

			$scope.showSearch = true;

			var initParams = $location.search();

			if (!_.isEmpty(initParams.q)) {
				$scope.search.q = initParams.q;
			} else {
				$scope.search.q = '';
			}

			if (!_.isEmpty(initParams.place)) {
				$scope.search.place = initParams.place;
				if(mapUtil.isBbox(initParams.place)) {
					$scope.search.place = sugar.formatBBox(initParams.place);
				}

				var placeType = initParams['place.op'];
				if(angular.isDefined(placeType)) {
					$scope.search['place.op'] = placeType.toLowerCase();
					$scope.selectedDrawingType = _.classify(placeType);
				} else if(angular.isDefined($scope.selectedDrawingType)) {
					$scope.search['place.op'] = $scope.selectedDrawingType.toLowerCase();
				}
				$location.search('place.op', $scope.search['place.op']);
				_setBBoxNull();
			}
			else if (!_.isEmpty(initParams.bbox)) {
				// console.log(initParams);
				_updatePlaceToBbox(initParams);
			} else {
				$scope.search.place = '';
			}
		}

		function _updatePlaceToBbox(params) {

			if (params.place === null || _.isEmpty(params.place)) {
				return;
			}

			$scope.search.place = null;
			$location.search('place', params.place);
            $location.search('place.id', null);

			$timeout(function() {
				if (mapUtil.isBbox(params.place)) {
					$scope.search.place = sugar.formatBBox(params.place);
				} else {
					$scope.search.place = params.place;
				}
				$scope.search['place.op'] = params['place.op'];

				if (!_.isNull(params.vw)) {
					$scope.search.vw = params.vw;
				}
			}, 1);
		}

		function _setBBoxNull() {
			//$scope.search.place = null;
			// $scope.search['place.op'] = null;
			$scope.search.vw = null;
		}

		function _submitSearch() {

			if (placeChanged) {
                $location.search('place.id', null);
				$scope.$emit('clearBboxEvent', {});
			}
			$scope.search['place.op'] = $scope.selectedDrawingType.toLowerCase();
			if(angular.isDefined($scope.selectedDrawingType)) {
				$location.search('place.op', $scope.selectedDrawingType.toLowerCase());
			}
			if (_.isEmpty($scope.search.place)) {
				$scope.search.place = null;
                $location.search('place.id', null);
				_setBBoxNull();
			} else {
				if (placeChanged && mapUtil.isBbox($scope.search.place)) {
					_setBBoxNull();
				}
			}

			if (_.isEmpty($scope.search.q)) {
				$scope.search.q = null;
			}

			if (!_.isEmpty($scope.search.q) || !_.isEmpty($scope.search.place)) {
				var params = $location.search();
				delete(params.id);
				delete(params.recent);
                params.block='false';
				_.extend(params, $scope.search);
				_.extend(params, {'fq': filterService.getFilterAsLocationParams()});
				$location.search(params);
				$scope.$emit('filterEvent', {});  //TODO: this event is captured above, pass arg to ignore it
			}

			placeChanged = false;
		}

		function _locationChange() {
			placeChanged = true;
		}

		function _clearPlace(args) {
			delete args.place;
			delete args['place.id'];
			delete args['place.iop'];
			delete args.block;
		}

		function _clearField(field, isPlace) {
            var eventArgs = {};
			var args = $location.search(); //TODO does this need to be cloned?
			if (isPlace) {
				eventArgs.isBbox = mapUtil.isBbox($scope.search.place);
				if (!eventArgs.isBbox) {
					eventArgs.isWkt = mapUtil.isWkt($scope.search.place);
				}
				$scope.search.place = '';

				_clearPlace(args);

				_locationChange();
			} else {
				delete args[field];
				$scope.search[field] = '';
			}
			$location.search(args); //reset args
            $scope.$emit('removeFilterEvent', eventArgs); //TODO: this event is captured above, pass arg to ignore it
		}

		function _clearAllField(event, args) {
			var params = $location.search(); //TODO does this need to be cloned?
			_clearPlace(params);
			$location.search(params); //reset args
			$scope.search = {};
			filterService.clear();
            if(args && args.filter === true) {
                $scope.$emit('filterEvent', {}); //TODO: this event is captured above, pass arg to ignore it
            }
		}

	});
