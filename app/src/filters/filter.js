'use strict';

angular.module('voyager.filters')
  .directive('vsFilter', function ($compile) {

    var button = '<a href="javascript:;" ng-click="filterResults(facet)" class="underline" ng-class="facet.isSelected ? \'active\':\'\'">';
    button += '<span class="text">{{facet.display}}<span class="facet_count" ng-hide="facet.hasCount == false"> ({{facet.count}} filter items)</span></span> <span ng-show="facet.isSelected" class="icon-x"></span>';
    button += '</a>';

    var checkbox = '<div class="checkbox">';
    checkbox += '<label><input type="checkbox" ng-click="filterResults(facet)" ng-disabled="facet.disabled" ng-checked="facet.isSelected">{{facet.display}} ';
    checkbox += '<span class="facet_count" ng-hide="facet.hasCount == false">({{facet.count}})</span>';
    checkbox += '</label>';
    checkbox += '<span title="Not Available" class="facet_error icon-error" ng-show="facet.hasError == true">&nbsp;</span>';
    checkbox += '<span class="fa fa-star-o pull-right checkbox-only" ng-hide="facet.hasCount == false" ng-click="filterOnly(facet)" title="Only This"></span>';
    checkbox += '</div>';

    var slider = '<div class="ui_slider_wrap">';
    slider += '<div range-slider id="slider" min="facet.min" max="facet.max" model-min="facet.model[0]" model-max="facet.model[1]" step="1"></div></div>';
    slider += '<div class="slider_range"><span class="min pull-left" ng-bind="facet.min"></span>';
    slider += '<span class="min pull-right" ng-bind="facet.max | number"></span></div>';
    slider += '<button class="btn btn-xs btn-primary" ng-click="addRangeFilter(facet)">Apply filter</button></form>';
    slider += '</div>';

    var nounitslider = '<div class="slider_wrap"><form class="form-inline" role="form"><div class="form-group">';
    nounitslider += '<input class="form-control input-xs semi" type="text" ng-model="facet.model[0]" ng-init="facet.model[0] = (facet.model[0] == undefined) ? facet.min : facet.model[0]">';
    nounitslider += '<span class="dash"></span>';
    nounitslider += '<input class="form-control input-xs semi" type="text" ng-model="facet.model[1]" ng-init="facet.model[1] = (facet.model[1] == undefined) ? facet.max : facet.model[1]"></div>';
    nounitslider += slider;

    var unitslider = '<div class="slider_wrap"><form class="form-inline" role="form"><div class="form-group">';
    unitslider += '<input class="form-control input-xs semi" type="text" style="width:85px; padding:6px;" ng-model="facet.model[0]" ng-init="facet.model[0] = (facet.model[0] == undefined) ? facet.min : facet.model[0]">';
    unitslider += '<span class="dash thin-dash"></span>';
    unitslider += '<div class="input-group">';
    unitslider += '<input class="form-control input-xs semi" type="text" ng-model="facet.model[1]" ng-init="facet.model[1] = (facet.model[1] == undefined) ? facet.max : facet.model[1]">';
    unitslider += '<span class="input-group-addon" style="width:0px; padding-left:0px; padding-right:0px; border:none;"></span>';
    unitslider += '<select class="form-control" ng-model="facet.selectedUnit" ng-change="facet.convert(facet)" ng-options="unit for unit in facet.units"></select>';
    unitslider += '</div>';
    unitslider += slider;

    var stats = '<div class="row stats_wrap"><ul><li><div class="pull-left col-xs-4">Total</div>{{facet.sum | number}}</li><li><div class="pull-left col-xs-4">Average</div>{{facet.mean | number}}</li><li><div class="pull-left col-xs-4">Deviation</div>{{facet.stddev | number}}</li></ul></div>';

    var tree = '<div><ul class="folder_tree" frang-tree>';
    tree += '<li frang-tree-repeat="node in facet.tree">';
    tree += '<div ng-class="node.children && node.children.length > 0 ? \'folderNode\' : \'leaf\'"><span class="icon"';
    tree += 'ng-class="{collapsed: node.collapsed, expanded: !node.collapsed}"';
    tree += 'ng-show="node.children && node.children.length > 0"';
    tree += 'ng-click="loadNode(node)"></span>';
    tree += '<i class="fa" ng-class="{\'fa-folder\': node.collapsed, \'fa-folder-open\': !node.collapsed}"></i>';
    tree += '<span class="label" ng-class="{folder: node.children && node.children.length > 0}">';
    tree += '<a href="javascript:;" ng-click="addFolderFilter(node)" ng-class="{selected:node.id === doc.id}">{{node.display}}</a>';
    tree += '</span>';
    tree += '</div>';
    tree += '<ul class="noindent" ng-if="!node.collapsed && node.children && node.children.length > 0"';
    tree += 'frang-tree-insert-children="node.children"></ul>';
    tree += '</li>';
    tree += '</ul></div>';

    var date = '<div class="slider_wrap"><form class="form-inline" role="form"><div class="form-group">';
    date += '<label class="semi">Date</label><br />';
    date += '<input type="text" placeholder="yyyy-mm-dd" class="form-control input-xs semi min_date_picker_input {{facet.minError}}" datepicker-popup="yyyy-MM-dd" is-open="facet.isMinOpened" ng-click="openMinDatePicker($event, facet)" datepicker-options="{formatYear: \'yy\', startingDay: 1, showWeeks: false, showButtonBar: false}" ng-model="facet.model[0]" close-text="Close" ng-required="true" />';
    date += '<span class="dash"></span>';
    date += '<input type="text" placeholder="yyyy-mm-dd" class="form-control input-xs semi max_date_picker_input {{facet.maxError}}" datepicker-popup="yyyy-MM-dd" is-open="facet.isMaxOpened" ng-focus="openMaxDatePicker($event, facet)" datepicker-options="{formatYear: \'yy\', startingDay: 1, showWeeks: false, showButtonBar: false}" ng-model="facet.model[1]" close-text="Close" ng-required="true" />';
    date += '</div><button class="btn btn-xs btn-primary" ng-click="addCalendarFilter(facet)">Apply filter</button></form>';
    date += '</div>';

    function _link(scope, element) {

      var template = '';
      if (scope.facet.stype === 'date') {
        template = date;
      }
      else if(scope.facet.style === 'CHECK') {
        template = checkbox;
      } else if(scope.facet.style ==='RANGE') {
        if(scope.facet.units) {
          template = unitslider;
        } else {
          template = nounitslider;
        }
      } else if(scope.facet.style ==='STATS') {
        template = nounitslider + stats;
      } else if(scope.facet.filter === 'folder_hier') {
        template = tree;
      } else {
        template = button;
      }

      element.html(template).show();
      $compile(element.contents())(scope);
    }

    function _controller($scope, config) {
      $scope.imagePrefix = config.root + 'vres/mime/icon/';
    }

    return {
      restrict: 'A',
      replace: true,
      link: _link,
      controller: _controller
    };
  });