/*global angular, $, _, config */

angular.module('voyager.util').
    factory('sugar', function ($http) {
        'use strict';
        var DATE_REGEX = new RegExp('^\\d{4}(-\\d{2}){2}T\\d{2}:\\d{2}(:\\d{2}(\\.\\d{1,3})?)?Z$', 'i');

        function _convertExtent(val) {
            if(val.indexOf('bbox') >= 0) {
                val = val.replace(/["\)]/g, ''); //remove double quotes and right paren
                var bboxInfo = val.split('(');
                var mode = bboxInfo[0].replace('Is','').toUpperCase();
                mode = mode.replace('BBOX:','');
                var bbox = bboxInfo[1];
                return 'bbox=' + bbox + '/bbox.mode=' + mode;
            }
            return val;
        }

        function _cleanSlash(val) {
            var newVal = val.replace(/\\/g, '');  //remove all escape characters
            newVal = newVal.replace(/\//g, '\\/'); //but still need to escape forward slashes
            newVal = _convertExtent(newVal);
            return newVal;
        }

        function _removeFunk(params) {
            if (angular.isDefined(params.fq)) {
                if (angular.isArray(params.fq)) {
                    $.each(params.fq, function (index, value) {
                        params.fq[index] = _cleanSlash(value);
                    });
                } else {
                    params.fq = _cleanSlash(params.fq);
                }
            }
        }

        function _separateOr(value) {
            var separated = value.substring(value.indexOf('}')+1), sep='';
            var parenStart = separated.indexOf('(');
            if (parenStart !== -1) {
                var filter = separated.substring(0, parenStart);
                var facets = separated.substring(parenStart+1, separated.indexOf(')'));
                facets = facets.split(' ');
                separated = '';
                _.each(facets, function(val) {
                    separated += sep + filter + val;
                    sep = '&fq=';
                });
            }
            return separated;
        }

        function _loadMapItem(mapList, key, item) {
            var mapItem = mapList[key];
            if (mapItem === undefined) {
                mapItem = {key: key, list: []};
            }
            mapItem.list.push(item);
            mapList[key] = mapItem;
        }

        return {

            retroParams: function (params) {
                _removeFunk(params);
                var retro = $.param(params, true);
                retro = retro.replace(/\+/g, ' ');
                retro = retro.replace(/ /g, '%20');
                //params = params.replace(/[\s\/\+\-!\(\){}\^"~*?:]|&&|\|\|/g, "\\$&");
                retro = retro.replace(/\\/g, '');
                retro = retro.replace(/&/g, '/');
                retro = retro.replace(/%3A/g, ':');
                //params = params.replace(/%5C/g, '');
                retro = retro.replace(/%5C%2F/g, '%252F');
                retro = retro.replace(/fq=/g, 'f.');
                retro = retro.replace(/path_path/g, 'path');
                retro = retro.replace('f.path', 'path');
                retro = retro.replace('f.bbox', 'bbox');
                retro = retro.replace('shard', 'catalog');
                retro = retro.replace(/:/g, '=');
                retro = retro.replace('*=*', '*:*');
                return retro;
            },

            bytesToSize: function (bytes) {
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes === 0) {
                    return '0 Bytes';
                }
                var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
            },
            
            isDate: function(input) {
                return ((!isNaN((new Date(input)).getDate())) && DATE_REGEX.test(input));
            },

            toArray: function (val) {
                if (typeof val === 'string') {
                    return [ val ];
                } else if (_.isUndefined(val)) {
                    return [];
                }
                return val.slice();
            },

            toMap: function(key, array) {
                var map = {};
                $.each(array, function (index, value) {
                    map[value[key]] = value;
                });
                return map;
            },

            toMapList: function(key, sourceList) {
                var mapList = {};
                var listItem;
                sourceList.forEach(function(item) {
                    listItem = item[key];
                    if (listItem !== undefined) {
                        if (Array.isArray(listItem)) {
                            item[key].forEach(function (sub) {
                                _loadMapItem(mapList, sub, item);
                            });
                        } else {
                            _loadMapItem(mapList, listItem, item);
                        }
                    }
                });
                return mapList;
            },

            hasField: function(list,field) {
                var has = false;
                $.each(list, function( index, item ) {
                    has = angular.isDefined(item[field]);
                    return !has;  //false kills the loop
                });
                return has;
            },

            trim: function(val, toTrim) {
                if (val.lastIndexOf(toTrim) === val.length-1) {
                    val = val.substring(0,val.length-1);
                }
                if (val.indexOf(toTrim) === 0) {
                    val = val.substring(1);
                }
                return val;
            },

            getIndex: function(array, val) {
                var i = 0;
                for (i; i < array.length; i++) {
                    if (array[i].indexOf(val) > -1) {
                        return i;
                    }
                }
                return -1;
            },

            toQueryString: function(params) {
                var queryString = '';
                var sep = '';
                $.each(params,function(key, value) {
                    if($.isArray(value)) {
                        $.each(value, function(index, val) {
                            queryString += sep + key + '=' + val;
                            sep = '&';
                        });
                    } else {
                        queryString += sep + key + '=' + value;
                        sep = '&';
                    }
                });
                return queryString;
            },

            toQueryStringEncoded: function(params) {
                var queryString = '';
                var sep = '';
                $.each(params,function(key, value) {
                    if($.isArray(value)) {
                        $.each(value, function(index, val) {
                            queryString += sep + key + '=' + encodeURIComponent(val);
                            sep = '&';
                        });
                    } else {
                        queryString += sep + key + '=' + encodeURIComponent(value);
                        sep = '&';
                    }
                });
                return queryString;
            },

            //TODO this just removes or filters, the disp config will apply as or filters if filters are CHECK style
            toNavigoQueryString: function(params) {
                var queryString = '';
                var sep = '', filterValue;
                $.each(params,function(key, value) {
                    if($.isArray(value)) {  // OR filters shouldn't be in an array
                        $.each(value, function(index, val) {
                            queryString += sep + key + '=' + val;
                            sep = '&';
                        });
                    } else {
                        filterValue = value;
                        if (filterValue.indexOf('{!tag=') !== -1) {
                            filterValue = _separateOr(filterValue);
                        }
                        queryString += sep + key + '=' + filterValue;
                        sep = '&';
                    }
                });
                return queryString;
            },

            copy: function(value) {
                return JSON.parse(JSON.stringify(value));
            },

            decodeParams: function(params) {
                $.each(params, function(index, param) {
                    if( typeof param === 'string' ) {
                        params[index] = decodeURIComponent(param);
                    } else {  //array
                        $.each(param, function(index, value) {
                            param[index] = decodeURIComponent(value);
                        });
                    }
                });
            },

            formatBBox: function(bbox) {
                var bboxRange = bbox.split(' ');

                _.each(bboxRange, function(item, index){
                    bboxRange[index] = Number(item).toFixed(2);
                });

                return bboxRange.join(' ');
            },

            postJson: function(request, api, action) {
                return $http({
                    method: 'POST',
                    url: config.root + 'api/rest/' + api  + '/' + action + '.json',
                    data: request,
                    headers: {'Content-Type': 'application/json'}
                });
            },

            postForm: function(url, data) {
                var service = config.root + url;
                var headerConfig = {headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}};
                return $http.post(service, data, headerConfig);
            },

            canOpen: function(doc) {
                return doc.download.indexOf('file:') === 0 || doc.format_type === 'Service' || doc.format_type === 'Server' || doc.format_type === 'Map' || doc.format_type === 'Application';
            },

            paramDelimiter: function(url) {
                var sep = '?';
                if(url.indexOf('?') !== -1) {
                    sep = '&';
                }
                return sep;
            },

            isValidDate: function(dateString) {
                var regEx = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d)/;
                return dateString.match(regEx) !== null;
            },

            contains: function(check, value) {
                return check.indexOf(value) > -1;
            },

            containsAny: function(check, values) {
                var contains = false;
                for (var i=0; i<values.length; i++) {
                    contains = check.indexOf(values[i]) > -1;
                    if (contains) {
                        break;
                    }
                }
                return contains;
            },

            mapToList: function(map) {
                var list = [];
                Object.keys(map).forEach(function(key) {
                    list.push(map[key]);
                });
                return list;
            },

            toGroupedList: function(key, list) {
                var categoryMap = this.toMapList(key,list);
                return this.mapToList(categoryMap);
            }

        };
    });



