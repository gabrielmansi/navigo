'use strict';

describe('Run Clip Data by Features Task', function() {

    var Util = require('../../lib/util.js');
    var s2Util = require('../../lib/s2-util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:Hydrography_Lines and format:application/vnd.esri.shapefile');
        // Open Clip Data by Features task UI
        browser.get(server + '/queue?disp=default&task=clip_data_by_features');
        Util.waitForSpinner();
    });

    it('should run using default parameter values', function() {
        // Verify we have the correct number of params & defaults.
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(6);
        verifyDefaults(['', 'FileGDB', 'Same As Input']);

        // Set the clip features
        element(by.css('.btn.btn-default')).click();
        Util.waitForSpinner();
        Util.waitForSpinner();
        Util.waitForSpinner();
        element(by.css('[ng-click="toggleFilters()"]')).click();
        var expectedFilters = element.all(by.css('[ng-click="toggleDisplayState(filter)"]'));
        expect(expectedFilters.count()).toBe(2);
        var searchInput = element(by.css('[ng-model="searchInput"]'));
        searchInput.sendKeys('Countries');
        element(by.css('[ng-click="searchClick()"]')).click();
        Util.waitForSpinner();
        setClipFeatures(0);
        taskPage.executeTask();
        browser.waitForAngular();
    });

    it('should run using Format: SHP', function() {
        browser.sleep(1000);
        Util.waitForSpinner();
        setParams(2, 'Same As Input');
        taskPage.executeTask();
        browser.waitForAngular();
    });

    it('should run using Format: SHP and Projection: Web Mercator Auxiliary Sphere', function() {
        browser.sleep(1000);
        Util.waitForSpinner();
        setParams(2, 'WGS 1984 Web Mercator (auxiliary sphere)');
        taskPage.executeTask();
        browser.waitForAngular();
    });

    afterEach(function() {
        verifyStatus();
    });

    function verifyDefaults() {
        // Verify default values for output format and projection
        var s2Elements = taskPage.getParameterValues();
        var expectedValues = ['', 'FileGDB', 'Same As Input'];
        for (var i = 0; i < expectedValues.length; ++i) {
            expect(s2Elements.get(i).getText()).toEqual(expectedValues[i]);
        }
    }

    function setClipFeatures(itemIndex) {
       element(by.xpath('//*[@id="resultsTable"]/tbody/tr[1]/td[2]/span')).click();
    }

    function setParams(formatIndex, proj) {
        // Get the task parameter elements.
        var paramList = taskPage.getParams();

        // Verify we have the correct number of params
        expect(paramList.count()).toBe(6);

        return paramList.then(function(params) {
            var outputFormat = params[2];
            outputFormat.element(by.css('.select2-choice')).click();

            var lis = element.all(by.css('li.select2-results-dept-0'));
            return lis.then(function(li) {
                li[formatIndex-1].click();

                // now set the projection
                var projection = params[3];
                return s2Util.setText(projection, proj);
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