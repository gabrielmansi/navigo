var homePage = (function () {
    'use strict';

    return{

        getSavedSearchesButton: function() {
            return element(by.css('[ng-click="changeTab(\'saved\')"]'));
        },

        getRecentSearchesButton: function() {
            return element(by.css('[ng-click="changeTab(\'recent\')"]'));
        },

        getSearchInput: function() {
            return element(by.model('search.query'));
        },

        getMostRecentSearch: function() {
            return element(by.css('[ng-click="applyRecentSearch(search)"]'));
        },

        getFirstSavedSearch: function() {
            return  element(by.linkText('Raster Properties'));
        },

        getFirstFeaturedItem: function() {
            return element(by.css('[ng-if="::doc.thumb && cardView.showThumbnail"]'));
        },

        getFeaturedItemsCount: function() {
            return element.all(by.repeater('doc in featured')).count();
        },

        getShowAllButton: function() {
            return element(by.css('[ng-click="showAll()"]'));
        },

        getPlacefinderInput: function() {
            return element(by.model('search.location'));
        },

        getFirstPlaceSuggestion: function() {
            return element(by.css('[ng-repeat="suggestion in suggestions | limitTo: 5"]'));
        },
        
        getSearchTypeButton: function() {
            return element(by.id('select2-chosen-2'));
        },

        getIntersectsOption: function() {
            return element(by.id('select2-result-label-4'));
        },

        
        getWithinSecondaryOption: function() {
            return element(by.id('select2-result-label-5'));
            //Usually would be select2-result-label-3, but changes after you change the type
        },

        getPlacefinderClearButton: function() {
            return element(by.css('[ng-click="clearField($event)"]'));
        },
        
        getAddFeaturedToCartButton: function() {
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

        getSearchBarDiv: function() {
            return element(by.css('.search_wrap')).element(by.xpath('..'));
        },

        getSearchByPlaceButton: function(){
            return element(by.id('searchByPlace'));
        },

        getSearchByMapButton: function(){
            return element(by.id('searchByMap'));
        },

    
          
    };
})();
module.exports = homePage;
