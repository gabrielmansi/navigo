'use strict';

describe('Factory: detailConfig', function () {

	var detailConfig, configLoader, translateService, configService, $q, $http;

	beforeEach(function () {

		module('voyager.details');
		module(function ($provide) {
			$provide.constant('config', config);
		});

		inject(function (_detailConfig_, _configLoader_, _translateService_, _configService_, _$q_, $httpBackend) {
			detailConfig = _detailConfig_;
			configLoader = _configLoader_;
			translateService = _translateService_;
			configService = _configService_;
			$q = _$q_;
			$http = $httpBackend;
		});
	});

	// Specs here

	var dispFields = [{name: 'name', style: 'STRIP_HTML'},{name:'format', style: 'HTML'}, {name:'contains_mime'}, {name:'location'}, {name:'abstract'}, {name: 'description'}];
	var res = {
		details: {pageElements: {}, detailsTableFields: dispFields, summaryFields: {fields: dispFields}},
		display: {
			path: true,
			fields: dispFields
		},
		cardView: {
			fields: dispFields
		},
		fields: {
			fields: dispFields
		}
	};

	beforeEach(function() {
		//$http.expectGET(new RegExp('auth')).respond({permissions:{manage:true, process:true}});  // auth call
		$http.expectGET(new RegExp('root\/api\/rest\/i18n\/field\/location.json')).respond({VALUE:{location:'location'}}); // location call
		$http.expectGET(new RegExp('federation')).respond({servers:[]});

        $http.expectGET(new RegExp('maps')).respond({});
		$http.expectGET(new RegExp('root\/api\/rest\/display\/config\/config.json')).respond(res);  // display call

		$http.expectJSONP(new RegExp('fields')).respond({response:{docs:[]}});  // fields call

		$http.expectGET(new RegExp('root\/api\/rest\/display\/config\/config.json')).respond(res);  // display call

		detailConfig.load('config');
		$http.flush();
	});

	it('should load', function () {

	});

	it('should get fields', function () {
		var doc = { name: ['name'], format: 'format', contains_mime: ['mime'], location: 'location', abstract: 'abstract', description: 'description'};
		var fields = {name:{displayable:true, editable:true}, format:{displayable:true}, contains_mime:{displayable:true}, location:{displayable:true}};

        var actual = detailConfig.getFields(doc,fields);
		actual = actual.filter(function(val){return val.formattedValue !== '';});

		expect(actual.length).toBe(Object.keys(fields).length);
	});

	it('should get summary fields', function () {
		var doc = { name: ['name'], format: 'format', contains_mime: ['mime','2'], location: 'location', abstract: 'abstract', description: 'description'};
		var fields = {name:{displayable:true}, format:{displayable:true}, contains_mime:{displayable:true}, location:{displayable:true}, abstract:{displayable:true}, description:{displayable:true}};

		var actual = detailConfig.getSummaryFields(doc,fields);

		expect(actual.length).toBe(Object.keys(fields).length);
	});

});