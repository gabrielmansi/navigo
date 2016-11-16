describe('Search Map Directive:', function () {
    'use strict';

    var cfg = _.clone(config);

    beforeEach(function () {
        module('templates');
        // module('voyager.common'); //auth service module - apparently this is needed to mock the auth service
        module('voyager.search');
        module(function ($provide) {
            $provide.constant('config', cfg);
        });
    });

    var scope, $timeout, httpMock, compile, leafletData, $q, element, compiled, controller;

    function initDirective() {
        element = angular.element('<div vs-search-map></div>');
        compiled = compile(element)(scope);
        element.scope().$apply();
        controller = element.controller(scope);
        $(document.body).append(element);
    }

    beforeEach(inject(function ($compile, $rootScope, _$timeout_, $httpBackend, _leafletData_, _$q_) {
        scope = $rootScope.$new();
        $timeout = _$timeout_;
        httpMock = $httpBackend;
        compile = $compile;
        leafletData = _leafletData_;
        $q = _$q_;
    }));


    describe('Render', function () {

        it('should render leaflet map', function () {
            initDirective();

            $timeout.flush();

            expect(element.html()).toContain('leaflet');
        });

        it('should toggle map mode', function () {
            scope.displayFormat = 'detail_format';
            initDirective();
            expect(element.hasClass('dragging_disabled')).toBeTruthy();

            scope.displayFormat = 'short_format';
            scope.$apply();

            $timeout.flush();

            expect(element.hasClass('dragging_disabled')).toBeFalsy();
        });

        it('should zoom', function () {
            initDirective();

            scope.zoomIn($.Event( 'click' ));

            scope.zoomOut($.Event( 'click' ));
        });

        it('should toggle display format', function () {
            initDirective();

            scope.toggleDisplayFormat('Card', $.Event('click'));

            expect(scope.selectedMapType).toBe('Card');
        });

        it('should draw rectangle', function () {
            scope.selectedDrawingType = 'Intersects';
            scope.displayFormat = 'detail_format';

            initDirective();

            scope.selectDrawingTool($.Event('click'), 'rectangle');

            leafletData.getMap().then(function(map) {
                map.vsSearchType = 'junk';
                var bounds = [[0, -0], [0, -0]];
                var layer = L.rectangle(bounds, {color: '#ff7800', weight: 1});
                map.fire('draw:created',{layer: layer});
                map.fire('draw:drawstop');

                // fire again so it removes and re applies
                map.fire('draw:created',{layer: layer});
                map.fire('draw:drawstop');

                expect(scope._bbox).toEqual('0 0 0 0');
            });

            scope.$apply();
            $timeout.flush();
        });

        it('should draw polygon', function () {
            scope.selectedDrawingType = 'Intersects';
            scope.displayFormat = 'detail_format';

            initDirective();

            scope.selectDrawingTool($.Event('click'), 'polygon');

            leafletData.getMap().then(function(map) {
                map.vsSearchType = 'junk';
                var bounds = [[0, -0], [0, -0]];
                var layer = L.polygon(bounds, {color: '#ff7800', weight: 1});
                map.fire('draw:created',{layer: layer});
                map.fire('draw:drawstop');

                expect(scope._bbox).toEqual('POLYGON((0 0,0 0))');
            });

            scope.$apply();
            $timeout.flush();
        });

        it('should draw point', function () {
            scope.selectedDrawingType = 'Intersects';
            scope.displayFormat = 'detail_format';

            initDirective();

            scope.selectDrawingTool($.Event('click'), 'point');

            leafletData.getMap().then(function(map) {
                map.vsSearchType = 'junk';
                var layer = L.marker([0, 0]);
                map.fire('draw:created',{layer: layer});
                map.fire('draw:drawstop');

                expect(scope._bbox).toEqual('POINT(0 0)');
            });

            scope.$apply();
            $timeout.flush();
        });

        // TODO this fails in the wicket lib
        //it('should draw polyline', function () {
        //    scope.selectedDrawingType = 'Intersects';
        //    scope.displayFormat = 'detail_format';
        //
        //    initDirective();
        //
        //    scope.selectDrawingTool($.Event('click'), 'polyline');
        //
        //    leafletData.getMap().then(function(map) {
        //        map.vsSearchType = 'junk';
        //        var layer = L.polyline([[0, -0], [0, -0]]);
        //        map.fire('draw:created',{layer: layer});
        //        map.fire('draw:drawstop');
        //
        //        expect(scope._bbox).toEqual('POINT(0 0)');
        //    });
        //
        //    scope.$apply();
        //    $timeout.flush();
        //});

        it('should resize', function () {
            scope.selectedDrawingType = 'Intersects';
            scope.displayFormat = 'detail_format';

            spyOn(leafletData,'getMap').and.callThrough();

            // TODO function in outer scope, fix this
            scope.toggleMap = function(){};

            initDirective();

            scope.resize();

            scope.$apply();
            $timeout.flush();

            expect(scope.selectedDrawingType).toBe('Intersects');
            expect(leafletData.getMap).toHaveBeenCalled();
        });

        it('should zoom', function () {
            initDirective();

            scope.addMapSizeToggleControl();

            expect(scope.controls.custom.length).toBe(4);

            var control = scope.controls.custom[3];
            var template = control.onAdd();

            expect(template.innerHTML).toContain('map-size-drop-down');
        });
    });

});