/*global describe, beforeEach, module, it, inject, config */

describe('TaskCtrl', function () {

    'use strict';

    beforeEach(function () {
        //module('voyager.security'); //auth service module - apparently this is needed to mock the auth service
        module('taskRunner');
        module('LocalStorageModule');
        module('angulartics');
        module('ui.bootstrap');
        module('cart');
        module('voyager.filters');
        module('ui.router');
        module('dialogs.main');
        module(function ($provide) {
            $provide.constant('config', config);
            //$provide.value('authService',{});  //mock the auth service so it doesn't call the init methods
        });
    });

    var scope, controllerService, q, location, timeout, httpMock, $uibModal, cartService, $state;

    beforeEach(inject(function ($rootScope, $controller, $q, $location, $timeout, $httpBackend, _$uibModal_, _cartService_, _$state_) {
        scope = $rootScope.$new();
        q = $q;
        controllerService = $controller;
        location = $location;
        timeout = $timeout;
        httpMock = $httpBackend;
        $uibModal = _$uibModal_;
        cartService = _cartService_;
        $state = _$state_;
        spyOn($state, 'go');
    }));

    var inputItemsWithQuery = {name:'input_items', query:{fq:'field:facet', params:{bbox:'',bboxt:''}}, ids:[], type:'VoyagerResults', response:{docs:[]}};

    function initCtrl() {
        //spyOn(location,'path').and.returnValue('status');
        //
        httpMock.expectGET(new RegExp('projections')).respond({});  // param service - projections call (could mock param service)
        httpMock.expectGET(new RegExp('task\/name\/init')).respond({params:[inputItemsWithQuery]});  // check status call
        httpMock.expectGET(new RegExp('display')).respond({params:[inputItemsWithQuery]});  // check status call
        var stateParams = {task:{name:'name'}};
        controllerService('TaskCtrl', {$scope: scope, $stateParams:stateParams, $state: $state});

        httpMock.flush();
    }

    //function escapeRegExp(str) {
    //    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    //}

    describe('Load', function () {

        it('should load', function () {
            initCtrl();
        });

        it('should exec', function () {

            cartService.addQuery({fq:'field:facet',params:{bbox:'',bboxt:''}, solrFilters:[], bounds:'&fq=bbox:0000'});
            cartService.addItem({id:'1'});

            initCtrl();

            httpMock.expectPOST(new RegExp('validate=true')).respond({});  // validate
            httpMock.expectPOST(new RegExp('validate=false')).respond({id:'id'});  // exec

            scope.execTask();

            httpMock.flush();

            expect($state.go).toHaveBeenCalledWith('status', {id: 'id'});
        });

        it('should exec using filters and bbox', function () {
            cartService.remove(1);
            var q = {fq:'field:facet', params:{filter:'true', bbox:'',bboxt:''}, filters:'&fq={!tag=format_type}format_type:(File)', solrFilters:[], bounds:'&fq=bbox:0000'};
            cartService.addQuery(q);
            initCtrl();

            //httpMock.expectPOST(new RegExp('validate=true'), new RegExp(escapeRegExp('"fq":"{!tag=format_type}format_type:(File)"}'))).respond({id:'id'});  // validate
            httpMock.expectPOST(new RegExp('validate=true'), '{"task":"name","params":[{"name":"input_items","query":{"filter":"true","fq":["","{!tag=format_type}format_type:(File)"]},"type":"VoyagerResults","response":{"docs":[]},"readOnly":false,"label":"","desc":""}]}').respond({id:'id'});
            httpMock.expectPOST(new RegExp('validate=false')).respond({id:'id'});  // exec

            scope.execTask();

            httpMock.flush();

            expect($state.go).toHaveBeenCalledWith('status', {id: 'id'});
        });

        it('should exec using filters', function () {
            cartService.remove(1);
            var q = {fq:'field:facet', params:{filter:'true'}, filters:'&fq={!tag=format_type}format_type:(File)'};
            cartService.addQuery(q);
            initCtrl();

            //httpMock.expectPOST(new RegExp('validate=true'), new RegExp(escapeRegExp('"fq":"{!tag=format_type}format_type:(File)"}'))).respond({id:'id'});  // validate
            httpMock.expectPOST(new RegExp('validate=true'), '{"task":"name","params":[{"name":"input_items","query":{"filter":"true","fq":["","{!tag=format_type}format_type:(File)"]},"type":"VoyagerResults","response":{"docs":[]},"readOnly":false,"label":"","desc":""}]}').respond({id:'id'});
            httpMock.expectPOST(new RegExp('validate=false')).respond({id:'id'});  // exec

            scope.execTask();

            httpMock.flush();

            expect($state.go).toHaveBeenCalledWith('status', {id: 'id'});
        });

        it('should fail validation', function () {
            cartService.addQuery({fq:'field:facet',params:{bbox:'',bboxt:''}, solrFilters:[], bounds:'&fq=bbox:0000'});
            cartService.addItem({id:'1'});

            initCtrl();

            httpMock.expectPOST(new RegExp('validate=true')).respond(500,{params:[inputItemsWithQuery], errors:['error']});  // validate

            scope.execTask();

            httpMock.flush();

            expect(scope.errors).toEqual(['error']);

            scope.setError('error message');

            expect(scope.errorMessage).toBe('error message');
        });

        it('should select task', function () {
            cartService.addQuery({fq:'field:facet',params:{bbox:'',bboxt:''}});
            cartService.addItem({id:'1'});

            initCtrl();

            httpMock.expectGET(new RegExp('task2\/init')).respond({params:[inputItemsWithQuery]});  // validate
            httpMock.expectGET(new RegExp('display')).respond({params:[inputItemsWithQuery]});  // display

            scope.selectTask({name:'task2', available:true});

            httpMock.flush();

            //expect(location.path()).toBe('/status/id');
        });

    });

});