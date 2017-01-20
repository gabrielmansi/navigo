describe('Filter Directive:', function () {
  'use strict';

  beforeEach(function () {
    module('templates');
    // module('voyager.common'); //auth service module - apparently this is needed to mock the auth service
    module('voyager.search');
    module(function ($provide) {
      $provide.constant('config', config);
    });
  });

  var scope, element, compiled, timeout, httpMock, $window, $document, $compile, $rootScope;

  beforeEach(inject(function (_$compile_, _$rootScope_, $timeout, $httpBackend, _$window_, _$document_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    $compile = _$compile_;
    timeout = $timeout;
    httpMock = $httpBackend;
    $window = _$window_;
    $document = _$document_;
  }));

  function applyDirective() {
    element = angular.element('<div vs-filter>Filter</div>');
    compiled = $compile(element)($rootScope);
    $(document.body).append(element);
    element.scope().$apply();
  }

  describe('Functions', function() {
    it('should render date', function () {
      $rootScope.facet = {stype:'date'};
      applyDirective();

      expect(element.text().indexOf('Date') > -1).toBeTruthy();
    });

    it('should render checkbox', function () {
      $rootScope.facet = {style:'CHECK'};
      applyDirective();

      expect(element.html().indexOf('checkbox') > -1).toBeTruthy();
    });

    it('should render range', function () {
      $rootScope.facet = {style:'RANGE'};
      applyDirective();

      expect(element.html().indexOf('slider_wrap') > -1).toBeTruthy();
    });

    it('should render range with unit', function () {
      $rootScope.facet = {style:'RANGE', units:['a', 'b']};
      applyDirective();

      expect(element.html().indexOf('unit') > -1).toBeTruthy();
    });

    it('should render stats', function () {
      $rootScope.facet = {style:'STATS'};
      applyDirective();

      expect(element.html().indexOf('slider_wrap') > -1).toBeTruthy();
      expect(element.html().indexOf('stats_wrap') > -1).toBeTruthy();
    });

    it('should render tree', function () {
      $rootScope.facet = {filter:'folder_hier'};
      applyDirective();

      expect(element.html().indexOf('folder_tree') > -1).toBeTruthy();
    });

    it('should render button', function () {
      $rootScope.facet = {};
      applyDirective();

      expect(element.html().indexOf('<a') === 0).toBeTruthy();
    });
  });

});