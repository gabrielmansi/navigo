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
                anchorVals[0] = anchorVals[0].replace(/,/g , '');
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
                var out = text.replace(',','');
                return parseInt(out);
            });
        },

        getResultsCount: function() {
            return this.getAddToQueueLink().getText().then(function(text) {
                var result_text = text.replace(',','').split(' ');
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
            Util.patientClick(element(this.getAddAllToCartLink()),3,100);

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
            Util.patientClick(resultElement.element(by.css('img')), 5, 200);
            Util.waitForSpinner();
        },

        getFirstResult: function() {
            return this.getResults().first();
        },

        getPlacefinderInput: function() {
            return element(by.model('search.place'));
        },

        getFirstPlaceSuggestion: function() {
            return element(by.css('[ng-repeat="suggestion in suggestions | limitTo: 5"]'));
        },
        
        getSearchTypeButton: function() {
            return element(by.id('select2-chosen-1'));
        },

        getIntersectsOption: function() {
            return element(by.id('select2-result-label-3'));
        },
        
        getWithinSecondaryOption: function() {
            return element(by.id('select2-result-label-4'));
            //Wwould be select2-result-label-3, but changes each time you change the type
        },

        getPlacefinderClearButton: function() {
            return element(by.css('[ng-click="clearField(\'location\', true)"]'));
        },

        getKeywordClearButton: function() {
            return element(by.css('[ng-click="clearField(\'q\', false)"]'));
        },

        getSearchInput: function() {
            return element(by.model('search.q'));
        },

        getSearchButton: function(){
            return element.all(by.xpath('//*[@id="headerSearchForm"]/button'));
        },
        /* Filters */
        getOpenFiltersMenuButton: function(){
            return element(by.css('.icon-filters'));
        },
        getHideFiltersMenuButton: function(){
            return element(by.css('.filter_header'));
        },

        /* Sorting */
        getSortButton: function(){
            return element(by.css('.sort_label'));
        },

        getSortAscendingButton: function(){
            return element(by.css('[ng-click="changeSortDirection(\'asc\')"]'));
        },

        getSortDescendingButton: function(){
            return element(by.css('[ng-click="changeSortDirection(\'desc\')"]'));
        },

        getSortRelevanceButton: function(){
            return element.all(by.css('[ng-repeat="field in ::sortable"]')).get(0);
        },

        getSortNameButton: function(){
            return element.all(by.css('[ng-repeat="field in ::sortable"]')).get(1);
        },

        getSortModifiedButton: function(){
            return element.all(by.css('[ng-repeat="field in ::sortable"]')).get(2);
        },

        getSortFileSizeButton: function(){
            return element.all(by.css('[ng-repeat="field in ::sortable"]')).get(3);
        },

        getSortPathButton: function(){
            return element.all(by.css('[ng-repeat="field in ::sortable"]')).get(4);
        },

        getSortTableNameButton: function(){
            return element.all(by.css('[ng-repeat="field in vm.tableFields"]')).get(0);
        },

        getSortTableFormatButton: function(){
            return element.all(by.css('[ng-repeat="field in vm.tableFields"]')).get(1);
        },

        getSortTableFileSizeButton: function(){
            return element.all(by.css('[ng-repeat="field in vm.tableFields"]')).get(2);
        },

        getSortTableModifiedButton: function(){
            return element.all(by.css('[ng-repeat="field in vm.tableFields"]')).get(3);
        },

        getTableViewImageOptions: function(){
            return element(by.css('.semi.icon-arrow.flyout_trigger'));
        },

        getTableViewToggleThumbnailsOption: function(){
            return element(by.css('[ng-click="toggleThumbnails()"]'));
        },

        getTableViewItemThumbnail: function(){
            return element.all(by.css('[src="assets/img/s.png"]')).get(0);
        },

        getTableViewHiddenItemThumbnail: function(){
            return element(by.css('[ng-hide="hideThumbnails"]'));
        },

        getTableViewColumn: function(index){
            return element.all(by.css('[ng-repeat="field in vm.tableFields"]')).get(index);
        },

        getTableViewColumnWidthController: function(index){
            return element.all(by.css('.rc-handle')).get(index);
        },

        getGridViewPopover: function(){
            return element(by.css('.popover.ng-isolate-scope'));
        },

        getGridViewPopoverTitle: function(){
            return element(by.css('.title.ng-scope'));
        },

        getGridViewPopoverImage: function(){
            return element(by.css('.img.ng-scope'));
        },

        getGridViewPopoverFormat: function(){
            return element(by.css('[ng-click*=applyFilter]'));
        },

        getAddItemToCartButton: function() {
            return element(by.css('[ng-click="default.do()"]'));
        },

        getCartCount: function() {
            return element(by.css('[ng-bind="vm.queueTotal | number"]'));
        },

        getCartDropdown: function() {
            return element(by.css('.icon-arrow.flyout_trigger'));
        },

        getClearCartButton: function() {
            return element(by.css('[ng-click="vm.clearQueue()"]'));
        },

        getItemTitle: function() {
            return element(by.css('[ng-if="::doc.thumb && cardView.showThumbnail"]'));
        },

        getItemThumbnail: function(){
            return element(by.css('.img'));
        },

        getFilterClass: function(){
            return element(by.css('.result_container.no_padding open_filter'));
        },

        getFilterPanel: function(){
            return element(by.css('.icon-filters'));
        },

        getFilterCategory: function(index){
            return element.all(by.css('[ng-repeat="filter in filters"]')).get(index);
        },

        getShowAllFiltersButton: function(){
            return element(by.css('[ng-click="showAllFacets(filter)"]'));
        },

        getShowAllFiltersDialog: function(){
            return element(by.css('.modal-dialog'));
        },

        getCloseFiltersDialog: function(){
            return element(by.css('[ng-click="cancel()"]'));
        },
        
        getFirstFilterInFiltersList: function(){
            return element(by.css('[ng-click="filterResults(facet, $event)"]'));
        },

        getFirstCountInFiltersList: function(){
            var parent = element(by.css('[ng-show="facet.style === \'CHECK\'"]'));
            return parent.element(by.css('.ng-binding'));
        },

        getCheckboxFacet: function(){
            return element(by.css('.facet_count.ng-binding'));
        },

        getFiltersDropdown: function(){
            return element(by.css('.semi.icon-arrow.flyout_trigger'));
        },

        getClearAllFilters: function(){
            return element(by.css('[ng-click="clearAllFilter()"]'));
        },

        getRemoveFacetButton: function(){
            return element(by.css('[ng-click="removeFilter(selected)"]'));
        },

        getHomeButton: function(){
            return element(by.css('.logo'));
        },

        getFacetInCategory: function(Category, facetIndex){
            return Category.all(by.css('[ng-repeat="facet in filter.values"]')).get(facetIndex);
        },

        getFlaggAllButton: function(){
            return element(by.css('[ng-click="flagAllResults()"]'));
        },

        getFlagEditText: function(){
            return element(by.id('flagText'));
        },

        getFirstFlag: function(){
            return element(by.css('[ng-click="applyTag(doc.tag_flags)"]'));
        },
        
        getClearAllFlagsButton: function(){
            return element(by.css('[ng-click="removeAllFlags()"]'));
        },

        getFlagConfirmButton: function(){
            return element(by.css('.btn.btn-primary'));
        },

        getEditFieldButton: function(){
            return element(by.css('[ng-click="editAllPresentation()"]'));
        }

    };
})();  // jshint ignore:line
module.exports = searchPage;