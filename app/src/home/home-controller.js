'use strict';

angular.module('voyager.home')
	.controller('HomeCtrl', function(config, $scope, $window, $location, homeService, authService, leafletData, filterService, searchService, savedSearchService, sugar, configService, savedSearchQuery, $uibModal, cartService, $log) {

		$scope.search = {};
		$scope.mapTypes = ['Place', 'Map'];
		$scope.selectedMapType = 'Place';
		$scope.drawingTypes = ['Within', 'Intersects'];
		$scope.selectedDrawingType = 'Within';
		$scope.displayFormat = 'detail_format';
		$scope.showRecent = true; //show recent search
		$scope.changeTab = _changeSearchTab;
		$scope.submitSearch = _submitSearch;
		$scope.changeSelectedType = _changeSelectedType;
		$scope.showPan = true;
		$scope.hideMap = !configService.showMap();
        $scope.featuredTitle = 'Featured';
        $scope.collectionsTitle = 'Collections';
		$scope.searchInputClass = 'col-md-6 col-xs-6';
		$scope.showSpatialInput = true;


		$scope.showAll = function() {
			var search = homeService.getFeaturedQuery();
			if (angular.isDefined(search)) {
				savedSearchService.applySavedSearch(search, $scope);
			} else {
				_submitSearch();
			}
		};

		if ($scope.hideMap) {
			$scope.containerStyle = 'margin-top: -60px; height: 180px';
		}

        if(config.homepage && angular.isDefined(config.homepage.featuredContentTitle)) {
            $scope.featuredTitle = config.homepage.featuredContentTitle;
        }

        if(config.homepage && angular.isDefined(config.homepage.sidebarLinksTitle)) {
            $scope.collectionsTitle = config.homepage.sidebarLinksTitle;
        }

        if(config.homepage && config.homepage.showPlaceQuery === false) {
            $scope.mapTypes = ['Map'];
            $scope.showMap = true;
            $scope.displayFormat = 'short_format';
            $scope.selectedMapType = 'Map';
        }

		if($scope.hideMap) {
			$scope.mapTypes = ['Place'];
			$scope.showMap = false;
			$scope.selectedMapType = 'Place';
		}

		if(config.homepage && config.homepage.showPlaceQuery === false && $scope.hideMap) {
			$scope.searchInputClass = 'col-xs-12';
			$scope.showSpatialInput = false;
		}

        $scope.hasPermission = function(permission) {
            return authService.hasPermission(permission);
        };

		function _reload(response) {
			if(response.action === 'login') {
				_init();
			}
		}
		authService.addObserver(_reload);

		_init();

		/**
		 * @function - on page load, fetch data
		 */
		function _init() {

			// update cart count in case something was removed from index
			cartService.fetch(false).then(function(data) {
				cartService.setQueryCount(data.count);
			}, function(error) {
				$log.error(error);
			});

			//fetch for featured items and collections
			homeService.fetchCollections().then(function(respond) {
				$scope.collections = respond;
			});

			homeService.fetchFeatured().then(function(respond) {
				$scope.featured = respond;
			});

			$scope.$watch('selectedMapType', function(){
				if ($scope.selectedMapType === 'Map') {
					$scope.showMap = true;
					$scope.displayFormat = 'short_format';
				} else {
					$scope.showMap = false;
					$scope.displayFormat = 'detail_format';
				}
			});

			$scope.$on('updateSearchType', function (e, type) {
				$scope.selectedMapType = type;
			});

			$scope.$on('updateSearchDrawingType', function(event, args){
				$scope.selectedDrawingType = args;
			});
		}

		$scope.saveLocation = function() {
			$uibModal.open({
                template: '<vs-save-location-dialog />',
                size: 'md',
                scope: $scope
            });
		};

		$scope.clearField = function() {
			if ($scope.showMap) {
				delete $scope.search.displayBBox;
			} else {
				$scope.search.location = '';
			}
		};

		/**
		 * @function - toggle between recent and saved search list
		 */
		function _changeSearchTab(type) {
			$scope.showRecent = (type === 'recent');
		}

		/**
		 * @function - redirect user to search result page
		 */
		function _submitSearch() {
			var params = {};

			if (!_.isEmpty($scope.search.query)) {
				params.q = $scope.search.query;
			}

			if ($scope.selectedMapType === 'Place') {
				if (!_.isEmpty($scope.search.location)) {
					params.place = $scope.search.location;
                    var placeId = $location.search()['place.id'];
                    if(angular.isDefined(placeId)) {
                        params['place.id'] = placeId;
                    }
					params['place.op'] = $scope.selectedDrawingType.toLowerCase();
				}
			} else if ($scope.search.place !== undefined) {
				params.place = $scope.search.place;
				params['place.op'] = $scope.selectedDrawingType.toLowerCase();
			}

			var disp = $location.search().disp;
			if(angular.isDefined(disp)) {
				params.disp = disp;
			}

			//get the default saved search and apply to params
			savedSearchQuery.fetchDefaultParams().then(function(solrParams) {
				// these are overridden by the home page inputs
				if(!_.isEmpty(params.q)) {
					delete solrParams.q;
				}
				if(!_.isEmpty(params.place)) {
					delete solrParams.place;
					delete solrParams['place.op'];
					delete solrParams['place.id'];
				}
				params = _.extend(params, solrParams);
				$location.path('search').search(params);
			});

			return false;
		}

		/**
		 * @function - change selected map type
		 */
		function _changeSelectedType(type) {
			$scope.selectedMapType = type;
		}


		$scope.$on('$destroy', function() {
			authService.removeObserver(_reload);
		});

	});