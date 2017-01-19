/*global angular, $ */

(function() {
    'use strict';

    angular.module('voyager.search')
        .factory('resultsDecorator', resultsDecorator);

    function resultsDecorator(configService, sugar, translateService, cartService, authService, $location, config, $filter, catalogService) {
        var _mappable = {'application/x-arcgis-image-server':true,'application/x-arcgis-feature-server':true,'application/x-arcgis-feature-server-layer':true,'application/x-arcgis-map-server':true,'application/x-arcgis-map-server-layer':true,'application/vnd.ogc.wms_xml':true, 'application/vnd.ogc.wms_layer_xml':true};

        function _setFormatProperties(doc) {
            doc.displayFormat = translateService.getType(doc.format);
            doc.isService = _mappable[doc.format];

            //TODO remove - doc.download should now be enough - has the stream url
            ///* jshint ignore:start */
            //if(doc.format_type === 'File' && doc.format_category === 'GIS' && doc.component_files && doc.component_files.length > 0) {
            //    doc.hasDownload = true;
            //}
            ///* jshint ignore:end */
        }

        function _loadDisplayFields(doc) {
            var htmlified = '';
            // var formattedValue, htmlified = '', lowerFieldName, values, formattedValues, actualValues = {}, trimmed, facetValue;

            doc.displayFields = configService.getDisplayFields(doc);
            // if(doc.displayFields.length > 3) {
            //     doc.displayFields = doc.displayFields.splice(0,3);
            // }

            $.each(doc.displayFields, function(index, field) {
                htmlified += _decorateField(field);
            });

            return htmlified;
        }

        function _decorateField(field) {
            var  htmlified = '', values, formattedValues, actualValues = {}, trimmed, facetValue;
            var formattedValue = field.value;
            var lowerFieldName = field.name.toLowerCase();

            if(lowerFieldName === 'format') {
                formattedValue = translateService.getType(field.value);
            }
            if(field.style === 'STRIP_HTML') {
                formattedValue = $('<p>' + field.value + '</p>').text();
            }
            if(field.style === 'HTML') {
                field.isHtml = true;
            }
            if (field.style === 'HREF') {
            	field.isHref = true;
            }
            if(field.raw === 'contains_mime') {
                if(field.value.indexOf(',') !== -1) {
                    formattedValues = [];
                    values = formattedValue.split(',');
                    _.each(values, function(val) {
                        trimmed = _.trim(val);
                        formattedValue = translateService.getType(trimmed);
                        formattedValues.push(formattedValue);
                        actualValues[formattedValue] = trimmed;
                    });
                    formattedValue = formattedValues.join();
                } else {
                    formattedValue = translateService.getType(field.value);
                }
            } else if (field.raw === 'bytes') {
                formattedValue = $filter('bytes')(field.value);
            } else if (sugar.isDate(field.value)) {
                formattedValue = $filter('date')(Date.parse(field.value), 'M/d/yyyy, hh:mma');
            }
            field.formattedValue = formattedValue;

            //TODO how to determine which fields can be linkable - multivalue only?
            if(lowerFieldName !== 'description' && lowerFieldName !== 'abstract' && isNaN(field.value) && lowerFieldName !== 'extent' && !field.isHref) {
                if(formattedValue.indexOf(',') !== -1) {
                    if(field.showLabel) {
                        htmlified += '<b>' + field.name + '</b>:';
                    }
                    values = formattedValue.split(',');
                    var sep = '';
                    _.each(values, function(val) {
                        htmlified += sep;
                        facetValue = _.trim(val);
                        if (angular.isDefined(actualValues[facetValue])) {
                            facetValue = actualValues[facetValue];  //reverse lookup the actual from translated
                        }
                        htmlified += '<a href="javascript:;" ng-click="applyFilter(\'' + field.raw + '\',\'' + facetValue + '\')"> ' + val + '</a>';
                        sep = ',';
                    });
                    htmlified += '<br>';
                } else {
                    htmlified += (field.showLabel? '<b>' + field.name + '</b>: ':'' ) + '<a href="javascript:;" ng-click="applyFilter(\'' + field.raw + '\',\'' + field.value + '\')">' + $('<p>' + field.formattedValue + '</p>').text() + '</a><br>';
                }
            } else if (field.isHref) {
            	htmlified += (field.showLabel? '<b>' + field.name + '</b>: ':'' ) + '<a href="' + field.value + '">' + $('<p>' + field.formattedValue + '</p>').text() + '</a><br>';
            } else {
                htmlified += (field.showLabel? '<b>' + field.name + '</b>: ':'' ) + $('<p>' + field.formattedValue + '</p>').text() + '<br>';
            }
            if(field.maxLines) {
                htmlified = '<div class="max-lines" style="max-height: '+ field.maxLines * 20  +'px;">' + htmlified + '</div>';
            }
            // }
            return htmlified;
        }

        function _getDetailsLink(doc, disp) {
            //rss issue hack - encoding twice works
            var link = 'show?id=' +  encodeURIComponent(encodeURIComponent(doc.id)) + '&disp=' + disp;
            if(angular.isDefined(doc.shard) && doc.shard !== '[not a shard request]') {
                link += '&shard=' + doc.shard;
                doc.isRemote = catalogService.isRemote(doc.shard);
            }
            return link;
        }

        function _removeLongTextFieldNames(htmlValue) {
            //don't show these field names to save space
            htmlValue = htmlValue.replace('<b>Description</b>:','');
            htmlValue = htmlValue.replace('<b>Abstract</b>:','');
            return htmlValue;
        }

        function _decorate(docs, recordIds, visitor) {
            var htmlified, disp = $location.search().disp || 'default';

            $.each(docs, function (index, doc) {
                recordIds.push({id:doc.id,shard:doc.shard});
                doc.isopen = false;

                doc.getActionText = 'Download';
                if(angular.isDefined(doc.download)) {
                    doc.hasDownload = true;
                    if(doc.download.indexOf('file:') === 0) {
                        doc.canOpen = true;
                        doc.getActionText = 'Open';
                    }
                }

                if(angular.isDefined(doc.layerURL)) {
                    doc.isEsriLayer = true;
                }

                if(angular.isDefined(doc.format)) {
                    _setFormatProperties(doc);
                }
                if (!_.isEmpty(doc.format)) {
                    doc.formatValue = translateService.getTypeAbbr(doc.format);
                    doc.formatLink = 'search?fq=format:' + doc.format + '&disp=' + disp;
                }

                if(angular.isDefined(doc.bytes)) {
                    doc.size = sugar.bytesToSize(doc.bytes);
                }

                htmlified = _loadDisplayFields(doc);

                doc.htmlValue = _removeLongTextFieldNames(htmlified);
                doc.detailLink = _getDetailsLink(doc, disp);
                doc.inCart = cartService.isInCart(doc.id);

                if (doc.isRemote !== true) {
                    doc.canCart = authService.hasPermission('process');
                }

                if(angular.isDefined(doc.thumb) && doc.thumb.indexOf('vres/mime') !== -1) {
                    doc.defaultThumb = true;
                }

                if(visitor) {
                    visitor(doc);
                }
            });

            return recordIds;
        }

        //public methods - client interface
        return {
            decorate : _decorate,
            decorateField: _decorateField
        };
    }

})();