'use strict';

describe('Search', function() {

    var Util = require('../../lib/util.js');
    var searchPage = require('../../pages/search-page.js');
    var detailsPage = require('../../pages/details-page.js');

    var server = Util.getServer();

//    browser.manage().window().setSize(1280, 1024);

    it('should load search page', function() {
        browser.get(server + '/search');

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = element.all(by.repeater('doc in results'));
        expect(resultList.count()).toEqual(48);

        expect(totalAnchor.getAttribute('href')).not.toBeNull();
        expect($('#filterContainer').isDisplayed()).toBeFalsy();
        expect(element(by.css('.leaflet-map-pane')).isPresent()).toBeTruthy();
    });

    it('should go back to the home page', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var homeButton = searchPage.getHomeButton();    

        Util.patientClick(homeButton, 3, 100);

        expect(browser.getCurrentUrl()).toContain('home');

    });

    /* Start Search Bar Tests*/

    it('should search for Australia in the Placefinder', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var placefinderInput = searchPage.getPlacefinderInput();    
        var placeString = 'Australia';

        placefinderInput.sendKeys(placeString);
        Util.sendEnter();

        expect(browser.getCurrentUrl()).toContain('place=Australia');

    });

    it('should execute a keyword search', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = 'water';
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('water');

    });

    it('should execute a search via enter key', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        
        searchInput.sendKeys('test');
        Util.sendEnter();

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('q=test');

    });

    it('should execute a search via the search button', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchButton = searchPage.getSearchButton();
        var searchInput = searchPage.getSearchInput();
        searchInput.sendKeys('test');
        searchButton.each(function(button){
            Util.patientClick(button, 3, 100);
        });

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('q=test');

    });

    it('should select a suggestion in the Placefinder bar', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var placefinderInput = searchPage.getPlacefinderInput();    
        var placeString = 'Austra';
        var placefinderSuggestion = searchPage.getFirstPlaceSuggestion();  

        placefinderInput.sendKeys(placeString);
        Util.patientClick(placefinderSuggestion, 3, 100);

        expect(browser.getCurrentUrl()).toContain('place=Australia');

    });

    it('should switch the search type from within to intersects', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchTypeButton = searchPage.getSearchTypeButton();    
        var intersectsOption = searchPage.getIntersectsOption();

        Util.patientClick(searchTypeButton, 3, 100);
        Util.patientClick(intersectsOption, 3, 100);
        
        expect(searchTypeButton.getText()).toEqual('Intersects');

    });

    it('should switch the search type from within to intersects and back', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchTypeButton = searchPage.getSearchTypeButton();    
        var intersectsOption = searchPage.getIntersectsOption();
        var withinOption = searchPage.getWithinSecondaryOption();

        Util.patientClick(searchTypeButton, 3, 100);
        Util.patientClick(intersectsOption, 3, 100);

        Util.waitForSpinner();

        Util.patientClick(searchTypeButton, 3, 100);
        Util.patientClick(withinOption, 3, 100);

        Util.waitForSpinner();

        expect(searchTypeButton.getText()).toEqual('Within');

    });

    it('should clear the placefinder field', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var placefinderInput = searchPage.getPlacefinderInput();   
        var placefinderString = '(╯°□°)╯︵ ┻━┻';

        placefinderInput.sendKeys(placefinderString);

        var placefinderClearButton = searchPage.getPlacefinderClearButton(); 

        browser.executeScript('arguments[0].click()', placefinderClearButton.getWebElement());

        expect(placefinderInput.getAttribute('value')).toEqual('');

    });

    it('should clear the keyword field', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var keywordInput = searchPage.getSearchInput();   
        var placefinderString = '(╯°□°)╯︵ ┻━┻';

        keywordInput.sendKeys(placefinderString);

        var keywordClearButton = searchPage.getKeywordClearButton(); 

        browser.executeScript('arguments[0].click()', keywordClearButton.getWebElement());

        expect(keywordInput.getAttribute('value')).toEqual('');

    });

    /* End Search Bar Tests */

    /* Start Filter Tests */

    it('should load search page with filter', function() {
        browser.get(server + '/search?disp=default&fq=format_type:File');

        var selectedFilters = element.all(by.repeater('selected in filters'));
        expect(selectedFilters.count()).toEqual(1);

    });

    it('should show filters', function() {
        browser.get(server + '/search');

        var showFilters = searchPage.getOpenFiltersMenuButton();  

        Util.patientClick(showFilters, 3, 100);

        expect($('#filterContainer').isDisplayed()).toBeTruthy();

    });

    it('should show then hide filters', function() {
        browser.get(server + '/search');

        var showFilters = searchPage.getOpenFiltersMenuButton();  
        var hideFilters = searchPage.getHideFiltersMenuButton(); 

        Util.patientClick(showFilters, 3, 100);
        Util.patientClick(hideFilters, 3, 100);

        expect($('#filterContainer').isDisplayed()).toBeFalsy();

    });


    it('should show facets and select facet', function() {
        browser.get(server + '/search');

        Util.waitForSpinner();

        var startTotal = 0;

        var total = searchPage.getTotalValue().then(function(val) {
            startTotal = val;
            return val;
        });

        expect(total).toBeGreaterThan(0);

        Util.patientClick(element(by.css('.icon-filters')),3,100);

        var filters = element.all(by.repeater('filter in filters'));

        var filter = filters.first().element(by.tagName('a'));
        Util.patientClick(filter,3,100);

        filter.getAttribute('href').then(function(href) {
            var id = href.substring(href.indexOf('#'));  //href contains the id of the facets panel
            expect($(id).isDisplayed()).toBeTruthy();
        });

        var facets = element.all(by.repeater('facet in filter.values'));

        var checkFacet = facets.first().element(by.tagName('input'));  //assumes check box style for first filter
        checkFacet.isPresent().then(function(present) {
            if(present) {Util.patientClick(checkFacet,3,100);}
        });

        Util.waitForSpinner();

        var linkFacet = facets.first().element(by.tagName('a'));  //assumes check box style for first filter
        linkFacet.isPresent().then(function(present) {
            if(present) {
                browser.executeScript('window.scrollTo(0,0);'); // if filters have lots of items it will scroll down so scroll back up
                Util.patientClick(linkFacet,3,100);
            }
        });

        var selectedFilters = element.all(by.repeater('selected in filters'));
        expect(selectedFilters.count()).toEqual(1);

        //check that the total is lower after applying filter
        searchPage.getTotalValue().then(function(val) {
            expect(val < startTotal).toBeTruthy();
        });

    });

    it('should show facets and then hide them', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        expect($('#filterContainer').isDisplayed()).toBeTruthy();
        
        var filterCategory = searchPage.getFilterCategory(0)
                                        .element(by.css('.panel-heading'))
                                        .element(by.css('.panel-title'))
                                        .element(by.css('[ng-click="toggleDisplayState(filter)"]'));
        Util.patientClick(filterCategory, 3, 100);

        expect(filterCategory.getAttribute('aria-expanded')).toBeTruthy();

        Util.waitForSpinner();
        browser.waitForAngular();
        Util.patientClick(filterCategory, 3, 100);

        expect(filterCategory.getAttribute('aria-expanded')).toBe('false');
    });

    it('should open facet list dialog', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var showAllFilters = searchPage.getShowAllFiltersButton();
        Util.patientClick(showAllFilters, 3, 100);

        var showAllFiltersDialog = searchPage.getShowAllFiltersDialog();

        expect(showAllFiltersDialog.isPresent()).toBeTruthy();
    });

    it('should open then close the facet list dialog', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var showAllFilters = searchPage.getShowAllFiltersButton();
        Util.patientClick(showAllFilters, 3, 100);

        var showAllFiltersDialog = searchPage.getShowAllFiltersDialog();
        var closeFiltersDialog = searchPage.getCloseFiltersDialog();

        Util.patientClick(closeFiltersDialog, 3, 100);


        expect(showAllFiltersDialog.isPresent()).toBeFalsy();
    });

    it('should open then select an option from the facets list', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var showAllFilters = searchPage.getShowAllFiltersButton();
        Util.patientClick(showAllFilters, 3, 100);

        var filterInFiltersList = searchPage.getFirstFilterInFiltersList();
        Util.patientClick(filterInFiltersList, 3, 100);

        expect(browser.getCurrentUrl()).toContain('&fq=');
    });

    it('should apply multiple select facets', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var formatCategory = searchPage.getFilterCategory(1);
        var typeCategory = searchPage.getFilterCategory(2);
        Util.patientClick(formatCategory, 3, 100);
        Util.waitForSpinner();
        Util.patientClick(typeCategory, 3, 200);
        Util.waitForSpinner();
        
        var firstFormatFilter = searchPage.getFacetInCategory(formatCategory, 0);
        
        var firstTypeFilter = searchPage.getFacetInCategory(typeCategory, 0);


        Util.patientClick(firstFormatFilter, 3, 100);
       
        
        Util.patientClick(firstTypeFilter, 3, 200);
        expect(browser.getCurrentUrl()).toContain('fq=format:application%5C%2Fvnd.esri.featureclass.feature&fq=format_type:Feature');
    });

    it('should apply multiple checkbox facets', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var formatCategory = searchPage.getFilterCategory(0);
        Util.patientClick(formatCategory, 3, 100);
        Util.waitForSpinner();
        
        var firstCategoryFilter = searchPage.getFacetInCategory(formatCategory, 0).element(by.css('[ng-click="filterResults(facet)"]'));
        var secondCategoryFilter = searchPage.getFacetInCategory(formatCategory, 1).element(by.css('[ng-click="filterResults(facet)"]'));

        Util.patientClick(firstCategoryFilter, 3, 100); 
        Util.patientClick(secondCategoryFilter, 3, 200);
        expect(browser.getCurrentUrl()).toContain('fq=format_category:GIS&fq=format_category:Office');
    });

    it('should check the item counts in the facets dialog', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var showAllFilters = searchPage.getShowAllFiltersButton();
        Util.patientClick(showAllFilters, 3, 100);

        var filterCount = searchPage.getFirstCountInFiltersList().getText();

        expect(filterCount).toBeGreaterThan('0');
    });

    it('should select a facet and then remove it by clicking it again', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var checkBoxFacet = searchPage.getCheckboxFacet();
        Util.patientClick(checkBoxFacet, 3, 100);
        
        expect(browser.getCurrentUrl()).toContain('&fq=');

        Util.patientClick(checkBoxFacet, 3, 100);
        
        expect(browser.getCurrentUrl()).not.toContain('&fq=');
    });

    it('should check the item counts in the facets list', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var checkBoxFacetText = searchPage.getCheckboxFacet().getText().then(function(text){
            var textLength = text.length;
            return text.substring(1,textLength - 1);
            
        });
        
        expect(checkBoxFacetText).toBeGreaterThan(0);
    });

    it('should select a facet and then remove it by clicking the clear all filters option', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var checkBoxFacet = searchPage.getCheckboxFacet();
        Util.patientClick(checkBoxFacet, 3, 100);
        
        expect(browser.getCurrentUrl()).toContain('&fq=');

        var filtersDropdown = searchPage.getFiltersDropdown();

        var clearAllFilters = searchPage.getClearAllFilters();

        browser.actions()
            .mouseMove(filtersDropdown).click()
            .mouseMove(clearAllFilters).click()
            .perform();
        
        expect(browser.getCurrentUrl()).not.toContain('&fq=');
    });

    it('should select a facet and then remove it by clicking the x on the facet label', function() {
        browser.get(server + '/search');

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var checkBoxFacet = searchPage.getCheckboxFacet();
        Util.patientClick(checkBoxFacet, 3, 100);
        
        expect(browser.getCurrentUrl()).toContain('&fq=');

        var removeFacet = searchPage.getRemoveFacetButton();
        Util.patientClick(removeFacet, 3, 100);
        
        expect(browser.getCurrentUrl()).not.toContain('&fq=');
    });

    /* End Filter Tests */
    /* Start Sorting Tests */

    it('should toggle the sorting between descending and ascending', function() {
        browser.get(server + '/search');

        var sortButton = searchPage.getSortButton();
        var ascendingOption = searchPage.getSortAscendingButton();
        var descendingOption = searchPage.getSortDescendingButton();

        Util.waitForSpinner();

        browser.actions()
            .mouseMove(sortButton).click()
            .mouseMove(ascendingOption).click()
            .perform();

        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('sortdir=asc');

        Util.waitForSpinner();

        browser.actions()
            .mouseMove(sortButton).click()
            .mouseMove(descendingOption).click()
            .perform();

        Util.waitForSpinner();
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('sortdir=desc');
    });

    it('should sort by Name then by Relevance', function() {
        browser.get(server + '/search');

        var sortButton = searchPage.getSortButton();
        var nameOption = searchPage.getSortNameButton();
        var relevanceOption = searchPage.getSortRelevanceButton();

        Util.waitForSpinner();

        browser.actions()
            .mouseMove(sortButton).click()
            .mouseMove(nameOption).click()
            .perform();

        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('sort=name');

        browser.actions()
            .mouseMove(sortButton).click()
            .mouseMove(relevanceOption).click()
            .perform();

        Util.waitForSpinner();
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('sort=score');
    });

    it('should sort by Modified', function() {
        browser.get(server + '/search');

        var sortButton = searchPage.getSortButton();
        var modifiedOption = searchPage.getSortModifiedButton();

        Util.waitForSpinner();

        browser.actions()
            .mouseMove(sortButton).click()
            .mouseMove(modifiedOption).click()
            .perform();

        Util.waitForSpinner();
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('sort=modified');
    });

    it('should sort by file size', function() {
        browser.get(server + '/search');

        var sortButton = searchPage.getSortButton();
        var fileSizeOption = searchPage.getSortFileSizeButton();

        Util.waitForSpinner();

        browser.actions()
            .mouseMove(sortButton).click()
            .mouseMove(fileSizeOption).click()
            .perform();

        Util.waitForSpinner();
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('sort=bytes');
    });

    it('should sort by path', function() {
        browser.get(server + '/search');

        var sortButton = searchPage.getSortButton();
        var pathOption = searchPage.getSortPathButton();

        Util.waitForSpinner();

        browser.actions()
            .mouseMove(sortButton).click()
            .mouseMove(pathOption).click()
            .perform();
        
        Util.waitForSpinner();
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('sort=path');
    });

    it('should sort by Name Ascending in Table View then sort by name descending', function() {
        browser.get(server + '/search?disp=ace4bb77&view=table');

        var nameSort = searchPage.getSortTableNameButton();

        Util.waitForSpinner();
        Util.patientClick(nameSort, 3, 100);
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('view=table&sort=name&sortdir=asc');

        Util.patientClick(nameSort, 3, 100);
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('view=table&sort=name&sortdir=desc');
    });

    it('should sort by Format Ascending in Table View then sort by Format descending', function() {
        browser.get(server + '/search?disp=ace4bb77&view=table');

        var formatSort = searchPage.getSortTableFormatButton();

        Util.waitForSpinner();
        Util.patientClick(formatSort, 3, 100);
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('view=table&sort=format&sortdir=asc');

        Util.patientClick(formatSort, 3, 100);
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('view=table&sort=format&sortdir=desc');
    });

    it('should sort by File Size Ascending in Table View then sort by File Size descending', function() {
        browser.get(server + '/search?disp=ace4bb77&view=table');

        var fileSizeSort = searchPage.getSortTableFileSizeButton();

        Util.waitForSpinner();
        Util.patientClick(fileSizeSort, 3, 100);
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('view=table&sort=bytes&sortdir=asc');

        Util.patientClick(fileSizeSort, 3, 100);
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('view=table&sort=bytes&sortdir=desc');
    });

    it('should sort by Modified Ascending in Table View then sort by Modified descending', function() {
        browser.get(server + '/search?disp=ace4bb77&view=table');

        var fileSizeSort = searchPage.getSortTableModifiedButton();

        Util.waitForSpinner();
        Util.patientClick(fileSizeSort, 3, 100);
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('view=table&sort=modified&sortdir=asc');

        Util.patientClick(fileSizeSort, 3, 100);
        browser.sleep(1000);
        expect(browser.getCurrentUrl()).toContain('view=table&sort=modified&sortdir=desc');
    });

    it('should hide then show thumbnails in Table View', function() {
        browser.get(server + '/search?disp=ace4bb77&view=table');

        var imageDropdown = searchPage.getTableViewImageOptions();
        var toggleDropdownOption = searchPage.getTableViewToggleThumbnailsOption();

        Util.waitForSpinner();
        browser.actions()
            .mouseMove(imageDropdown).click()
            .mouseMove(toggleDropdownOption).click()
            .perform();

        Util.waitForSpinner();
        browser.sleep(200);
        
        Util.patientClick((searchPage.getTableViewItemThumbnail()), 3, 100);

        Util.waitForSpinner();

        browser.sleep(1000);

        expect((searchPage.getTableViewHiddenItemThumbnail()).getAttribute('aria-hidden')).toBeTruthy();

        Util.waitForSpinner();
        browser.actions()
            .mouseMove(imageDropdown).click()
            .mouseMove(toggleDropdownOption).click()
            .perform();

        Util.waitForSpinner();
        browser.sleep(1000);
        expect((searchPage.getTableViewItemThumbnail()).getAttribute('aria-hidden')).toBeNull();
    });

    /* End Sorting Tests */
    /* Start Layout Tests */

    it('should scroll down to reveal more results in card view', function() {
        browser.get(server + '/search');

        var resultList = element.all(by.repeater('doc in results'));
        expect(resultList.count()).toBeLessThan(51);

        browser.executeScript('window.scrollTo(0,10000);');
        Util.waitForSpinner();
        expect(resultList.count()).toBeGreaterThan(51);

    });

    it('should show table view', function() {
        browser.get(server + '/search?view=table&disp=default');

        //workaround - this test times out for some reason
        browser.sleep(10000);
        browser.waitForAngular();

        var tableColumns = element.all(by.repeater('field in vm.tableFields'));
        expect(tableColumns.count()).toBeGreaterThan(0);

        var rows = element.all(by.repeater('doc in $data'));
        expect(rows.count()).toBeGreaterThan(0);

    });

    it('should show map view', function() {
        browser.get(server + '/search?view=map&disp=default');

        expect(element(by.css('.alt_list_view')).isPresent()).toBeTruthy();

        var resultList = element.all(by.repeater('doc in results'));
        expect(resultList.count()).toBeGreaterThan(0);

    });

    it('should show grid view', function() {
        browser.get(server + '/search?view=grid&disp=default');

        expect(element(by.css('[ui-view="grid-results"]')).isPresent()).toBeTruthy();

        var resultList = element.all(by.repeater('doc in results'));
        expect(resultList.count()).toBeGreaterThan(0);

    });

    it('should show the popover in grid view', function() {
        browser.get(server + '/search?view=grid&disp=default');
        Util.waitForSpinner();

        var firstResult = searchPage.getFirstResult();

        browser.actions().mouseMove(firstResult).perform().then(function(){
            var popover = searchPage.getGridViewPopover();
            expect((popover).isPresent()).toBeTruthy();
        });        

    });

    it('should click the items popover name in grid view', function() {
        browser.get(server + '/search?view=grid&disp=default');
        Util.waitForSpinner();

        var firstResult = searchPage.getFirstResult();

        browser.actions().mouseMove(firstResult).perform();

        var popover = searchPage.getGridViewPopover();
        expect((popover).isPresent()).toBeTruthy();

        var popoverTitle = searchPage.getGridViewPopoverTitle();
        Util.patientClick(popoverTitle, 3, 100);

        expect(browser.getCurrentUrl()).toContain('show?id=');
    });

    it('should click the items popover image in grid view', function() {
        browser.get(server + '/search?view=grid&disp=default');
        Util.waitForSpinner();

        var firstResult = searchPage.getFirstResult();

        browser.actions().mouseMove(firstResult).perform();

        var popover = searchPage.getGridViewPopover();
        expect((popover).isPresent()).toBeTruthy();

        var popoverImage = searchPage.getGridViewPopoverImage();
        Util.patientClick(popoverImage, 5, 200);
        
        expect(browser.getCurrentUrl()).toContain('show?id=');
    });

    it('should click the items popover format in grid view', function() {
        browser.get(server + '/search?view=grid&disp=default');
        Util.waitForSpinner();

        var firstResult = searchPage.getFirstResult();

        browser.actions().mouseMove(firstResult).perform();

        var popover = searchPage.getGridViewPopover();
        expect((popover).isPresent()).toBeTruthy();

        var popoverFormat = searchPage.getGridViewPopoverFormat();
        Util.patientClick(popoverFormat, 3, 100);
        
        expect(browser.getCurrentUrl()).toContain('fq=format:');
    });

    /*it('should click the thumbnail image in grid view', function() {
        browser.get(server + '/search?view=grid&disp=default');
        Util.waitForSpinner();
        expect(element(by.css('[ui-view="grid-results"]')).isPresent()).toBeTruthy();

        var firstResult = searchPage.getFirstResult();

        browser.actions().mouseMove(firstResult, {x:10, y:10}).click().perform();

        Util.waitForSpinner();

        expect(browser.getCurrentUrl()).toContain('show?id=');
    }); */

    /* End Layout Tests */

    /* Start Result Items Tests */

    it('should add a result item to the cart', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var addToCart = searchPage.getAddItemToCartButton();   
        var cartCount = searchPage.getCartCount();
        var cartDropdown = searchPage.getCartDropdown();
        var clearCartButton = searchPage.getClearCartButton();

        Util.patientClick(cartDropdown, 3, 100);
        Util.patientClick(clearCartButton, 3, 100);
        Util.waitForSpinner();
        Util.patientClick(addToCart, 3, 100);
        Util.waitForSpinner();
        expect(cartCount.getText()).toEqual('1');
        Util.patientClick(cartDropdown, 3, 100);
        Util.patientClick(clearCartButton, 3, 100);
        Util.waitForSpinner();
        expect(cartCount.getText()).toEqual('0');

    });

    it('should add a result item to the cart in grid view', function() {

        browser.get(server + '/search?view=grid&disp=default');
        Util.waitForSpinner();
        expect(element(by.css('[ui-view="grid-results"]')).isPresent()).toBeTruthy();
        Util.waitForSpinner();

        var addToCart = searchPage.getAddItemToCartButton();   
        var cartCount = searchPage.getCartCount();
        var cartDropdown = searchPage.getCartDropdown();
        var clearCartButton = searchPage.getClearCartButton();
        var firstResult = searchPage.getFirstResult();

        Util.patientClick(cartDropdown, 3, 100);
        Util.patientClick(clearCartButton, 3, 100);
        browser.actions().mouseMove(firstResult).perform();
        Util.patientClick(addToCart, 3, 100);
        expect(cartCount.getText()).toEqual('1');
        Util.patientClick(cartDropdown, 3, 100);
        Util.patientClick(clearCartButton, 3, 100);
        expect(cartCount.getText()).toEqual('0');
    });

    it('should open details of a featured item via the items title', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var firstFeaturedItem = searchPage.getItemTitle();   

        Util.waitForSpinner();     
        Util.patientClick(firstFeaturedItem, 3, 100);

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('show?id=');
    
    });

    it('should open details of a featured item via the items thumbnail', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var firstFeaturedItemThumbnail = searchPage.getItemThumbnail();   

        Util.waitForSpinner();     
        Util.patientClick(firstFeaturedItemThumbnail, 3, 100);

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('show?id=');
    
    });

    it('should open details, then go back to results and maintain query', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var filterPanel = searchPage.getFilterPanel();
        Util.patientClick(filterPanel, 3, 100);

        var filterCategory = searchPage.getFilterCategory(0);
        Util.patientClick(filterCategory, 3, 100);

        var checkBoxFacet = searchPage.getCheckboxFacet();
        Util.patientClick(checkBoxFacet, 3, 100);
        
        expect(browser.getCurrentUrl()).toContain('&fq=');

        var firstFeaturedItemThumbnail = searchPage.getItemThumbnail();   

        Util.waitForSpinner();     
        Util.patientClick(firstFeaturedItemThumbnail, 3, 100);

        Util.waitForSpinner();   
        expect(browser.getCurrentUrl()).toContain('show?id=');

        var returnToSearchButton = detailsPage.getReturnToSearchButton();
        Util.patientClick(returnToSearchButton, 3, 100);

        expect(browser.getCurrentUrl()).toContain('&fq=');
    });

    it('should search using the OR keyword ', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = 'format:application/pdf or format:image/tiff';
        var format1Count = 0;
        var format2Count = 0;
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();   

        expect(browser.getCurrentUrl()).toContain('format:application%2Fpdf%20or%20format:image%2Ftiff');

        var results = searchPage.getResults().then(function(){
            searchPage.getResults().map(function(elm){
                return elm.getText();
            }).then(function(texts){
                texts.forEach(function(text){
                    var format = (text.split('\n')[1]).substring(8);
                    if(format === 'PDF'){
                        format1Count++;
                    }
                    else if(format === 'TIFF'){
                        format2Count++;
                    }
                });
                expect(format1Count).toBeGreaterThan(0);
                expect(format2Count).toBeGreaterThan(0);
            });
        });
    });

    it('should test the negate query', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = '-format:application/vnd.esri.shapefile';
        var format1Count = 0;
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();   

        var results = searchPage.getResults().then(function(){
            searchPage.getResults().map(function(elm){
                return elm.getText();
            }).then(function(texts){
                texts.forEach(function(text){
                    var format = (text.split('\n')[1]).substring(8);
                    if(format === 'SHP'){
                        format1Count++;
                    }
                });
                expect(format1Count).toBe(0);
            });
        });
    });

    it('should search using the * keyword', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = 'count*';
        var format1Count = 0;
        var format2Count = 0;
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();   

        expect(browser.getCurrentUrl()).toContain('q=count*');

        var results = searchPage.getResults().then(function(){
            searchPage.getResults().map(function(elm){
                return elm.getText();
            }).then(function(texts){
                texts.forEach(function(text){
                    var format = (text.split('\n')[0]);
                    if(format.toLowerCase().includes('countries')){
                        format1Count++;
                    }
                    else if(format.toLowerCase().includes('counties')){
                        format2Count++;
                    }
                });
                expect(format1Count).toBeGreaterThan(0);
                expect(format2Count).toBeGreaterThan(0);
            });
        });
    });

    it('should search using multi-word keyword', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = 'name:"Data Set"';
        var incorrectTitle = false;
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();

        var results = searchPage.getResults().then(function(){
            searchPage.getResults().map(function(elm){
                return elm.getText();
            }).then(function(texts){
                texts.forEach(function(text){
                    var title = (text.split('\n')[0]);
                    if(!title.includes('Data Set')){
                        incorrectTitle = true;
                    }
                });
                expect(incorrectTitle).toBeFalsy();
            });
        });
    });

    it('should search using the [* TO *] query', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = 'author:[* TO *]';
        var format1Count = 0;
        var format2Count = 0;
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();   

        var results = searchPage.getResultsCount();
        expect(results).toBeGreaterThan(0);
    });

    it('should search a single wildcard query using ?', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = 'n3?';
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();   

        var results = searchPage.getResultsCount();
        expect(results).toBeGreaterThan(10);
        expect(results).toBeLessThan(50);
    });

    it('should search using escaped special characters', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = 'count*';

        searchInput.sendKeys(searchString);
        Util.sendEnter();
        Util.waitForSpinner();   

        var results = searchPage.getResultsCount();
        expect(results).toBeGreaterThan(3000);

        searchInput.clear().then(function(){
            var searchString2 = 'count\\*';
            searchInput.sendKeys(searchString2);
            Util.sendEnter();

            Util.waitForSpinner();   
            var results2 = searchPage.getResultsCount();
            expect(results2).toBeLessThan(50);
        });
    });

    it('should test the AND query', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchInput = searchPage.getSearchInput();
        var searchString = 'geometry_type:Point and format_type:File';
        
        searchInput.sendKeys(searchString);
        Util.sendEnter();

        Util.waitForSpinner();   

        var results = searchPage.getResultsCount();
        expect(results).toBeLessThan(10);
    });

    it('should search test searching WITHIN a location', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var placefinderInput = searchPage.getPlacefinderInput();    
        var placeString = 'Australia';

        placefinderInput.sendKeys(placeString);
        Util.sendEnter();

        expect(browser.getCurrentUrl()).toContain('place=Australia');
        expect(browser.getCurrentUrl()).toContain('place.op=within');

        var results = searchPage.getResultsCount();
        expect(results).toBe(5);
    });

    it('should search test searching INTERSECTS', function() {

        browser.get(server + '/search');
        Util.waitForSpinner();

        var searchTypeButton = searchPage.getSearchTypeButton();    
        var intersectsOption = searchPage.getIntersectsOption();

        Util.patientClick(searchTypeButton, 3, 100);
        Util.patientClick(intersectsOption, 3, 100);
        
        expect(searchTypeButton.getText()).toEqual('Intersects');

        var placefinderInput = searchPage.getPlacefinderInput();    
        var placeString = 'Australia';

        placefinderInput.sendKeys(placeString);
        Util.sendEnter();

        Util.waitForSpinner();
        expect(browser.getCurrentUrl()).toContain('place=Australia');
        expect(browser.getCurrentUrl()).toContain('place.op=intersects');

        var results = searchPage.getResultsCount();
        expect(results).toBe(65);
    });

    

    /* it('should search test Bulk Field Editing', function() {

        browser.get(server + '/search?disp=ace4bb77&view=card&filter=true&fq=geometry_type:Multipoint&place=Galapagos%20Islands,%20Ecuador');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');
        Util.waitForSpinner();

        var resultsButton = searchPage.getAddToQueueLink();
        var editFields = searchPage.getEditFieldButton();

        Util.waitForSpinner();
        
        browser.actions()
            .mouseMove(resultsButton).click()
            .mouseMove(editFields).click()
            .perform();
        
        var confirm = searchPage.getFlagConfirmButton();
        
        Util.patientClick(confirm, 3, 100);
        Util.waitForSpinner();

        var flag = searchPage.getFirstFlag();
        expect(flag.isPresent()).toBeFalsy();
    }); */
    
    /* End Result Items Tests */

    it('should add all to queue', function() {
        searchPage.addAllToQueue('*:*');
    });
    
});