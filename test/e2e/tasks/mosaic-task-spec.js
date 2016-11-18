'use strict';

describe('Run Mosaic Task', function() {

    var Util = require('../../lib/util.js');
    var s2Util = require('../../lib/s2-util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:n39w105f2dem and fileExtension:img');
        browser.get(server + '/queue?disp=default&task=mosaic');
        Util.waitForSpinner();
    });

    it('should run using default parameter values - output format is FileGDB', function() {
        browser.sleep(1000);
        element(by.css('[ng-click="showAdvanced = !showAdvanced"]')).click();
        Util.waitForSpinner();
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(6);
        verifyDefaults(['', 'Same As Input', 'FileGDB', 'LZ77']);

        var compression_element = element(by.css('[type="number"]'));
        expect(compression_element.getAttribute('value')).toEqual('75');

        taskPage.executeTask();
        browser.waitForAngular();
    });

    it('should run using output format: TIF', function() {
        browser.sleep(1000);
        Util.waitForSpinner();
        setParams(10, 'Same As Input');
        taskPage.executeTask();
        browser.waitForAngular();
    });

    afterEach(function() {
        verifyStatus();
    });

    function verifyDefaults(expectedValues) {
        // Verify default values for output format and projection
        var s2Elements = taskPage.getParameterValues();
        for (var i = 0; i < expectedValues.length; ++i) {
            expect(s2Elements.get(i).getText()).toEqual(expectedValues[i]);
        }
    }

    function setParams(formatIndex, proj) {
        // Verify we have the correct number of params
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(6);

        return paramList.then(function(params) {
            var outputFormat = params[2];
            outputFormat.element(by.css('.select2-choice')).click();
            Util.waitForSpinner();
            var lis = element.all(by.css('li.select2-results-dept-0'));
            return lis.then(function(li) {
                li[formatIndex-1].click();
                Util.waitForSpinner();
                // Set the projection
                var projection = params[1];
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