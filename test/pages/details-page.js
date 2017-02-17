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
            Util.patientClick(flagButton, 3, 100);
            Util.waitForSpinner();

            var flagInput = element(by.xpath('//*[@id="flagText"]'));
            flagInput.sendKeys(flag);
            var save = element(by.css('[ng-click="save()"]'));
            Util.patientClick(save,3,100);
            Util.waitForSpinner();
        },
        removeFlag: function() {
            var removeFlagButton = this.getRemoveFlagToolButton();
            Util.patientClick(removeFlagButton);
            Util.waitForSpinner();
        },
        gotoPreviousResult: function() {
            var previousLink = element(by.css('a[ng-click*=Previous]'));
            Util.patientClick(previousLink, 3, 100);
            Util.waitForSpinner();
        },
        gotoNextResult: function() {
            var nextLink = element(by.css('a[ng-click*=Next]'));
            Util.patientClick(nextLink, 3, 100);
            Util.waitForSpinner();
        },
        gotoRecentlyViewed: function(index) {
            var firstRecentlyViewedElement = element.all(by.repeater('doc in recent')).get(index).element(by.binding('doc.name'));
            Util.patientClick(firstRecentlyViewedElement, 3, 100);
            Util.waitForSpinner();
        },
        getReturnToSearchButton: function(){
            return element(by.xpath('//*[@id="detailTopStickyContent"]/ul/li[2]/a'));
        },
        getFormatSubtitle: function(){
            return element(by.css('[ng-class="formatClass"]'));
        },
        getCancelButton: function(){
            return element(by.css('[ng-click="cancel()"]'));
        },
        getFlagDialog: function(){
            return element(by.css('.modal-dialog'));
        },
        getAddTagButton: function(){
            return element(by.css('[ng-show="!labels.length"]'));
        },
        getTagInputField: function(){
            return element(by.css('.select2-search-field'));
        },
        getTags: function(){
            return element.all(by.css('.select2-search-choice'));
        },
        getTagHiddenState: function(){
            return element(by.css('[ng-show="showEditTag"]'));
        },
        getTagSuggestions: function(){
            return element.all(by.css('.select2-results-dept-0.select2-result.select2-result-selectable'));
        },
        getTagEditButton: function(){
            return element(by.css('[ng-show="labels.length"]'));
        },
        getPreviousButton: function(){
            return element(by.css('[ng-click="getPrevious()"]'));
        },
        getTagsFinished: function(){
            return element(by.css('[ng-click="searchTag(label)"]'));
        },
    };
})();  // jshint ignore:line
module.exports = detailsPage;