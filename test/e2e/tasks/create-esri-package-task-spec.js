'use strict';


describe('Run Create Esri Map or Layer Package Task', function() {

    var Util = require('../../lib/util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:Hydrography_Lines and format:application/vnd.esri.shapefile');
        // Open Clip Data by Features task UI
        browser.get(server + '/queue?disp=default&task=create_esri_package');
        Util.waitForSpinner();
    });

    // Load and run Create Esri Package task
    it('should run using Format: MPK', function() {
        // Get list of parameters
        var paramList = taskPage.getParams();

        // Verify we have the correct number of params & defaults
        expect(paramList.count()).toBe(5);
        Util.waitForSpinner();  //can't click until spinner is gone
        verifyDefaults();

        // Execute the task with default parameter values
        taskPage.executeTask();
        browser.waitForAngular();
    });

    it('should run using Format: LPK', function() {
        browser.sleep(1000);
        Util.waitForSpinner();
        setParams(2, 'LPK');
        taskPage.executeTask();
    });

    afterEach(function() {
        verifyStatus();
    });

    function verifyDefaults() {
        // Verify default values for output format and projection
        var s2Elements = taskPage.getParameterValues();
        var expectedValues = ['', 'MPK'];
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

    function setParams(formatIndex, pkgFormat) {
        // Verify we have the correct number of params.
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(5);

        return paramList.then(function(params) {
            var outputFormat = params[1];
            outputFormat.element(by.css('.select2-choice')).click();
            Util.waitForSpinner();
            var lis = element.all(by.css('li.select2-results-dept-0'));
            return lis.then(function(li) {
                li[formatIndex-1].click();
            });
        });
    }

});