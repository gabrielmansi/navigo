'use strict';

describe('Open Publish to Portal for ArcGIS task', function() {

    var Util = require('../../lib/util.js');
    var s2Util = require('../../lib/s2-util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:Hydrography_Lines and format:application/vnd.esri.shapefile');
        browser.get(server + '/queue?disp=default&task=publish_to_agol');
        Util.waitForSpinner();
    });

    it('should check parameters and try to publish a map service and validate error message was returned', function() {
        browser.sleep(1000);
        Util.waitForSpinner();
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(6);
        verifyDefaults(['', '', '', '', '']);
        setValues();
        taskPage.executeTask();
        browser.waitForAngular();
    });

    afterEach(function() {
        verifyStatus();
    });

    function setValues() {
        Util.waitForSpinner();
        element.all(by.css('[ng-model="param.value"]')).filter(function(ele){
            return ele.isDisplayed();
        }).then(function(filteredElement){
            filteredElement[0].clear();
            filteredElement[0].sendKeys("https://voyager.maps.arcgis.com");
            filteredElement[1].sendKeys("jason_voyager");
            filteredElement[2].sendKeys("ago4jason");
            filteredElement[3].sendKeys("HydrographyLines");
            filteredElement[4].sendKeys("Layers");
        });
    }

    function verifyDefaults(expectedValues) {
        // Verify default values are empty strings.
        var textElements = element.all(by.css('[ng-model="param.value"]'));
        for (var i = 0; i < expectedValues.length; ++i) {
            expect(textElements.get(i).getText()).toEqual(expectedValues[i]);
        }
    }

    function verifyStatus() {
        expect(browser.getCurrentUrl()).toMatch(/\/status/);
        expect(taskStatusPage.getSuccess().isPresent()).toBeTruthy();
    }
});