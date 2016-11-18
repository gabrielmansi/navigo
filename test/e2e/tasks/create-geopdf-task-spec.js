'use strict';

describe('Run Create GeoPDF Task', function() {

    var Util = require('../../lib/util.js');
    var s2Util = require('../../lib/s2-util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:Hydrography_Lines and format:application/vnd.esri.shapefile');
        browser.get(server + '/queue?disp=default&task=create_geopdf');
        Util.waitForSpinner();
    });

    it('should run using default parameter values', function() {
        // Get the task parameter elements.
        browser.sleep(1000);
        Util.waitForSpinner();
        element(by.css('[ng-click="showAdvanced = !showAdvanced"]')).click();
        Util.waitForSpinner();
        element(by.css('[ng-click="defaultExtent($event)"]')).click();

        // Verify we have the correct number of params
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(7);
        verifyDefaults();
        taskPage.executeTask();
        browser.waitForAngular();
    });

    it('should run using Map Template: POWER_POINT.mxd', function() {
        browser.sleep(1000);
        Util.waitForSpinner();
        setParams(2, 'POWER_POINT.mxd');
        taskPage.executeTask();
        browser.waitForAngular();
    });

    afterEach(function() {
        verifyStatus();
    });

    function verifyDefaults() {
        // Verify default values for output map template, base map, map title and map author
        var s2Elements = taskPage.getParameterValues();
        var expectedValues = ['', 'LETTER_LND.mxd', 'NONE', 'LAYERS_ONLY'];
        for (var i = 0; i < expectedValues.length; ++i) {
            expect(s2Elements.get(i).getText()).toEqual(expectedValues[i]);
        }
    }

    function setParams(formatIndex, templateValue) {
        // Get the task parameter elements.
        var paramList = taskPage.getParams();
        // Verify we have the correct number of params
        expect(paramList.count()).toBe(7);
        return paramList.then(function(params) {
            var mapTemplate = params[1];
            mapTemplate.element(by.css('.select2-choice')).click();

            var lis = element.all(by.css('li.select2-results-dept-0'));
            return lis.then(function(li) {
                li[formatIndex-1].click();

                // now set the map template
                var template = params[1];
                return s2Util.setText(template, templateValue);
            });
        });
    }

    function verifyStatus() {
        // Verify there are no errors or warnings (warnings may be possible bug and to be investigated)
        expect(browser.getCurrentUrl()).toMatch(/\/status/);
        expect(taskStatusPage.getSuccess().isPresent()).toBeTruthy();
        expect(taskStatusPage.getDownloadLink().isPresent()).toBeTruthy();
    }
});