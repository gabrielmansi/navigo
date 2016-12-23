var Util = (function () {
    'use strict';

    return {

        waitForSpinner: function() {
            //wait for the block-ui overlay to go away
            var block = element(by.css('.block-ui-overlay'));
            return browser.wait(function () {
                return block.isDisplayed().then(function (result) {
                    return !result;
                });
            }, 30000);
        },

        waitForUser: function() {
            //wait for the user to be populated
            var user = element(by.binding('vm.user.name'))
            return browser.wait(function () {
                return user.getText().then(function (text) {
                    return text === 'admin';
                });
            }, 30000);
        },

        waitForElement: function(elem) {
            //wait for an element to be present on the page
            return browser.wait(function() {
                return elem.isPresent().then(function(isPresent) {
                    return isPresent;
                });
            }, 50000);
        },

        getServer: function() {
            //return 'http://localhost:8888/navigo/';
            //console.log("BROWSER URL", browser.params.url);
            return browser.params.url;
            //return 'http://localhost:9000/';
            //return 'http://voyagerdemo.com/daily/navigo/';
        },

        loginToVoyager: function(username, password) {

            // check if already logged in
            //element(by.css('[ng-click="toggleMobileNav()"]')).click();
            //browser.waitForAngular();
            var loginLink = element(by.css('[ng-click="vm.login()"]'));
            return loginLink.isDisplayed().then(function(isVisible) {
                if(isVisible) {
                    loginLink.click();
                    browser.waitForAngular();

                    var user = element(by.css('[name="username"]'));
                    var pass = element(by.css('[name="password"]'));
                    user.sendKeys(username);
                    pass.sendKeys(password);
                    element(by.css('[ng-click="ok()"]')).click();
                } else {
                    return Util.waitForUser();
                }
                return !isVisible;
            });
        },
        
        sendEnter: function() {
            //wait for the block-ui overlay to go away
            var enter = browser.actions().sendKeys(protractor.Key.ENTER);
            enter.perform();
        },

        getParent: function(object) {
            //wait for the block-ui overlay to go away
           return object.element(by.xpath('..'));
        }




    };
})();  // jshint ignore:line
module.exports = Util;