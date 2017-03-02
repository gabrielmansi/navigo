'use strict';

describe('Details', function() {

    var Util = require('../../lib/util.js');
    var detailsPage = require('../../pages/details-page.js');
    var searchPage = require('../../pages/search-page.js');

    var server = Util.getServer();

    var originalTimeout;
    var newTimeout = 600000;  //10 minutes

    beforeEach(function() {
        originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = newTimeout;
    });

    afterEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    it('should load details page', function() {
        browser.get(server + '/search?q=name:%5B*%20TO%20*%5D&view=card&disp=default');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var firstResult = searchPage.getFirstResult();
        var name;

        searchPage.getResultNameElement(firstResult).getInnerHtml().then(function(text) {
            name = text;

            searchPage.clickResult(firstResult);

            expect(detailsPage.getDocName().getInnerHtml()).toEqual(name);

            var thumbnailElement = detailsPage.getThumbnail();
            expect(thumbnailElement.isDisplayed()).toBeTruthy();

            var mapElement = detailsPage.getLeafletMap();
            expect(mapElement.isDisplayed()).toBeTruthy();

            var detailsButton = detailsPage.getDetailsButton();
            expect(detailsButton.isDisplayed()).toBeTruthy();
            var detailsButton_Selected = detailsPage.getDetailsButtonSelected();
            expect(detailsButton_Selected.isPresent()).toBeTruthy();

            var detailsTable = detailsPage.getDetailsTable();
            expect(detailsTable.isDisplayed()).toBeTruthy();
        });
    });


    it('should load the next result', function() {
        browser.get(server + '/search?q=name:%5B*%20TO%20*%5D&view=card&disp=default');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(1);

        var resultList = searchPage.getResults();
        var firstResult = resultList.get(0);
        var secondResult = resultList.get(1);
        var name;

        searchPage.getResultNameElement(secondResult).getInnerHtml().then(function(text) {
            name = text;

            searchPage.clickResult(firstResult);

            detailsPage.gotoNextResult();

            expect(detailsPage.getDocName().getInnerHtml()).toEqual(name);
        });
    });


    it('should load the previous result', function() {
        browser.get(server + '/search?q=name:%5B*%20TO%20*%5D&view=card&disp=default');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(1);

        var resultList = searchPage.getResults();
        var firstResult = resultList.get(0);
        var secondResult = resultList.get(1);
        var name;

        searchPage.getResultNameElement(firstResult).getInnerHtml().then(function(text) {
            name = text;

            searchPage.clickResult(secondResult);

            detailsPage.gotoPreviousResult();

            Util.waitForSpinner();
            expect(detailsPage.getDocName().getInnerHtml()).toEqual(name);
        });
    });


    it('should load recently viewed results', function() {
        browser.get(server + '/search?q=name:%5B*%20TO%20*%5D&view=card&disp=default');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(2);

        var resultList = searchPage.getResults();
        var firstResult = resultList.get(0);
        var firstName;

        searchPage.getResultNameElement(firstResult).getInnerHtml().then(function(firstText) {
            firstName = firstText;

            var secondResult = resultList.get(1);
            var secondName;

            searchPage.getResultNameElement(secondResult).getInnerHtml().then(function(secondText) {
                secondName = secondText;

                searchPage.clickResult(firstResult);

                detailsPage.gotoNextResult();

                detailsPage.gotoNextResult();

                detailsPage.gotoRecentlyViewed(0);

                expect(detailsPage.getDocName().getInnerHtml()).toEqual(firstName);

                detailsPage.gotoRecentlyViewed(1);

                expect(detailsPage.getDocName().getInnerHtml()).toEqual(secondName);
            });
        });
    });


    it('should show metadata', function() {
        browser.get(server + '/search?view=card&disp=default&fq=properties:hasMetadata');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var metadataButton = detailsPage.getMetadataButton();
        expect(metadataButton.isPresent()).toBeTruthy();

        var metadataButton_Selected = detailsPage.getMetadataButtonSelected();
        var metadataTable = detailsPage.getMetadataTable();

        expect(metadataButton_Selected.isPresent()).toBeFalsy();
        expect(metadataTable.isDisplayed()).toBeFalsy();
        Util.patientClick(metadataButton, 3, 100);
        expect(metadataButton_Selected.isPresent()).toBeTruthy();
        expect(metadataTable.isDisplayed()).toBeTruthy();

        var detailsButton = detailsPage.getDetailsButton();
        expect(detailsButton.isDisplayed()).toBeTruthy();
        var detailsButton_Selected = detailsPage.getDetailsButtonSelected();
        expect(detailsButton_Selected.isPresent()).toBeFalsy();

        var detailsTable = detailsPage.getDetailsTable();
        expect(detailsTable.isDisplayed()).toBeFalsy();

        Util.patientClick(detailsButton, 3, 100);
        expect(metadataButton_Selected.isPresent()).toBeFalsy();
        expect(metadataTable.isDisplayed()).toBeFalsy();
        expect(detailsButton_Selected.isPresent()).toBeTruthy();
        expect(detailsTable.isDisplayed()).toBeTruthy();
    });


    it('should show relationships', function() {
        browser.get(server + '/search?disp=default&fq=linkcount__children:1&view=card');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var detailsButton = detailsPage.getDetailsButton();
        expect(detailsButton.isPresent()).toBeTruthy();

        var detailsTable = detailsPage.getDetailsTable();
        expect(detailsTable.isDisplayed()).toBeTruthy();

        var relationshipButton = detailsPage.getRelationshipsButton();
        expect(relationshipButton.isPresent()).toBeTruthy();

        var detailsButton_Selected = detailsPage.getDetailsButtonSelected();
        var relationshipButton_Selected = detailsPage.getRelationshipsButtonSelected();
        var relationshipTableData = detailsPage.getRelationshipTable();

        expect(relationshipButton_Selected.isPresent()).toBeFalsy();
        var relationshipTableData_Displayed = relationshipTableData.reduce(function(acc, relationshipTable) {
            return relationshipTable.isDisplayed().then(function(disp) {
                return acc && disp;
            });
        }, true);
        expect(relationshipTableData_Displayed).toBeFalsy();

        Util.patientClick(relationshipButton, 3, 100);

        expect(relationshipButton_Selected.isPresent()).toBeTruthy();
        relationshipTableData_Displayed = relationshipTableData.reduce(function(acc, relationshipTable) {
            return relationshipTable.isDisplayed().then(function(disp) {
                return acc && disp;
            });
        }, true);
        expect(relationshipTableData_Displayed).toBeTruthy();

        expect(detailsButton.isDisplayed()).toBeTruthy();
        expect(detailsButton_Selected.isPresent()).toBeFalsy();
        expect(detailsTable.isDisplayed()).toBeFalsy();

        Util.patientClick(detailsButton, 3, 100);

        expect(relationshipButton_Selected.isPresent()).toBeFalsy();
        relationshipTableData_Displayed = relationshipTableData.reduce(function(acc, relationshipTable) {
            return relationshipTable.isDisplayed().then(function(disp) {
                return acc && disp;
            });
        }, true);
        expect(relationshipTableData_Displayed).toBeFalsy();

        expect(detailsButton_Selected.isPresent()).toBeTruthy();
        expect(detailsTable.isDisplayed()).toBeTruthy();
    });


    it('should show schema', function() {
        browser.get(server + '/search?disp=default&fq=format:schema&view=card');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var schemaButton = detailsPage.getSchemaButton();
        expect(schemaButton.isPresent()).toBeTruthy();

        var schemaButton_Selected = detailsPage.getSchemaButtonSelected();
        var schemaTable = detailsPage.getSchemaTable();

        expect(schemaButton_Selected.isPresent()).toBeFalsy();
        expect(schemaTable.isDisplayed()).toBeFalsy();
        Util.patientClick(schemaButton, 3, 100);

        expect(schemaButton_Selected.isPresent()).toBeTruthy();
        expect(schemaTable.isDisplayed()).toBeTruthy();

        var detailsButton = detailsPage.getDetailsButton();
        expect(detailsButton.isDisplayed()).toBeTruthy();
        var detailsButton_Selected = detailsPage.getDetailsButtonSelected();
        expect(detailsButton_Selected.isPresent()).toBeFalsy();

        var detailsTable = detailsPage.getDetailsTable();
        expect(detailsTable.isDisplayed()).toBeFalsy();

        Util.patientClick(detailsButton, 3, 100);
        expect(schemaButton_Selected.isPresent()).toBeFalsy();
        expect(schemaTable.isDisplayed()).toBeFalsy();
        expect(detailsButton_Selected.isPresent()).toBeTruthy();
        expect(detailsTable.isDisplayed()).toBeTruthy();
    });


    it('should add to cart and remove from cart', function() {
        browser.get(server + '/search?view=card&disp=default&fq=format_type:File');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var addToCartButton = detailsPage.getAddToCartButton();
        detailsPage.getCartTotal().then(function(data){
            var originalCartTotal = data;
            Util.patientClick(addToCartButton, 3, 100);

            detailsPage.getCartTotal().then(function(data) {
                expect(parseInt(originalCartTotal) + 1).toEqual(parseInt(data));

                var removeFromCartButton = detailsPage.getRemoveFromCartButton();
                Util.patientClick(removeFromCartButton, 3, 100);

                detailsPage.getCartTotal().then(function(data) {
                   expect(data).toEqual(originalCartTotal) ;
                });
            });
        });
    });


    it('should open the tools menu and then open the path', function() {
        browser.get(server + '/search?fq=format:application%5C%2Fvnd.ogc.wms_layer_xml&view=card&disp=default');
        Util.waitForSpinner();

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var toolsButton = detailsPage.getToolsButton();
        Util.waitForElement(toolsButton);

        var openButton = detailsPage.getOpenToolButton();
        $('a.flyout_trigger span.icon-tools').click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(openButton), 10000);
        openButton.click().then(function() {

            browser.getAllWindowHandles().then(function (handles) {
                var newWindowHandle = handles[1];
                browser.switchTo().window(newWindowHandle).then(function () {
                    expect(browser.getWindowHandle()).toBe(handles[1]);
                }).then(function() {
                    browser.close();
                }).then(function() {
                    browser.switchTo().window(handles[0]).then(function () {
                        expect(browser.getWindowHandle()).toBe(handles[0]);
                    });
                });

            });

        });
    });


    it('should add and remove flags', function() {
        browser.get(server + '/search?fq=format:application%2Fvnd.esri.service.layer.record&view=card&disp=default');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var toolsButton = detailsPage.getToolsButton();
        Util.waitForElement(toolsButton);

        var flag = detailsPage.getFlag('protractor');
        expect(flag.isPresent()).toBe(false);

        var flagButton = detailsPage.getFlagToolButton();
        Util.patientClick($('a.flyout_trigger span.icon-tools'),3,100);
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(flagButton), 10000);
        detailsPage.addFlag('protractor');

        expect(flag.isPresent()).toBe(true);

        var removeFlagButton = detailsPage.getRemoveFlagToolButton();
        Util.patientClick($('a.flyout_trigger span.icon-tools'),3,100);
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(removeFlagButton), 10000);
        detailsPage.removeFlag();

        expect(flag.isPresent()).toBe(false);
    });

    it('should attempt to put a flag greater than 25 characters', function() {
        browser.get(server + '/search?fq=format:application%2Fvnd.esri.service.layer.record&view=card&disp=default');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var toolsButton = detailsPage.getToolsButton();
        Util.waitForElement(toolsButton);

        var flag = detailsPage.getFlag('protractor');
        expect(flag.isPresent()).toBe(false);

        var flagButton = detailsPage.getFlagToolButton();
        Util.patientClick($('a.flyout_trigger span.icon-tools'), 3, 100);

        Util.patientClick(flagButton, 3, 100);
        Util.waitForSpinner();

        var flagInput = element(by.id('flagText'));
        flagInput.sendKeys('123456789111315171921232527');

        expect(flagInput.getAttribute('value')).toBe('1234567891113151719212325');
    });

    it('should attempt to put a flag then cancel the process via the cancel button', function() {
        browser.get(server + '/search?fq=format:application%2Fvnd.esri.service.layer.record&view=card&disp=default');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var toolsButton = detailsPage.getToolsButton();
        Util.waitForElement(toolsButton);

        var flagButton = detailsPage.getFlagToolButton();
        Util.patientClick($('a.flyout_trigger span.icon-tools'), 3, 100);

        Util.patientClick(flagButton, 3, 100);
        Util.waitForSpinner();

        var cancelFlag = detailsPage.getCancelButton();
        Util.patientClick(cancelFlag, 3, 100);

        var flagDialog = detailsPage.getFlagDialog();

        expect(browser.isElementPresent(flagDialog)).toBeFalsy();
    });

    it('should attempt to put a flag then cancel the process via the esc key', function() {
        browser.get(server + '/search?fq=format:application%2Fvnd.esri.service.layer.record&view=card&disp=default');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var toolsButton = detailsPage.getToolsButton();
        Util.waitForElement(toolsButton);

        var flagButton = detailsPage.getFlagToolButton();
        Util.patientClick($('a.flyout_trigger span.icon-tools'), 3, 100);

        Util.patientClick(flagButton, 3, 100);
        Util.waitForSpinner();

        Util.sendEscape();

        var flagDialog = detailsPage.getFlagDialog();

        expect(browser.isElementPresent(flagDialog)).toBeFalsy();
    });

    it('should edit fields', function() {

        var mock = function() {
            config.editAll = true;
        };
        browser.addMockModule('portalApp', mock);

        browser.get(server + '/search?view=card&disp=default');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var descriptionRow = detailsPage.getDetailsTableRow('Description');

        var testDescription = 'Protractor Description';

        descriptionRow.editLink.click().then(function() {
            descriptionRow.input.clear();
            descriptionRow.saveButton.click().then(function() {
                expect(descriptionRow.value.getText()).toEqual('');
                descriptionRow.editLink.click().then(function() {
                    descriptionRow.input.sendKeys(testDescription);
                    descriptionRow.saveButton.click().then(function() {
                        expect(descriptionRow.value.getText()).toEqual(testDescription);
                        descriptionRow.editLink.click().then(function() {
                            descriptionRow.input.clear();
                            descriptionRow.saveButton.click().then(function() {
                                expect(descriptionRow.value.getText()).toEqual('');
                            });
                        });
                    });
                });
            });
        });
    });

    it('should go to the first search result then go back to all search results', function() {

        var mock = function() {
            config.editAll = true;
        };
        browser.addMockModule('portalApp', mock);

        browser.get(server + '/search?view=card&disp=default');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var returnToSearch = detailsPage.getReturnToSearchButton();
        Util.patientClick(returnToSearch, 3, 100);

        expect(browser.getCurrentUrl()).toContain('/search');
    });

    it('should click the format in the subtitle', function() {

        var mock = function() {
            config.editAll = true;
        };
        browser.addMockModule('portalApp', mock);

        browser.get(server + '/search?view=card&disp=default&fq=format:application%2Fvnd.esri.shapefile');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');

        var totalAnchor = searchPage.getTotalLink();

        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var formatSubtitle = detailsPage.getFormatSubtitle();
        
        Util.patientClick(formatSubtitle, 3, 100);

        expect(browser.getCurrentUrl()).toContain('shapefile');
    });

    it('should add a tag to the item then remove it', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');
        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var toggleTagButton = detailsPage.getAddTagButton();
        Util.waitForElement(toggleTagButton);
        Util.patientClick(toggleTagButton, 3, 100);

        var tagInput = detailsPage.getTagInputField();
        Util.patientClick(tagInput, 3, 100);
        Util.sendKeys('TestTag');
        Util.sendEnter();

        
        var tags = detailsPage.getTags();
        expect(tags.count()).toBeGreaterThan(0);

        tags.each(function(tag){
            var close = tag.element(by.css('.select2-search-choice-close'));
            Util.patientClick(close, 3, 100);
        });
        
        expect(tags.count()).toBe(0);

        Util.patientClick(toggleTagButton, 3, 100);
        var fieldHiddenState = detailsPage.getTagHiddenState();
        expect(fieldHiddenState.getAttribute('aria-hidden')).toBeTruthy();
    });

    it('should add multiple tags to the item then remove it', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');
        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var toggleTagButton = detailsPage.getAddTagButton();
        Util.waitForElement(toggleTagButton);
        Util.patientClick(toggleTagButton, 3, 100);

        var tagInput = detailsPage.getTagInputField();
        Util.patientClick(tagInput, 3, 100);
        Util.sendKeys('First');
        Util.sendEnter();
        Util.waitForSpinner();
        Util.sendKeys('Second');
        Util.sendEnter();

        
        var tags = detailsPage.getTags();
        expect(tags.count()).toBeGreaterThan(0);

        var removeSecond = tags.get(1).element(by.css('.select2-search-choice-close'));
        var removeFirst = tags.get(0).element(by.css('.select2-search-choice-close'));

        Util.waitForSpinner();
        Util.patientClick(removeSecond, 3, 500);
        Util.patientClick(removeFirst, 3, 500);
        Util.waitForSpinner();
        
        expect(tags.count()).toBe(0);

        Util.patientClick(toggleTagButton, 3, 100);
        var fieldHiddenState = detailsPage.getTagHiddenState();
        expect(fieldHiddenState.getAttribute('aria-hidden')).toBeTruthy();
    });


    it('should add a tag to the item then search by clicking it', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');
        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var firstURL = browser.getCurrentUrl();

        var toggleTagButton = detailsPage.getAddTagButton();
        Util.waitForElement(toggleTagButton);
        Util.patientClick(toggleTagButton, 3, 100);

        var tagInput = detailsPage.getTagInputField();
        Util.patientClick(tagInput, 3, 100);
        Util.sendKeys('SearchByTag');
        Util.sendEnter();
        
        var tags = detailsPage.getTags();
        expect(tags.count()).toBeGreaterThan(0);

        browser.driver.navigate().refresh();
        Util.waitForSpinner();

        var label = detailsPage.getTagsFinished();
        Util.patientClick(label, 3, 100);

        expect(browser.getCurrentUrl()).toContain('/search');

        var firstResult2 = resultList.first();
        searchPage.clickResult(firstResult2);

        expect(browser.getCurrentUrl()).toContain(firstURL);

        var editTag = detailsPage.getTagEditButton();
        Util.patientClick(editTag, 3, 100);

        tags.each(function(tag){
            var close = tag.element(by.css('.select2-search-choice-close'));
            Util.patientClick(close, 3, 100);
        });
        expect(tags.count()).toBe(0);
    });


    it('should test autocompleting tags and editing existing tags', function() {
        browser.get(server + '/search');
        Util.waitForSpinner();

        Util.loginToVoyager('admin', 'admin');
        expect(searchPage.getTotalValue()).toBeGreaterThan(0);

        var resultList = searchPage.getResults();
        var firstResult = resultList.first();
        searchPage.clickResult(firstResult);

        var toggleTagButton = detailsPage.getAddTagButton();
        Util.waitForElement(toggleTagButton);
        Util.patientClick(toggleTagButton, 3, 100);

        var tagInput = detailsPage.getTagInputField();
        Util.patientClick(tagInput, 3, 100);
        Util.sendKeys('Test1');
        Util.sendEnter();
        
        var tags = detailsPage.getTags();
        expect(tags.count()).toBeGreaterThan(0);

        detailsPage.gotoNextResult();

        var toggleTagButton2 = detailsPage.getAddTagButton();
        Util.waitForElement(toggleTagButton2);
        Util.patientClick(toggleTagButton2, 3, 100);

        var tagInput2 = detailsPage.getTagInputField();
        Util.patientClick(tagInput2, 3, 100);
        Util.sendKeys('T');

        var suggestion = detailsPage.getTagSuggestions().get(0);
        expect(browser.isElementPresent(suggestion)).toBeTruthy();

        Util.sendEscape();
        var previous = detailsPage.getPreviousButton();
        Util.patientClick(previous, 3, 100);

        var editTag = detailsPage.getTagEditButton();
        Util.patientClick(editTag, 3, 100);

        tags.each(function(tag){
            var close = tag.element(by.css('.select2-search-choice-close'));
            Util.patientClick(close, 3, 100);
        });
        expect(tags.count()).toBe(0);
    }); 

    

});