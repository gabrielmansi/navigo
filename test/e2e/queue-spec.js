'use strict';

describe('Queue', function() {

    var Util = require('../lib/util.js');

    var server = Util.getServer();

    function _showTasks() {
        var selectTaskButton = element.all(by.css('a[href="tasks"].btn'));
        Util.waitForSpinner();
        Util.patientClick(selectTaskButton, 3, 100);
    }

    //need to add an item to the queue first
    it('should add to queue', function() {
        browser.get(server + '/search?debug=true');
        Util.waitForSpinner();
        var addToQueueAnchor = element(by.css('[ng-click="default.do()"]'));
        Util.patientClick(addToQueueAnchor, 3, 100);
    });

    it('should load queue page', function() {
        browser.get(server + '/queue?disp=default');

        var items = element.all(by.repeater('item in cartItems'));
        expect(items.count()).toBeGreaterThan(0);
    });

    it('should show task list', function() {
        browser.get(server + '/queue?disp=default');

        var items = element.all(by.repeater('item in cartItems'));
        expect(items.count()).toBeGreaterThan(0);

        Util.waitForSpinner();
        Util.waitForSpinner();

        _showTasks();

        Util.waitForSpinner();

        var taskList = element.all(by.repeater('(name, group) in taskList'));
        expect(taskList.count()).toBeGreaterThan(0);
    });

});