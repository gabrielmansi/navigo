'use strict';

describe('Controller: SavedSearchDialogCtrl', function () {

    var $scope, $timeout, $location, $http, $controller, authService, savedSearchService, recentSearchService;
    var cfg = _.clone(config);

    beforeEach(function () {

        module('voyager.security');
        module('voyager.search');
        module('voyager.util');
        module('voyager.filters');
        module('voyager.config');
        module('ui.bootstrap');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });

        inject(function (_$controller_, _$timeout_, _authService_, _$location_, $httpBackend, _savedSearchService_, _recentSearchService_, $rootScope) {
            $scope = $rootScope.$new();
            $timeout = _$timeout_;
            $location = _$location_;
            $http = $httpBackend;
            $controller = _$controller_;
            authService = _authService_;
            savedSearchService = _savedSearchService_;
            recentSearchService = _recentSearchService_;
        });

    });

    // Specs here
    function initCtrl(permission) {
        $controller('SaveSearchDialog', {
            $scope: $scope,
            $uibModalInstance:{close:function(){}},
            searchItem:{query:{}}
        });

        //TODO why twice??
        $http.expectGET(new RegExp('auth\/info')).respond({permissions:permission, user:{groups:[]}}); //auth call

        if(permission.manage) {
            $http.expectGET(new RegExp('auth\/info\/groups')).respond({groups:[]}); //auth call
        } else if (permission.share_saved_search) {
            $http.expectGET(new RegExp('auth\/info')).respond({permissions:permission, user:{groups:[]}}); //auth call
        }

        $http.flush();
        $timeout.flush();
    }

    it('should init as admin', function () {
        spyOn(authService,'hasPermission').and.returnValue(true);
        initCtrl({manage:true});
    });

    it('should init as sharer', function () {
        //$http.expectGET(new RegExp('auth')).respond({manage:false, share_saved_search: true}); //auth call
        initCtrl({manage:false, share_saved_search: true});
    });

    it('should save', function () {
        //$http.expectGET(new RegExp('auth')).respond({manage:false, share_saved_search: true}); //auth call
        initCtrl({manage:false, share_saved_search: true});

        $scope.savedSearch.title = 'junk';
        $scope.savedSearch.makeDefault = true;

        $http.expectJSONP(new RegExp('ssearch')).respond({response:{docs:[]}}); //save search
        $http.expectGET(new RegExp('conf')).respond({defaultView: 'Card'});
        $http.expectPOST(new RegExp('ssearch')).respond({manage:false, share_saved_search: true}); //save search

        $scope.ok();

        $http.flush();

    });

    it('should not save when exists', function () {
        initCtrl({manage:false, share_saved_search: true});

        $scope.savedSearch.title = 'junk';
        $scope.savedSearch.makeDefault = true;

        $http.expectJSONP(new RegExp('ssearch')).respond({response:{docs:[{owner:'owner'}]}}); //save search
        $http.expectGET(new RegExp('conf')).respond({defaultView: 'Card'});

        $scope.ok();

        $http.flush();
    });
});