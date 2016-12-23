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

    it('should switch to Saved searches', function() {
        browser.get(server + '/home');
        Util.waitForSpinner();

        var savedSearchesButton = homePage.getSavedSearchesButton();
        var savedSearchesButtonParent = Util.getParent(savedSearchesButton);

        Util.waitForSpinner();
        savedSearchesButton.click();
        expect(savedSearchesButtonParent.getAttribute('class')).toEqual('selected');
    });

    it('should switch to Saved searches then back to Recent searches', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var savedSearchesButton = homePage.getSavedSearchesButton();
        var recentSearchesButton = homePage.getRecentSearchesButton();
        var recentSearchesButtonParent = Util.getParent(recentSearchesButton);

        savedSearchesButton.click();
        Util.waitForSpinner();
        recentSearchesButton.click();
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
            mostRecentSearch.click();

            expect(browser.getCurrentUrl()).toContain('testSearch');

        });

    it('should execute a saved search', function() {

            browser.get(server + '/home');
            Util.waitForSpinner();

            var savedSearchesButton = homePage.getSavedSearchesButton();
            var firstSavedSearch = homePage.getFirstSavedSearch();        

            savedSearchesButton.click();
            Util.waitForSpinner();
            firstSavedSearch.click();

            Util.waitForSpinner();   
            expect(browser.getCurrentUrl()).toContain('geometry_type:Raster');

        });

    it('should open details of a featured item', function() {

            browser.get(server + '/home');
            Util.waitForSpinner();

            var firstFeaturedItem = homePage.getFirstFeaturedItem();   

            Util.waitForSpinner();     
            firstFeaturedItem.click();

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
            showAllButton.click();

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
            placefinderSuggestion.click();

            expect(browser.getCurrentUrl()).toContain('place=Australia');

        });

    

    it('should switch the search type from within to intersects', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var searchTypeButton = homePage.getSearchTypeButton();    
        var intersectsOption = homePage.getIntersectsOption();

        searchTypeButton.click();
        intersectsOption.click();
        
        expect(searchTypeButton.getText()).toEqual('Intersects');

    });

    it('should switch the search type from within to intersects and back', function() {

        browser.get(server + '/home');
        Util.waitForSpinner();

        var searchTypeButton = homePage.getSearchTypeButton();    
        var intersectsOption = homePage.getIntersectsOption();
        var withinOption = homePage.getWithinSecondaryOption();

        searchTypeButton.click();
        intersectsOption.click();
        Util.waitForSpinner();
        searchTypeButton.click();
        withinOption.click();
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

        addToCart.click();

        expect(cartCount.getText()).toEqual('1');

    });

});