'use strict';

angular.module('voyager.layout')
	.controller('HeaderCtrl', function(config, $rootScope, $scope, $uibModal, $window, $location, $stateParams, sugar, cartService, authService, savedSearchService, $state, catalogService) {

		var vm = this;

		vm.queue = {};
		vm.login = _login;
		vm.logout = _logout;
		vm.showSavedSearch = _showSavedSearch;
		vm.manageLink = config.root + 'manage';
		vm.myVoyagerLink = config.root + 'manage';
		vm.showClassicLink = false;
		vm.showNav = $location.path() !== '/login';
		vm.buildRev = '@build.revision@';
		vm.mobileToggleClass = 'fa fa-bars';
		vm.logo = config.root + 'pub/header.png';

		vm.uiText = config.ui.navbar;

		vm.debug = $location.search().debug === 'true';

		if(angular.isDefined($location.search().disp)) {
			vm.disp = '?disp=' + $location.search().disp;
		}


		$scope.$on('filterChanged', function () {
			if(angular.isDefined($location.search().disp)) {
				vm.disp = '?disp=' + $location.search().disp;
			}
		});

		$rootScope.$on('$stateChangeStart', function(event, toState){
			vm.showNav = toState.name !== 'login';
		});

		vm.gotoPage = function(route) {
			$window.location.href = route + '?disp=' + ($location.search().disp || 'default');
			vm.toggleMobileNav();
		};

		vm.clearQueue = function() {
			cartService.clear();
			$scope.$emit('removeAllCartEvent',{});
			vm.toggleMobileNav();
		};

		vm.toggleMobileNav = function() {
			if (vm.navClass === '' || vm.navClass === undefined) {
				vm.navClass = 'full_width';
				vm.mobileToggleClass = 'icon-x';
			} else {
				vm.navClass = '';
				vm.mobileToggleClass = 'fa fa-bars';
			}
		};

		_init();

		function _init() {
			_updateUserInfo();
			//add queue observer
			cartService.addObserver(_updateQueueTotal);
			authService.addObserver(_updateUserInfo);
			$scope.$on('$stateChangeSuccess', _updateClassicLink);
		}

		function _updateClassicLink() {
			if (authService.hasPermission('manage')) {
				var path = $location.path();
				vm.showClassicLink = (path.indexOf('/search') > -1 || path.indexOf('/show') > -1 || path.indexOf('/home') > -1);
			} else {
				vm.showClassicLink = false;
			}
		}

		function _logout() {
			authService.doLogout();
            //$window.location.reload();
            $state.go('login');
		}

		function _updateQueueTotal() {
			vm.queueTotal = cartService.getCount() || '0';
		}

		function _updateUserInfo() {
			vm.isAnonymous = authService.isAnonymous();
			vm.state = authService.getState();
			vm.user = authService.getUser();
			vm.canCart = authService.hasPermission('process');
			vm.canManage = authService.hasPermission('manage');
			vm.canSaveSearch = authService.hasPermission('save_search');
			vm.showLogout = authService.showLogout();
			_updateClassicLink();

			if (vm.canCart) {
				_updateQueueTotal(); //on initial load, update queue item
			}
		}

		function _showLoginDialog() {
			var modalInstance = $uibModal.open({
				templateUrl: 'common/security/login.html',
				size:'md',
				controller: 'AuthCtrl'
			});

			modalInstance.result.then(function () {

			}, function () {
				//$log.info('Modal dismissed at: ' + new Date());
			});

			vm.toggleMobileNav();
		}

		function _login() {
			if (!vm.loggedIn) {
				authService.checkAccess().then(function(hasAccess) {
					if(!hasAccess) {
						_showLoginDialog();
					}
				});
			} else {
				authService.doLogout();
			}
		}

		function _showSavedSearch() {
			$uibModal.open({
                template: '<saved-content />',
                size:'lg',
                scope: $scope
            });

			vm.toggleMobileNav();
		}

		vm.goToClassic = function() {

			var params = $location.search();
			var baseUrl = config.root + config.explorePath + '/#/';

			if (params.view === 'card') {
				delete params.view;
			}

			if (angular.isDefined(params.shard)) {
				var catalog = catalogService.lookup(params.shard);
				if (angular.isDefined(catalog)) {
					params.shard = catalog.id;
				}
			}
			params = sugar.retroParams(params);

			var path = $location.path();
			if (path.indexOf('/show') !== -1) {
				baseUrl += path.replace('/show', '');
			} else if(path.indexOf('/home') !== -1) {
				params = ''; // just show default search in classic for home page
			}

			$window.open(baseUrl + params, '_blank');
		};

		$scope.$on('$destroy', function() {
			authService.removeObserver(_updateUserInfo);
			cartService.removeObserver(_updateQueueTotal);
		});

	});
