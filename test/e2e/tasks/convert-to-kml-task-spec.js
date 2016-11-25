'use strict';


describe('Run Convert to KML Task', function() {

    var Util = require('../../lib/util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    it('should run convert_to_kml using default parameter values', function() {
        searchPage.addAllToQueue('title:Hydrography_Lines and format:application/vnd.esri.shapefile');

        browser.get(server + '/queue?disp=default&task=convert_to_kml');
        Util.waitForSpinner();

        // Get list of parameters
        var paramList = taskPage.getParams();

        // Verify we have the correct number of params
        expect(paramList.count()).toBe(2);
        Util.waitForSpinner();  //can't click until spinner is gone

        // Execute the task with default parameter values
        taskPage.executeTask();
        browser.waitForAngular();

        // Check the status and expect no errors
        expect(browser.getCurrentUrl()).toMatch(/\/status/);
        expect(taskStatusPage.getSuccess().isPresent()).toBeTruthy();
        // Expect download link
        expect(taskStatusPage.getDownloadLink().isPresent()).toBeTruthy();
    });
});