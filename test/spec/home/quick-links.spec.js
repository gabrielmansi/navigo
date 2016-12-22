'use strict';

describe('SavedSearchEdit', function () {
    var document, $compile, element, scope, controller, compiled, $http, $timeout, $componentController;

    beforeEach(function () {
        module(function ($provide) {
            $provide.constant('config', {});
        });

        module('templates');
        module('voyager.home');
    });

    beforeEach(inject(function (_$compile_, _$document_, _$rootScope_, _$httpBackend_, _$timeout_, _$componentController_){
        $compile = _$compile_;
        document = _$document_;
        scope = _$rootScope_.$new();
        $http = _$httpBackend_;
        $timeout = _$timeout_;
        $componentController = _$componentController_;
    }));

    function applyDirective() {
        element = angular.element('<vs-quick-links list="list"></vs-quick-links>');
        compiled = $compile(element)(scope);

        $(document.body).append(element);
        scope.outside = '1.5';
        scope.$apply();

        controller = element.controller('vsQuickLinks');
    }

    it('should load', function () {

        applyDirective();

        scope.list = [{title: 'one', categories: ['one', 'two']}, {title: 'two', categories: ['two']}];
        scope.$apply();

        expect(controller.categories.length).toBe(2);
        expect(controller.categories[0].list.length).toBe(1);
        expect(controller.categories[1].list.length).toBe(2);
    });

});
