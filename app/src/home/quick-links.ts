/// <reference path="../ts-reference.ts" />
'use strict';
declare var _;  // lodash global dep

namespace VoyagerHome {

  export class QuickLinks {
    templateUrl = 'src/home/quick-links.html';
    bindings = {
      title: '@',
      list: '<'
    };
    controller = Controller;
  }

  class Controller {

    list;
    title;

    categories = [];

    constructor(private savedSearchService, private $scope, private $timeout, private sugar) {}

    $onChanges(changesObj) {
      if (changesObj.list && changesObj.list.currentValue) {
        var categoryMap = this.sugar.toMapList('categories',changesObj.list.currentValue);
        var categoryList = this.sugar.mapToList(categoryMap);

        if (categoryList.length > 0) {
          // put any with missing category into "Other"
          var others = changesObj.list.currentValue.filter((item) => {
            return item.categories === undefined;
          });

          if (others.length > 0) {
            categoryList.push({key: 'Others', list: others})
          }
          this.categories = _.sortBy(categoryList, 'title');
          this.categories[0].displayState = 'in';  // default 1st item to open
        }
      }
    }

    applyCollection(saved) {
      this.savedSearchService.applySavedSearch(saved, this.$scope);
    }

    toggleDisplayState(category) {
      //timeout allows the directive to fire first
      this.$timeout(() => {
        category.displayState = category.displayState === 'in' ? '' : 'in';
      }, 0);
    }

  }

}