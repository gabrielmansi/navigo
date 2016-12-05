describe('Preview Directive:', function () {
    'use strict';

    beforeEach(function () {
        module('templates');
        // module('voyager.common'); //auth service module - apparently this is needed to mock the auth service
        module('voyager.details');
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
        $window = {location:{href:''}};
        $document = _$document_;
    }));

    function applyDirective() {

        //httpMock.expectGET(new RegExp('auth')).respond({}); // auth call

        element = angular.element('<div vs-preview class="relationship"><span class="label"><a data-id="id">node</a></span></div>');
        compiled = $compile(element)($rootScope);
        $(document.body).append(element);
        var preview = angular.element('<div id="preview" ui-view="preview"></div>');
        $(document.body).append(preview);
        element.scope().$apply();
    }

    describe('Functions', function() {
        it('should not preview on mouseenter with no doc', function () {
            applyDirective();

            $(element).find('.label a').trigger('mouseenter');

            // details lookup calls
            httpMock.expectJSONP(new RegExp('solr\/v0')).respond({response:{docs:[]}});
            httpMock.expectJSONP(new RegExp('solr\/fields')).respond({response:{docs:[]}});

            timeout.flush();
            httpMock.flush();

            expect($('#preview').css('display')).toBe('none');

        });

        it('should preview on mouseenter and close on mouseleave', function () {
            applyDirective();

            $(element).find('.label a').trigger('mouseenter');

            // details lookup calls
            httpMock.expectJSONP(new RegExp('solr\/v0')).respond({response:{docs:[{id:'id', format:'format'}]}});
            httpMock.expectJSONP(new RegExp('solr\/fields')).respond({response:{docs:[{id:'id', format:'format', name: 'name:[name]'}]}});

            timeout.flush();
            httpMock.flush();

            expect(scope.node.displayFormat).toBe('format');
            expect($('#preview').css('display')).toBe('block');

            $(element).find('.label a').trigger('mouseleave');
            timeout.flush();

            expect($('#preview').css('display')).toBe('none');
        });

    });


});