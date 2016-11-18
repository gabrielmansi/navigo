'use strict';


describe('Run Export Result List Task', function() {

    var Util = require('../../lib/util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:Hydrography_Lines and format:application/vnd.esri.shapefile');
        browser.get(server + '/queue?disp=default&task=export_result_list');
        Util.waitForSpinner();
    });
    
    it('should run export_result_list using default parameter values', function() {

        // Get list of parameters
        var paramList = taskPage.getParams();

        // Verify we have the correct number of params and defaults
        expect(paramList.count()).toBe(4);
        Util.waitForSpinner();  //can't click until spinner is gone
        verifyDefaults();

        // Enter an output file name.
        setOutputFileName();

        // Execute the task with default parameter values
        taskPage.executeTask();
        browser.waitForAngular();
    });

    it('should run export_result_list using output format: XML', function() {
        setOutputFileName();
        setParams(3, 'XML');
        taskPage.executeTask();
    });

    afterEach(function() {
        verifyStatus();
    });

    function setOutputFileName() {
        var textInputs = element.all(by.css('[ng-model="param.value"]'));
        return textInputs.then(function(textInput) {
            textInput[0].sendKeys("HydrographyLines");
        });
    }

    function verifyDefaults() {
        // Verify default values for output format and projection
        var s2Elements = taskPage.getParameterValues();
        var expectedValues = ['', 'CSV'];
        for (var i = 0; i < expectedValues.length; ++i) {
            expect(s2Elements.get(i).getText()).toEqual(expectedValues[i]);
        }
    }

    function verifyStatus() {
        // Verify there are no errors or warnings (warnings may be possible bug and to be investigated)
        expect(browser.getCurrentUrl()).toMatch(/\/status/);
        expect(taskStatusPage.getSuccess().isPresent()).toBeTruthy();
        expect(taskStatusPage.getDownloadLink().isPresent()).toBeTruthy();
    }

    function setParams(formatIndex) {
        var paramList = taskPage.getParams();
        return paramList.then(function(params) {
            var outputFormat = params[3];
            outputFormat.element(by.css('.select2-choice')).click();
            var lis = element.all(by.css('li.select2-results-dept-0'));
            return lis.then(function(li) {
                li[formatIndex-1].click();
            });
        });
    }
});