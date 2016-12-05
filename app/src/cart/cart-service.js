/*global angular, $, _ */

angular.module('cart')
    .config(['localStorageServiceProvider', function (localStorageServiceProvider) {
        'use strict';
        localStorageServiceProvider.setPrefix('vs');
    }])
    .factory('cartService', function (localStorageService, queryBuilder, $http, $q, translateService, cartItemsQuery) {
        'use strict';
        var observers = [], CART_STORAGE_NAME = 'cart-items';

        var _notify = function (itemMap, action) {
            var length = _.size(itemMap);
            var query = localStorageService.get('cart-query');
            if(query) {
                length += query.count;
            }
            observers.forEach(function (entry) {
                entry(length, itemMap, action);
            });
        };

        var _getItems = function () {
            var items = localStorageService.get(CART_STORAGE_NAME);
            if (items) {
                return items;
            }
            return {};
        };

        var _notifyCount = function (count) {
            var items = _getItems();
            observers.forEach(function (entry) {
                entry(count, items);
            });
        };

        function _setItems(items) {
            var itemMap = {};
            $.each(items, function( index, value ) {
                itemMap[value.id] = value.id;
            });
            localStorageService.add(CART_STORAGE_NAME, itemMap);
            _notify(itemMap);
        }

        function _syncItems() {
            return cartItemsQuery.fetchItemsOnly(_getItems()).then(function(items) {
                _setItems(items);
                return;
            });
        }

        // function _decorator(items) {
        //     $.each(items, function(index, item) {
        //         item.displayFormat = translateService.getType(item.format);
        //     });
        // }

        return {
            addItem: function (item) {
                var query = localStorageService.get('cart-query');
                var removedFilter = false;
                if(query) {
                    if(angular.isDefined(query.filters)) {
                        if (query.filters.indexOf('&fq=-id:' + item.id) !== -1) {
                            query.filters = query.filters.replace('&fq=-id:' + item.id, '');
                            if (query.filters === '') {
                                delete query.filters;
                            }
                            removedFilter = true;
                        }
                    }
                    query.count = query.count + 1;
                    this.addQuery(query);
                }

                if(!removedFilter) {  //wasn't filtered out so add it
                    var itemMap = _getItems();
                    itemMap[item.id] = item.id;
                    localStorageService.add(CART_STORAGE_NAME, itemMap);
                }
                _notify(_getItems());
            },
            addItems: function (items) {
                var itemMap = _getItems();
                $.each(items, function( index, item ) {
                    itemMap[item.id] = item.id;
                });
                localStorageService.add(CART_STORAGE_NAME, itemMap);
                _notify(itemMap);
                var query = localStorageService.get('cart-query');
                if (query) {
                    query.count += items.length;
                    this.addQuery(query);
                }
            },
            getItems: function () {
                return _getItems();
            },
            setItems: function(items) {
                _setItems(items);
            },
            getCount: function () {
                var count = 0;
                var query = this.getQuery();
                if(query) {
                    count += query.count;
                    if (query.actualCount) {
                        return count;
                    }
                }
                count += _.size(_getItems());
                return count;
            },
            addObserver: function (observer) {
                observers.push(observer);
            },
            removeObserver: function (observer) {
                observers = _.without(observers, observer);
            },
            remove: function (id) {
                var itemMap = _getItems();
                var query = localStorageService.get('cart-query');
                if(angular.isDefined(itemMap[id])) {
                    delete itemMap[id];
                    localStorageService.add(CART_STORAGE_NAME, itemMap);
                    _notify(itemMap);
                }
                if(query) {
                    if(angular.isUndefined(query.filters)) {
                        query.filters = '';
                    }
                    query.filters += '&fq=-id:' + id;
                    query.count = query.count - 1;
                    this.addQuery(query);
                }
            },
            isInCart: function (id) {
                return angular.isDefined(_getItems()[id]);
            },
            getItemIds: function() {
                return $.map(_getItems(), function (item) {
                    return item;
                });
            },
            fetch:function(block) {
                var query = this.getQuery(), itemIds = this.getItemIds();
                if(query || itemIds.length > 0) {
                    return cartItemsQuery.execute(query, itemIds, block);
                } else {
                    return $q.when({count:0, docs:[]});
                }
            },
            fetchQueued:function(items) {
                var query = this.getQuery(), itemIds = this.getItemIds();
                if(query || itemIds.length > 0) {
                    return cartItemsQuery.fetchQueued(query, itemIds, items);
                } else {
                    return $q.when([]);
                }
            },
            clear: function() {
                localStorageService.remove(CART_STORAGE_NAME);
                localStorageService.remove('cart-query');
                _notify({},'clear');
            },
            getItemsArray: function() {
                var itemsArray = [];

                $.map(_getItems(), function(item){
                    itemsArray.push(item);
                });

                return itemsArray;
            },
            removeByFormat: function(format) {
                var query = localStorageService.get('cart-query');
                if(query) {
                    if(angular.isUndefined(query.filters)) {
                        query.filters = '';
                    }
                    query.filters += '&fq=-format:' + format;
                    query.actualCount = false;
                    this.addQuery(query);
                }
            },
            addQuery: function(query, items) {
                if (angular.isUndefined(items)) {
                    items = _getItems();
                }
                var length = _.keys(items).length;
                if(length > 0 && query.actualCount !== true) {
                    query.count += length;
                }
                query.actualCount = true;
                localStorageService.add('cart-query', query);
                _notifyCount(query.count);
            },
            replace: function(query) {
                localStorageService.remove(CART_STORAGE_NAME);  // just clear the items
                this.addQuery(query);
            },
            getQuery: function() {
                return localStorageService.get('cart-query');
            },
            setQueryCount: function(count) {
                var query = localStorageService.get('cart-query');
                if(query) {
                    query.count = count;
                    query.actualCount = true;
                    this.addQuery(query);
                } else {
                    if(count !== this.getCount()) {  //single items are out of sync (deleted etc)
                        _syncItems();
                    }
                }
                _notifyCount(count);
            },
            hasItems: function() {
                var query = localStorageService.get('cart-query');
                var items = localStorageService.get(CART_STORAGE_NAME);
                return query || items;
            }
        };

    });
