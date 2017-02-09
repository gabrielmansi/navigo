'use strict';

describe('Home Page', function() {

    var Util = require('../../lib/util.js');
    var homePage = require('../../pages/home-page.js');
    var server = Util.getServer();

    it('should search for Australia in the Placefinder', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var placefinderInput = homePage.getPlacefinderInput();    
        var placeString = 'Australia';

        placefinderInput.sendKeys(placeString);
        Util.sendEnter();

        expect(browser.getCurrentUrl()).toContain('place=Australia');

    });

    it('should execute a keyword search', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var searchInput = homePage.getSearchInput();
        var searchString = 'water';
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('water');

    });

    it('should execute a search via enter key', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var searchInput = homePage.getSearchInput();
        
        searchInput.sendKeys('');
        Util.sendEnter();

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('/search');

    });

    it('should execute a search via the search button', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var searchButton = homePage.getSearchButton();
        searchButton.each(function(button){
            Util.patientClick(button, 3, 100);
        });

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('/search');

    });

    it('should switch to Saved searches', function() {
        browser.get(server + '/home');
        Util.waitForSpinner();

        var savedSearchesButton = homePage.getSavedSearchesButton();
        var savedSearchesButtonParent = Util.getParent(savedSearchesButton);

        Util.waitForSpinner();
        Util.patientClick(savedSearchesButton, 3, 100);
        expect(savedSearchesButtonParent.getAttribute('class')).toEqual('selected');
    });

    it('should switch to Saved searches then back to Recent searches', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var savedSearchesButton = homePage.getSavedSearchesButton();
        var recentSearchesButton = homePage.getRecentSearchesButton();
        var recentSearchesButtonParent = Util.getParent(recentSearchesButton);

        Util.patientClick(savedSearchesButton, 3, 100);
        Util.waitForSpinner();
        Util.patientClick(recentSearchesButton, 3, 100);

        expect(recentSearchesButtonParent.getAttribute('class')).toEqual('selected');

    });

    it('should execute a recent search', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var searchInput = homePage.getSearchInput();
        var searchString = 'testSearch';
        var mostRecentSearch = homePage.getMostRecentSearch();
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();
        browser.get(server + '/home');

        Util.waitForSpinner();   
        Util.patientClick(mostRecentSearch, 3, 100);

        expect(browser.getCurrentUrl()).toContain('testSearch');

    });

    it('should execute a saved search', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var savedSearchesButton = homePage.getSavedSearchesButton();
        var firstSavedSearch = homePage.getFirstSavedSearch();         
        

        Util.patientClick(savedSearchesButton, 3, 100);
        Util.waitForSpinner();
        Util.patientClick(firstSavedSearch, 3, 100);

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('geometry_type:Raster');

    });

    it('should open details of a featured item via the items title', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var firstFeaturedItem = homePage.getFirstFeaturedItem();   

        Util.waitForSpinner();     
        Util.patientClick(firstFeaturedItem, 3, 100);

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('show?id=');
    
    });

    it('should open details of a featured item via the items thumbnail', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var firstFeaturedItemThumbnail = homePage.getFeaturedItemThumbnail();   

        Util.waitForSpinner();     
        Util.patientClick(firstFeaturedItemThumbnail, 3, 100);

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('show?id=');
    
    });

    it('should press "show All" at the bottom of the featured list', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var featuredItemsCount = homePage.getFeaturedItemsCount();    
        var showAllButton = homePage.getShowAllButton();    

        expect(featuredItemsCount).toEqual(12);
        Util.waitForSpinner();
        Util.patientClick(showAllButton, 3, 100);

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('search?');

    });

    it('should select a suggestion in the Placefinder bar', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var placefinderInput = homePage.getPlacefinderInput();    
        var placeString = 'Austra';
        var placefinderSuggestion = homePage.getFirstPlaceSuggestion();  

        placefinderInput.sendKeys(placeString);
        Util.patientClick(placefinderSuggestion, 3, 100);

        expect(browser.getCurrentUrl()).toContain('place=Australia');

    });

    it('should switch the search type from within to intersects', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var searchTypeButton = homePage.getSearchTypeButton();    
        var intersectsOption = homePage.getIntersectsOption();

        Util.patientClick(searchTypeButton, 3, 100);
        Util.patientClick(intersectsOption, 3, 100);
        
        expect(searchTypeButton.getText()).toEqual('Intersects');

    });

    it('should switch the search type from within to intersects and back', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var searchTypeButton = homePage.getSearchTypeButton();    
        var intersectsOption = homePage.getIntersectsOption();
        var withinOption = homePage.getWithinSecondaryOption();

        Util.patientClick(searchTypeButton, 3, 100);
        Util.patientClick(intersectsOption, 3, 100);

        Util.waitForSpinner();

        Util.patientClick(searchTypeButton, 3, 100);
        Util.patientClick(withinOption, 3, 100);

        Util.waitForSpinner();

        expect(searchTypeButton.getText()).toEqual('Within');

    });

    it('should clear the placefinder field', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var placefinderInput = homePage.getPlacefinderInput();   
        var placefinderString = '(╯°□°)╯︵ ┻━┻';

        placefinderInput.sendKeys(placefinderString);

        var placefinderClearButton = homePage.getPlacefinderClearButton(); 

        browser.executeScript('arguments[0].click()', placefinderClearButton.getWebElement());

        expect(placefinderInput.getAttribute('value')).toEqual('');

    });

    it('should add a featured item to the cart', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var addToCart = homePage.getAddFeaturedToCartButton();   
        var cartCount = homePage.getCartCount();
        var cartDropdown = homePage.getCartDropdown();
        var clearCartButton = homePage.getClearCartButton();

        Util.patientClick(cartDropdown, 3, 100);
        Util.patientClick(clearCartButton, 3, 100);
        Util.patientClick(addToCart, 3, 100);
        expect(cartCount.getText()).toEqual('1');

    });

    it('should click a quick links option within a category',function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var mock = function() {
            config.showSidebarLinks = true;
        };
        browser.addMockModule('portalApp', mock);

        var e2eInterceptors = function() {
            return angular.module('e2eInterceptors', []).factory('quickLinksInterceptor', function() {
                return {
                    response: function(response) {
                        var requestedUrl = response.config.url;
                        if (requestedUrl.indexOf('labels') > -1) { 
                            var mockQuickLink = {
                                'id':"S159228992CD",
                                'title':"testCategoryTitle",
                                "owner":"admin",
                                "path":"/place=Michigan,United States/place.op=within/disp=ace4bb77/",
                                "labels":["Featured"],
                                "count":815,
                                "categories":["testCategoryName"],
                                "query":"facet=true&q=test"
                            };

                            response.data.response.docs.push(mockQuickLink);
                        }
                        return response;
                    }
                };
            }).config(function($httpProvider) {
                return $httpProvider.interceptors.push('quickLinksInterceptor');
            });
        };
        browser.addMockModule('e2eInterceptors',e2eInterceptors);

        Util.waitForSpinner().then(function() {
            var quickLink = homePage.getQuickLinkInCategory();
            Util.patientClick(quickLink, 3, 100);
        });

        expect(browser.getCurrentUrl()).toContain('/search?q=test');
    });

    it('should click a quick links option within a category',function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var mock = function() {
            config.showSidebarLinks = true;
        };
        browser.addMockModule('portalApp', mock);

        var e2eInterceptors = function() {
            return angular.module('e2eInterceptors', []).factory('quickLinksInterceptor', function() {
                return {
                    response: function(response) {
                        var requestedUrl = response.config.url;
                        if (requestedUrl.indexOf('labels') > -1) { 
                            var mockQuickLink = {
                                'id':"S159228992CD",
                                'title':"testCategoryTitle",
                                "owner":"admin",
                                "path":"/place=Michigan,United States/place.op=within/disp=ace4bb77/",
                                "labels":["Featured"],
                                "count":815,
                                "query":"facet=true&q=test"
                            };

                            response.data.response.docs.push(mockQuickLink);
                        }
                        return response;
                    }
                };
            }).config(function($httpProvider) {
                return $httpProvider.interceptors.push('quickLinksInterceptor');
            });
        };
        browser.addMockModule('e2eInterceptors',e2eInterceptors);

        Util.waitForSpinner().then(function() {
            var quickLink = homePage.getQuickLinkNoCategory();
            Util.patientClick(quickLink, 3, 100);
        });

        expect(browser.getCurrentUrl()).toContain('/search?q=test');
    });


});