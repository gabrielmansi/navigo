'use strict';


describe('Run Create Layer Files Task', function() {

    var Util = require('../../lib/util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:test_polygon_102100');
        browser.get(server + '/queue?disp=default&task=create_layer_files');
        Util.waitForSpinner();
    });

    it('should run create_layer_files using default parameter values', function() {

        // Get list of parameters
        var paramList = taskPage.getParams();

        // Verify we have the correct number of params and defaults
        expect(paramList.count()).toBe(2);
        Util.waitForSpinner();  //can't click until spinner is gone

        // Enter an output file name.
        setMetaFolderPath();

        // Execute the task with default parameter values
        taskPage.executeTask();
        browser.waitForAngular();
    });

    afterEach(function() {
        verifyStatus();
    });

    function setMetaFolderPath() {
        var textInputs = element.all(by.css('[ng-model="param.value"]'));
        return textInputs.then(function(textInput) {
            textInput[0].sendKeys("C:\\voyager\\data\\default\\meta");
        });
    }

    function verifyStatus() {
        // Verify there are no errors or warnings (warnings may be possible bug and to be investigated)
        expect(browser.getCurrentUrl()).toMatch(/\/status/);
        expect(taskStatusPage.getSuccess().isPresent()).toBeTruthy();
    }
});