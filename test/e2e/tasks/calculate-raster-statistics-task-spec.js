'use strict';

describe('Run Calculate Raster Statistics Task', function() {

    var Util = require('../../lib/util.js');
    var s2Util = require('../../lib/s2-util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:L71146040_04020101105_B10');
        browser.get(server + '/queue?disp=default&task=calculate_raster_statistics');
        Util.waitForSpinner();
    });

    it('should run using default parameter values', function() {
        browser.sleep(1000);
        Util.waitForSpinner();
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(4);
        verifyDefaults(['1', '1']);
        taskPage.executeTask();
        browser.waitForAngular();
    });

    afterEach(function() {
        verifyStatus();
    });

    function verifyDefaults(expectedValues) {
        // Verify default values
        var numberElements = element.all(by.css('[type="number"]'));
        for (var i = 0; i < expectedValues.length; ++i) {
            expect(numberElements.get(i).getAttribute('value')).toEqual(expectedValues[i]);
        }
        Util.waitForSpinner();
        var ignoreValues = element.all(by.css('[type="text"]'));
        ignoreValues.get(4).sendKeys('0;255');
        expect(ignoreValues.get(4).getAttribute('value')).toEqual('0;255');
    }

    function verifyStatus() {
        // Verify there are no errors or warnings (warnings may be possible bug and to be investigated)
        expect(browser.getCurrentUrl()).toMatch(/\/status/);
        expect(taskStatusPage.getSuccess().isPresent()).toBeTruthy();
    }
});