var searchPage = (function () {
    'use strict';

    var Util = require('../lib/util.js');

    return {

        getTotalLink: function () {
            return element(by.css('.total'));
        },

        getTotalValue: function() {
            return this.getTotalLink().getText().then(function(text) {
                var anchorVals = text.split(' ');
                return parseInt(anchorVals[0]);
            });
        },

        getAddToQueueLink: function() {
            return element(by.css('.total.flyout_trigger'));
        },

        getAddAllToCartLink: function() {
            return by.css('[ng-click="addAllToCart()"]');
        },

        getQueueCount: function() {
            return element(by.css('.queue_count')).getText().then(function(text) {
                //expect(parseInt(text) > 0).toBeTruthy();
                //console.log(text)
                return parseInt(text);
            });
        },

        getResultsCount: function() {
            return this.getAddToQueueLink().getText().then(function(text) {
                var result_text = text.split(' ');
                return parseInt(result_text[0]);
            });
        },

        addAllToQueue: function(query) {
            browser.get(Util.getServer() + '/search?q=' + query + '&disp=default&view=card&debug=true');

            // TODO need a better solution here...the spinner can reappear for other ajax calls
            Util.waitForSpinner();
            Util.waitForSpinner();
            Util.waitForSpinner();

            // Login into Voyager
            Util.loginToVoyager('admin', 'admin');
            browser.waitForAngular();
            browser.waitForAngular();

            // Stop if no results
            expect(this.getResultsCount()).toBeGreaterThan(0);

            // Add all items to the cart
            var addToQueueAnchor = this.getAddToQueueLink();
            browser.actions().mouseMove(addToQueueAnchor).click(addToQueueAnchor).perform();
            element(this.getAddAllToCartLink()).click();

            // Stop if no results
            expect(this.getQueueCount()).toBeGreaterThan(0);
        },

        getUser: function() {
            return element(by.binding('vm.user.name'));
        },

        getResults: function()
        {
            return element.all(by.repeater('doc in results'));
        },

        getResultNameElement: function(resultElement)
        {
            return resultElement.element(by.binding('getNameToUse(doc, names)'));
        },

        clickResult: function(resultElement)
        {
            resultElement.element(by.css('img')).click();
            Util.waitForSpinner();
        },

        getFirstResult: function() {
            return this.getResults().first();
        }

    };
})();  // jshint ignore:line
module.exports = searchPage;