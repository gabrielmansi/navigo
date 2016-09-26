'use strict';

angular.module('voyager.details').
    factory('detailConfig', function(config, $q, configService, translateService, configLoader, solrUtil) {

        var displayFields;
        if(config.settings) {
            displayFields = config.settings.data.details.detailsTableFields;
        }

        //summary
        var _summaryFields = [];
        var _summaryFlags = {};
        var _summaryInclusions = {};
        var _summaryParams = '';
        var _summaryFieldsOrder = {};
        //detail
        var inclusions = {};
        var _displayFieldsOrder = {};
        var displayParams = '';
        var _showAllFields = false;
        var _editable = {};
        var _styles = {};
        var _showLabels = {};
        var _maxLines = {};
        var _summaryStyles = {};
        var _summaryMaxLines = {};
        var _summaryShowLabels= {};
        var _pageFramework = {};

        var _showPath = true;
        var _showFormat = true;
        var _defaultMetadataStylesheet = '';
        var _globalEditable = false;

        var excludePrefix = config.excludeDetails;

        function _setInclusions() {
            $.each(displayFields, function (index, value) {
                value.name = solrUtil.stripAugmented(value.name);
                inclusions[value.name] = value.name;
                _styles[value.name] = value.style;
                _showLabels[value.name] = value.showLabel;
                _maxLines[value.name] = value.maxLines;
                displayParams += ', ' + value.name;
                _displayFieldsOrder[value.name] = index;
                _editable[value.name] = value.editable;
            });
        }

        function _setSummaryInclusions() {
            $.each(_summaryFields, function (index, value) {
                value.name = solrUtil.stripAugmented(value.name);
                _summaryInclusions[value.name] = value.name;
                _summaryStyles[value.name] = value.style;
                _summaryMaxLines[value.name] = value.maxLines;
                _summaryShowLabels[value.name] = value.showLabel;
                _summaryParams += ', ' + value.name;
                _summaryFieldsOrder[value.name] = index;
            });
        }

        function _getPageFramework() {
            return _pageFramework;
        }

        function _getSummaryFlags() {
            return _summaryFlags;
        }

        function _getDefaultMetadataStylesheet() {
            return _defaultMetadataStylesheet;
        }

        function _load(configId) {
            var deferred = $q.defer();
            configLoader.prepare().then(function() {
                translateService.init();
                // TODO - fix this it will load the config twice when deep linking to details page
                configService.setFilterConfig(configId).then(function() {
                    configService.getConfigDetails(configId).then(function (response) {
                        var display = response.data.details;
                        // console.log(response);
                        _pageFramework = display.pageElements;
                        _summaryFlags = display.summaryFields;
                        _defaultMetadataStylesheet = display.defaultMetadataStylesheet;
                        if (display.path === false) {
                            _showPath = false;
                        }
                        if (display.ref === false) {
                            _showFormat = false;
                        }
                        displayFields = display.detailsTableFields;
                        _showAllFields = display.detailsTableConfig === 'ALL';
                        //_globalEditable = display.detailsTableFieldsAreEditable;
                        _globalEditable = config.editAll;
                        if (display.summaryFields) {
                            _summaryFields = display.summaryFields.fields;
                            _setSummaryInclusions();
                        }
                        _setInclusions();
                        deferred.resolve();
                    });
                });
            });
            return deferred.promise;
        }

        function _exclude(name){
            var index =_.findIndex(excludePrefix, function(prefix) {
                return name.indexOf(prefix) === 0 || name === prefix;
            });
            return index !== -1;
        }

        function _getFields(doc, fields, typeInclusions, typeStyles, typeShowAllFields) {
            var prettyFields = [];
            var emptyFields = _.clone(typeInclusions);
            var isArray = false;

            //var exclusions = {'id':true, 'name':true,'format':true,'path':true,'thumb':true,'preview':true,'download':true,'bbox':true,'title':true};
            var formattedValue = '';
            $.each(doc, function (name, value) {
                if ((typeInclusions[name] || typeShowAllFields === true) && angular.isDefined(fields[name]) && fields[name].displayable === true) {
                    delete emptyFields[name];
                    if (!_exclude(name)) {

                        formattedValue = value;
                        isArray = false;
                        var formattedValues = {};

                        if (_.isArray(value)) {
                            formattedValue = value.join(', ');
                            isArray = true;
                            formattedValues = _.indexBy(value);
                        }

                        if (name === 'format') {
                            formattedValue = translateService.getType(value);
                        }
                        if (name === 'contains_mime') {
                            if (_.isArray(value)) {
                                formattedValues = {};  //overwrite with actual formatted values
                                _.each(value, function (val) {
                                    formattedValues[val] = translateService.getType(val);
                                });
                                //formattedValue = formattedValues.join();
                            } else {
                                formattedValue = translateService.getType(value);
                            }
                        }
                        if (name === 'location') {
                            formattedValue = translateService.getLocation(value);
                        }
                        if (typeStyles[name] === 'STRIP_HTML') {
                            formattedValue = $('<p>' + value + '</p>').text();
                        }

                        var isHtml = typeStyles[name] === 'HTML';
                        var isHref = typeStyles[name] === 'HREF';
                        if (value.length > 100 && !isHtml && !isHref) {
                            typeStyles[name] = 'STRING'; //so it doesn't become a link
                        }
                        prettyFields.push({
                            'name': translateService.getFieldName(name),
                            stype: fields[name].stype,
                            isArray: isArray,
                            'value': value,
                            formattedValue: formattedValue,
                            formattedValues: formattedValues,
                            order: _displayFieldsOrder[name],
                            editable: _editable[name] || _globalEditable,
                            maxLines: _maxLines[name],
                            showLabel: _showLabels[name],
                            key: name,
                            style: typeStyles[name],
                            isHtml: isHtml
                        });
                    }
                }
                if (prettyFields.length > 0) {
                    if (name === 'abstract' && !_.isEmpty(doc.abstract)) {
                        doc.displayDescription = _.last(prettyFields); // jshint ignore:line
                    } else if (name === 'description' && !_.isEmpty(doc.description)) {
                        doc.displayDescription = _.last(prettyFields);
                    }
                }

            });

            //fields without values aren't returned in the query results, display those that are editable
            $.each(emptyFields, function (name) {
                if(_editable[name] === true || _globalEditable) {
                    prettyFields.push({name: translateService.getFieldName(name), value: '', formattedValue: '', order:_displayFieldsOrder[name], editable: true, key:name});
                }
            });

            return _.sortBy(prettyFields, 'order');
        }

        function _getDisplayFields(doc, fields) {
            return _getFields(doc, fields, inclusions, _styles, _showAllFields);
        }

        function _getSummaryFields(doc, fields) {
            return _getFields(doc, fields, _summaryInclusions, _summaryStyles, false);
        }

        return {
            load: _load,

            showPath: function() {return _showPath;},

            showFormat: function() {return _showFormat;},

            getFields: _getDisplayFields,

            getSummaryFields: _getSummaryFields,

            getPageFramework: _getPageFramework,

            getDefaultMetadataStylesheet: _getDefaultMetadataStylesheet,

            getSummaryFlags: _getSummaryFlags

        };

    });
