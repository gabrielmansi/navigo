var detailsPage = (function () {
    'use strict';

    var Util = require('../lib/util.js');

    return {

        getDocName: function() {
            return element.all(by.binding('doc.name')).first();
        },
        getLeafletMap: function () {
            return  element(by.css('.angular-leaflet-map'));
        },
        getThumbnail: function() {
            return element(by.css('.img-thumbnail'));
        },
        getDetailsButton: function () {
            return element(by.cssContainingText('a[ng-click*=changeTab]', 'Details'));
        },
        getDetailsButtonSelected: function () {
            return element(by.cssContainingText('li.selected a[ng-click*=changeTab]', 'Details'));
        },
        getDetailsTable: function() {
            return element(by.id('details-table'));
        },
        getDetailsTableRow: function(title) {
            var rowElement = element.all(by.cssContainingText('tr[ng-repeat="field in displayFields"]', title)).first();
            var row = {
                'element': rowElement,
                'editLink': rowElement.element(by.css('a.edit_link')),
                'input': rowElement.element(by.css('input.input_field')),
                'saveButton': rowElement.element(by.css('button[ng-click="doSave(field)"]')),
                'value': rowElement.element(by.binding('field.formattedValue'))
            }
            return row;
        },
        getAbsolutePath: function() {
            var pathField = this.getDetailsTableRow('Absolute Path').element(by.css('td')).element(by.css('div.formatted_value.ng-binding.ng-scope'));
            return pathField.getText();
        },
        getMetadataButton: function() {
            return element(by.cssContainingText('a[ng-click*=changeTab]', 'Metadata'));
        },
        getMetadataButtonSelected: function () {
            return element(by.cssContainingText('li.selected a[ng-click*=changeTab]', 'Metadata'));
        },
        getMetadataTable: function() {
            return element(by.id('metadata-tab'));
        },
        getRelationshipsButton: function() {
            return element(by.cssContainingText('a[ng-click*=changeTab]', 'Relationships'));
        },
        getRelationshipsButtonSelected: function () {
            return element(by.cssContainingText('li.selected a[ng-click*=changeTab]', 'Relationships'));
        },
        getRelationshipTable: function() {
            return element.all(by.css('section .relationship'));
        },
        getSchemaButton: function() {
            return element(by.cssContainingText('a[ng-click*=changeTab]', 'Schema'));
        },
        getSchemaButtonSelected: function () {
            return element(by.cssContainingText('li.selected a[ng-click*=changeTab]', 'Schema'));
        },
        getSchemaTable: function() {
            return element(by.id('schema-table'));
        },
        getAddToCartButton: function() {
            return element(by.cssContainingText('a[ng-click*=addToCart]', 'Add to Cart'));
        },
        getRemoveFromCartButton: function() {
            return element(by.cssContainingText('a[ng-click*=removeFromCart]', 'Remove'));
        },
        getCartTotal: function () {
            return element(by.binding('vm.queueTotal')).getText();
        },
        getToolsButton: function() {
            return element(by.css('a.btn.btn-util.icon-arrow.flyout_trigger span.icon-tools'));
        },
        getOpenToolButton: function() {
            return element.all(by.cssContainingText('a', 'Open')).first();
        },
        getFlagToolButton: function() {
            return element.all(by.cssContainingText('a', 'Flag This')).first();
        },
        getRemoveFlagToolButton: function() {
            return element.all(by.cssContainingText('a', 'Remove Flag')).first();
        },
        getFlags: function() {
            return element.all(by.css('a[ng-click="searchFlag(doc.tag_flags)"]'));
        },
        getFlag: function(flag) {
            return element(by.cssContainingText('a[ng-click="searchFlag(doc.tag_flags)"]', flag))
        },
        addFlag: function(flag) {
            var flagButton = this.getFlagToolButton();
            flagButton.click();
            Util.waitForSpinner();

            var flagInput = element(by.id('flagText'));
            flagInput.sendKeys(flag);
            element(by.css('[ng-click="save()"]')).click();
            Util.waitForSpinner();
        },
        removeFlag: function() {
            var removeFlagButton = this.getRemoveFlagToolButton();
            removeFlagButton.click();
            Util.waitForSpinner();
        },
        gotoPreviousResult: function() {
            var previousLink = element(by.css('a[ng-click*=Previous]'));
            previousLink.click();
            Util.waitForSpinner();
        },
        gotoNextResult: function() {
            var nextLink = element(by.css('a[ng-click*=Next]'));
            nextLink.click();
            Util.waitForSpinner();
        },
        gotoRecentlyViewed: function(index) {
            var firstRecentlyViewedElement = element.all(by.repeater('doc in recent')).get(index).element(by.binding('doc.name'));
            firstRecentlyViewedElement.click();
            Util.waitForSpinner();
        }
    };
})();  // jshint ignore:line
module.exports = detailsPage;