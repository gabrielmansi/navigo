'use strict';

describe('Run Mosaic to Workspace Task', function() {

    var Util = require('../../lib/util.js');
    var s2Util = require('../../lib/s2-util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:n39w105f2dem and fileExtension:img');
        browser.get(server + '/queue?disp=default&task=mosaic_to_workspace');
        Util.waitForSpinner();
    });

    it('should run using default parameter values - output format is FileGDB', function() {
        browser.sleep(1000);
        element(by.css('[ng-click="showAdvanced = !showAdvanced"]')).click();
        Util.waitForSpinner();
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(7);
        verifyDefaults(['', 'Same As Input', 'FileGDB', 'LZ77']);

        var compression_element = element(by.css('[type="number"]'));
        expect(compression_element.getAttribute('value')).toEqual('75');

        // Enter invalid workspace path and execute.
        var inputTextElements = element.all(by.css('[type="text"]'));
        inputTextElements.get(4).sendKeys('Z:\\TestData\\Test.gdb');
        inputTextElements.get(5).sendKeys('test');

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
        expect(taskStatusPage.getError().isPresent()).toBeTruthy();
    }
});