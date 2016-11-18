'use strict';


describe('Zip Files Task', function() {

    var Util = require('../../lib/util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var taskReportPage = require('../../pages/task-report-page.js');
    var server = Util.getServer();


    it('should load zip_files task', function() {
        searchPage.addAllToQueue('title:Hydrography_Lines and format:application/vnd.esri.shapefile');
        browser.get(server + '/queue?disp=default&task=zip_files');
        browser.sleep(1000);
        Util.waitForSpinner();

        // Get list of parameters
        var paramList = taskPage.getParams();

        // Verify we have the correct number of params
        expect(paramList.count()).toBe(3);
        Util.waitForSpinner();  //can't click until spinner is gone

        // Execute the task with default parameter values
        taskPage.getTaskButton().click();
        browser.waitForAngular();
        browser.sleep(1000);
        // Open task report page and confirm number of files zipped.
        taskStatusPage.getShowReportLink().click();
        browser.waitForAngular();
        var grid = taskReportPage.getTableGrid();
        grid.each(function(row) {
            var rowElements = row.$$('td');
            expect(rowElements.count()).toBe(8);
            expect(rowElements.get(0).getText()).toMatch('Processed');
            expect(rowElements.get(1).getText()).toMatch('6');
        });
        taskReportPage.getCancelButton().click();

        // Check the status; expect no errors; expect download link
        expect(browser.getCurrentUrl()).toMatch(/\/status/);
        expect(taskStatusPage.getSuccess().isPresent()).toBeTruthy();
        expect(taskStatusPage.getDownloadLink().isPresent()).toBeTruthy();
    });
});