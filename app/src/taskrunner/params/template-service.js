/*global angular */

angular.module('taskRunner').
    factory('templateService', function () {
        'use strict';
        var advancedIcon = '<i ng-show="param.advanced" class="fa fa-gear" title="Advanced"></i>';
        var requiredIcon = '<i ng-show="param.required" class="fa fa-asterisk" title="Required" style="margin-left: 2px; color: darkred; font-size: x-small"></i>';
        var errorTpl = '<div  class="process-control alert alert-danger" style="color:red" ng-show="param.error"><span class="glyphicon glyphicon-arrow-up"/> {{param.error}}</div>';
        var labelTpl = '<dl style="margin-bottom: 5px"><dt>' + advancedIcon + '{{param.label}}' + requiredIcon + '<dt><dd>{{param.desc}}</dd></dl>';
        var selectTpl = '<select ui-select2="{dropdownAutoWidth: \'true\', minimumResultsForSearch: 5}" ng-model="param.value"> <option ng-repeat="option in param.choices" value="{{option}}">{{param.values[option]}}</option></select>';
        var projectionSelect = '<input type="hidden" ui-select2="select2Options" ng-model="param.selected">';
        var textInputTpl = '<input type="text" class="form-control" ng-model="param.value" style="width: 40%">';
        var intInputTpl = '<input type="number" class="form-control" ng-model="param.value" style="width: 30%">';
        var pwdInputTpl = '<input type="password" class="form-control" style="width: 40%" ng-model="param.value">';
        var fieldList = '<input vs-field-param param="param">';
        var fieldListTpl = '<div ng-hide="param.advanced && !show">' + labelTpl + fieldList + errorTpl + '</div>';
        var field = '<input vs-field-param param="param" multi="false">';
        var fieldTpl = '<div ng-hide="param.advanced && !show">' + labelTpl + field + errorTpl + '</div>';

        var permissions ='<input vs-list-param param="param" list="permissions">';
        var permissionsTpl = '<div ng-hide="param.advanced && !show">' + labelTpl + permissions + errorTpl + '</div>';

        var projection = '<div ng-hide="param.advanced && !show" class="process-control">' + labelTpl + projectionSelect + errorTpl + '</div>';
        var stringChoice = '<div ng-hide="param.advanced && !show" class="process-control">' + labelTpl + selectTpl + errorTpl + '</div>';
        var textArea = '<div ng-hide="param.advanced && !show" class="process-control">' + labelTpl + '<textarea ng-model="param.value" style="width: 96%"></textarea>' + errorTpl + '</div>';
        var stringTpl = '<div ng-hide="param.advanced && !show" class="process-control">' + labelTpl + textInputTpl + errorTpl + '</div>';
        var checkBox = '<div ng-hide="param.advanced && !show" class="process-control">' + '<dl style="margin-bottom: 5px"><dt>' + advancedIcon + '{{param.label}}<dt><dd><label style="font-weight: normal"><input type="checkbox" ng-model="param.value"> {{param.desc}}</label></dd></dl>' + errorTpl + '</div>';
        var missing = '<div class="process-control" style="color:red">Missing {{param.name}} template</div>';
        var intTpl = '<div ng-hide="param.advanced && !show" class="process-control">' + labelTpl + intInputTpl + errorTpl + '</div>';
        var pwdTpl = '<div ng-hide="param.advanced && !show" class="process-control">' + labelTpl + pwdInputTpl + errorTpl + '</div>';
        var readOnlyLabelTpl = '<label style="width:100%; padding-left: 5px; margin-bottom: 0px; border-color: #eeeeee; border-bottom-style: solid; border-width: 1px;color:#999999">{{param.label}} </label>';
        var readOnlyTpl = '<div class="process-control" style>' + readOnlyLabelTpl + '<div style="padding-left: 5px;">{{param.value}}</div></div>';
        var readOnlyListTpl = '<div class="process-control" style>' + readOnlyLabelTpl + '<div style="padding-left: 5px;">{{param.value.join()}}</div></div>';
        var pwdReadOnlyTpl = '<div class="process-control" style>' + readOnlyLabelTpl + '<input type="password" ng-model="param.value" ng-disabled="true" style="padding-left: 5px;"></div>';
        var dateTpl = labelTpl + '<div class="input-group date"><input type="text" placeholder="yyyy-mm-dd" class="form-control" datepicker-popup="yyyy-MM-dd" is-open="isDateOpen" ng-click="openDatePicker($event)" ng-model="param.value" close-text="Close" ng-required="true"><span class="input-group-addon" style="width: 0" ng-click="openDatePicker($event)"><span class="glyphicon glyphicon-calendar" ng-click="openDatePicker($event)"></span></span></div>';

        var browseTpl = '<div class="input-group" style="width: 100%">' +
            '<input type="text" class="form-control" ng-model="param.value">' +
            '<span class="input-group-btn">' +
                '<button class="btn btn-default" type="button" ng-click="open(\'lg\')"> Browse</button>' +
            '</span></div>';

        var searchInput = '<div class="input-group" style="width: 100%">' +
            '<input type="text" class="form-control" ng-model="param.display">' +
            '<span class="input-group-btn">' +
            '<button class="btn btn-default" type="button" ng-click="search(\'lg\')"> Search</button>' +
            '</span></div>';

        var locationTpl = '<div class="process-control">' + labelTpl + browseTpl + errorTpl +  '</div>';
        var searchTpl = '<div class="process-control">' + labelTpl + searchInput + errorTpl +  '</div>';

        var templates = {
            //'VoyagerResults':'<div ng-show="false">' + labelTpl + '<div vs-results-control class="process-control" style="width:96%; float:left"></div>' + requiredIcon + errorTpl + '</div>',
            'VoyagerResults':'<div vs-ghost-items></div>',
            'Projection':projection,
            'StringChoice':stringChoice,
            'Geometry':'<div style="height:100%; width:100%; max-width: 800px; display: inline-block" class="map">' + labelTpl + '<div vs-clip-map class="clip-map" />' + errorTpl + '</div>',
            'MapView':'<div style="height:100%; width:100%; max-width: 800px; display: inline-block" class="map">' + labelTpl + '<div vs-view-map class="clip-map" />' + errorTpl + '</div>',
            'TextArea':textArea,
            'String':stringTpl,
            'CheckBox':checkBox,
            'CatalogPath':locationTpl,
            'FolderLocation':locationTpl,
            'Integer':intTpl,
            'Password':pwdTpl,
            'FieldList':fieldListTpl,
            'Field':fieldTpl,
            'Permissions': permissionsTpl,
            'IndexItem':searchTpl,
            'QueryIndex':searchTpl,
            'Date':dateTpl,

            //'VoyagerResults-readOnly':'<div>' + readOnlyLabelTpl + '<div vs-results-control readonly="true" class="process-control" style="width:100%; float:left; margin-bottom: 0px"></div></div>',
            'VoyagerResults-readOnly':'<div>' + readOnlyLabelTpl + '<div vs-view-items></div></div>',

            'Projection-readOnly':readOnlyTpl,
            'StringChoice-readOnly':readOnlyTpl,
            'Geometry-readOnly':'<div class="read-only-map">' + readOnlyLabelTpl + '<div vs-read-only-map class="clip-map" /></div>',
            'MapView-readOnly':'<div class="read-only-map">' + readOnlyLabelTpl + '<div vs-read-only-map class="clip-map" /></div>',
            'TextArea-readOnly':readOnlyTpl,
            'String-readOnly':readOnlyTpl,
            'CheckBox-readOnly':readOnlyTpl,
            'CatalogPath-readOnly':readOnlyTpl,
            'FolderLocation-readOnly':readOnlyTpl,
            'Integer-readOnly':readOnlyTpl,
            'Password-readOnly':pwdReadOnlyTpl,
            'FieldList-readOnly':readOnlyListTpl,
            'Permissions-readOnly':readOnlyListTpl,
            'Field-readOnly':readOnlyTpl,
            'QueryIndex-readOnly':readOnlyTpl
        };

        return {

            get: function (type, readOnly) {
                var suffix = '';
                if(readOnly === true) {
                    suffix = '-readOnly';
                }
                var template = templates[type + suffix];
                if (!template) {
                    template = missing;
                }
                return template;
            }
        };

    });
