'use strict';

describe('Queue', function() {

    var Util = require('../lib/util.js');

    var server = Util.getServer();

    function _showTasks() {
        var selectTaskButton = element(by.id('runTaskBtn'));
        Util.waitForSpinner();
        selectTaskButton.click();
    }

    //need to add an item to the queue first
    it('should add to queue', function() {
        browser.get(server + '/search?debug=true');
        Util.waitForSpinner();
        var addToQueueAnchor = element(by.css('.underline.icon-plus'));
        addToQueueAnchor.click();
    });

    it('should load queue page', function() {
        browser.get(server + '/queue?disp=default');

        var items = element.all(by.repeater('item in cartItems'));
        expect(items.count()).toBe(1);
    });

    it('should show task list', function() {
        browser.get(server + '/queue?disp=default');

        var items = element.all(by.repeater('item in cartItems'));
        expect(items.count()).toBe(1);

        Util.waitForSpinner();
        Util.waitForSpinner();

        _showTasks();

        Util.waitForSpinner();

        var taskList = element.all(by.repeater('(name, group) in taskList'));
        expect(taskList.count()).toBeGreaterThan(0);
    });

});