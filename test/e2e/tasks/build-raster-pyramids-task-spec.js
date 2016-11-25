'use strict';

describe('Run Build Raster Pyramids Task', function() {

    var Util = require('../../lib/util.js');
    var s2Util = require('../../lib/s2-util.js');
    var searchPage = require('../../pages/search-page.js');
    var taskPage = require('../../pages/task-page.js');
    var taskStatusPage = require('../../pages/task-status-page.js');
    var server = Util.getServer();

    beforeEach(function() {
        searchPage.addAllToQueue('title:L71146040_04020101105_B10');
        browser.get(server + '/queue?disp=default&task=build_raster_pyramids');
        Util.waitForSpinner();
    });

    it('should run using default parameter values - NEAREST_NEIGHBOR', function() {
        browser.sleep(1000);
        element(by.css('[ng-click="showAdvanced = !showAdvanced"]')).click();
        Util.waitForSpinner();
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(4);
        verifyDefaults(['', 'NEAREST_NEIGHBOR', 'DEFAULT']);

        var compression_element = element(by.css('[type="number"]'));
        expect(compression_element.getAttribute('value')).toEqual('75');

        taskPage.executeTask();
        browser.waitForAngular();
    });

    it('should run using resampling method: BILINEAR_INTERPOLATION', function() {
        browser.sleep(1000);
        Util.waitForSpinner();
        setParams(2, 'BILINEAR_INTERPOLATION');
        taskPage.executeTask();
        browser.waitForAngular();
    });

    afterEach(function() {
        verifyStatus();
    });

    function verifyDefaults(expectedValues) {
        // Verify default values
        var s2Elements = taskPage.getParameterValues();
        for (var i = 0; i < expectedValues.length; ++i) {
            expect(s2Elements.get(i).getText()).toEqual(expectedValues[i]);
        }
    }

    function setParams(formatIndex, method) {
        // Verify we have the correct number of params
        var paramList = taskPage.getParams();
        expect(paramList.count()).toBe(4);

        return paramList.then(function(params) {
            var resamplingMethodParam = params[1];
            var resamplingMethodElement = resamplingMethodParam.element(by.css('.select2-choice'));
            resamplingMethodElement.click();
            Util.waitForSpinner();
            var lis = element.all(by.css('li.select2-results-dept-0'));
            return lis.then(function(li) {
                li[formatIndex-1].click();
                Util.waitForSpinner();
                expect(resamplingMethodElement.getText()).toEqual(method)
            });
        });
    }

    function verifyStatus() {
        // Verify there are no errors or warnings (warnings may be possible bug and to be investigated)
        expect(browser.getCurrentUrl()).toMatch(/\/status/);
        expect(taskStatusPage.getSuccess().isPresent()).toBeTruthy();
    }
});