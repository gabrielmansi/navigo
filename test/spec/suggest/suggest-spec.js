/*global describe, beforeEach, module, it, inject, expect, angular, config */

describe('Suggest:', function () {
    'use strict';

    beforeEach(function () {
        module('templates');
       // module('voyager.common'); //auth service module - apparently this is needed to mock the auth service
        module('voyager.search');
        module(function ($provide) {
            $provide.constant('config', config);
        });
    });

    var scope, element, controller, compiled, timeout, httpMock, $location, $document, $rootScope;

    beforeEach(inject(function ($compile, _$rootScope_, $timeout, $httpBackend, _$location_, _$document_){
        scope = _$rootScope_.$new();
        element = angular.element('<input type="text" vs-suggest>');
        compiled = $compile(element)(_$rootScope_);
        element.scope().$apply();
        controller = element.controller(scope);
        timeout = $timeout;
        httpMock = $httpBackend;
        $location = _$location_;
        $document = _$document_;
        $rootScope = _$rootScope_;
    }));

    describe('Should Not Suggest', function() {
        it('should not suggest on enter key', function () {
            element.val('1234');
            var event = {'type':'keydown', which:13};
            compiled.triggerHandler(event);
            expect(element.next().html()).not.toContain('suggest-item');
        });

        it('should not suggest on blur', function () {
            element.val('1234');
            compiled.triggerHandler('blur');
            timeout.flush();
            expect(element.next().html()).not.toContain('suggest-item');
            expect(element.scope().suggestions).toEqual([]);
        });

        it('should not suggest on focus when selected', function () {
            element.val('1234');
            element.scope().select({name:'place'});

            compiled.triggerHandler('focus');
            timeout.flush();
            expect(element.next().html()).not.toContain('suggest-item');
            expect(element.scope().selectedPlace).toBeTruthy();
        });
    });

    describe('Should Suggest', function () {

        function _flushHttp() {
            httpMock.flush();
            httpMock.verifyNoOutstandingExpectation();
            httpMock.verifyNoOutstandingRequest();
        }

        it('should show suggestions on text entered', function () {
            httpMock.expectJSONP().respond({placefinder:{results:[{name:'suggestion'}]}});

            element.val('1234');
            var event = {'type':'keydown', which:1};
            compiled.triggerHandler(event);
            timeout.flush();

            _flushHttp();

            expect(element.next().html()).toContain('suggest-item');
        });

        it('should show suggestions on text entered', function () {
            httpMock.expectJSONP().respond({placefinder:{results:[{name:'suggestion'}]}});

            element.val('1234');
            var event = {'type':'keydown', which:1};
            compiled.triggerHandler(event);
            timeout.flush();

            _flushHttp();

            expect(element.next().html()).toContain('suggest-item');
        });

        it('should suggest after search event', function () {
            $location.search().place = 'place';

            var data = {placefinder:{results:[{name:'other place'}], match:{name:'',id:'id'}, search:{text:'place'}}};
            scope.$emit('searchResults', data);

            expect(scope.location).toBe('place');
            expect($location.search()['place.id']).toBe('id');
        });

        it('should not suggest after click away', function () {
            var event = {'type':'click'};

            spyOn($document,'off').and.callThrough();

            $document.triggerHandler(event);

            //TODO how to expect
            //expect($document.off).toHaveBeenCalled();
        });

    });
});