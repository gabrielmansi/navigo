'use strict';

describe('Factory: cartService', function () {

	var cartService, cartItemsQuery, translateService, $http, queryBuilder, $q, localStorageService;

	var cfg = _.clone(config);

	beforeEach(function () {
		module('voyager.util');
		module('voyager.filters');
		module('voyager.config');
		module('cart');
		module(function ($provide) {
			$provide.constant('config', cfg);
		});

		inject(function (_cartService_, _cartItemsQuery_, _translateService_, _$http_, _queryBuilder_, _$q_, _localStorageService_) {
			cartService = _cartService_;
			cartItemsQuery = _cartItemsQuery_;
			translateService = _translateService_;
			$http = _$http_;
			queryBuilder = _queryBuilder_;
			$q = _$q_;
			localStorageService = _localStorageService_;
		});
	});

	// Specs here

	it('should add item to cart', function () {

		function observer() {}
		observer.do = function(length, itemMap) {
			expect(length).toBe(1);
			expect(itemMap.junk).toBeDefined();
		};

		spyOn(observer, 'do').and.callThrough();

		cartService.addObserver(observer.do);

		cartService.addItem({id:'junk'});

		expect(observer.do).toHaveBeenCalled();

		var items = cartService.getItems();

		expect(items.junk).toBeDefined();

		expect(cartService.hasItems()).toBeTruthy();
	});

	it('should add item and query', function () {
		function observer() {}
		observer.do = function(length, itemMap) {
			expect(length).toBe(1);
			expect(itemMap.junk).toBeDefined();
		};

		spyOn(observer, 'do').and.callThrough();

		cartService.addObserver(observer.do);

		//spyOn(localStorageService, 'get').and.returnValue({filters: '&fq=id:junk'});

		cartService.addItem({id:'junk'});
		cartService.addQuery({filters: '&fq=id:junk', count: 0});

		expect(observer.do).toHaveBeenCalled();
	});

	it('should add query then item then remove item from query', function () {

		cartService.clear();
		cartService.addQuery({solrFilters:['-id:junk'], count: 1});
		cartService.addItem({id:'junk'});

		var query = cartService.getQuery();

		expect(query.count).toBe(2);

		expect(cartService.getCount()).toBe(2);
	});

	it('should replace query', function () {

		cartService.clear();
		cartService.addQuery({filters: '&fq=-id:junk', count: 2});

		cartService.replace({count: 1});

		var query = cartService.getQuery();
		expect(query.count).toBe(1);

		expect(cartService.getCount()).toBe(1);
	});

	it('should remove item', function () {

		cartService.clear();
		cartService.addItem({id:'junk'});

		cartService.remove('junk');

		expect(cartService.getCount()).toBe(0);
	});

	it('should remove item from query', function () {

		cartService.clear();
		cartService.addQuery({count: 2});

		cartService.remove('junk');

		expect(cartService.getCount()).toBe(1);
		var query = cartService.getQuery();
		expect(query.solrFilters[0]).toBe('-id:junk');
	});

	it('should set count', function () {

		cartService.clear();
		cartService.addQuery({count: 2});

		cartService.setQueryCount(3);

		expect(cartService.getCount()).toBe(3);
	});

	it('should sync with item count', function () {

		cartService.clear();
		cartService.addItem({id:'junk'});

		cartService.setQueryCount(3);

		expect(cartService.getCount()).toBe(1);
	});
});