/*global angular,$ */

angular.module('voyager.util').
    factory('converter', function($q, config, sugar) {

        'use strict';

        function getPolygon(west,north,east,south) {
            var wkt = "POLYGON ((" +
                west + " " + north + ", " +
                east + " " + north + ", " +
                east + " " + south + ", " +
                west + " " + south + ", " +
                west + " " + north +
                "))";
            return wkt;
        }

        function toPolygon(bbox) {
            var coords = bbox.split(" ");
            // bbox = xmin ymin xmax ymax
            //north = ymax, west = xmin, south = ymin, east = xmax
            return getPolygon(coords[0],coords[3],coords[2],coords[1]);
        }

        function _mercatorToLatLon(mercX, mercY) {
            var rMajor = 6378137; //Equatorial Radius, WGS84
            var shift = Math.PI * rMajor;
            var lon = mercX / shift * 180.0;
            var lat = mercY / shift * 180.0;
            lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
            return [lat, lon];
        }

        function _getGeometries(extent) {
            var geometries = [];
            geometries.push({'x': extent.xmin, 'y': extent.ymin});
            geometries.push({'x': extent.xmax, 'y': extent.ymax});
            return geometries;
        }

        function _solrReady(name) {  //escape lucene special characters
            // escape OR values only
            if (name.indexOf('(') === 0 && name.indexOf(')') === name.length-1) {
                name = name.replace(' )',')').replace(')','').replace('(','');
                var facets = name.split(' ');
                name = '(';
                facets.forEach(function(facet) {
                    name += _solrReady(facet) + ' ';
                });
                name += ')';
                name = name.replace(' )',')');
            } else if (name.indexOf('\\') === -1) {
                name = name.replace(/[\s\/\+\-!\(\){}\^"~*?:]|&&|\|\|/g, "\\$&");
            }
            return name;
        }

        function _toClassic(params, from, to) {
            var converted = '';
            if(angular.isDefined(params[from])) {
                var pArr = sugar.toArray(params[from]), f, filter, filterValue;
                if (from === 'shards') {
                    pArr = params[from].split(',');
                }
                $.each(pArr, function(index, value) {
                    if (to.indexOf('links.') > -1) {
                        converted += '/' + to + '=' + encodeURIComponent(encodeURIComponent(value));
                    } else if (value.indexOf(':') !== -1) {
                        f = value.split(':');
                        filter = f[0];
                        filterValue = f[1];
                        if(f.length > 2) {
                            f.splice(0,1);
                            filterValue = f.join(':');
                        }
                        filterValue = filterValue.replace(/\\/g, ''); //remove escape characters
                        //TODO encoding twice so classic ui works - seems like classic ui needs to be fixed?
                        converted += '/' + to + '.' + filter + '=' + encodeURIComponent(encodeURIComponent(filterValue));
                    } else {
                        if(to === 'bbox.mode') {
                            if (value === 'w') {
                                value = 'WITHIN';
                            } else {
                                value = 'INTERSECTS';
                            }
                        }
                        converted += '/' + to + '=' + value;
                    }
                });
            }
            return converted;
        }

        return {
            toPolygon: function(bbox) {
                return toPolygon(bbox);
            },

            toWebMercator: function(extent, spatialReference) {

                var geometries = _getGeometries(extent);

                //var conv = proj4(JSON.stringify(spatialReference.wkid),'102100',geometries[0]);

                var svc = config.arcGisRoot + "rest/services/Geometry/GeometryServer/project?";
                svc += 'inSR=' + spatialReference.wkid;
                svc += '&outSR=102100';
                svc += '&geometries={"geometryType":"esriGeometryPoint","geometries":' + JSON.stringify(geometries) + '}';

                var deferred = $q.defer();

                if(spatialReference.wkid !== 102100 && spatialReference.wkid !== 102113) {
                    $.getJSON(svc + "&f=json&callback=?", function (data) {
                        var bounds = [_mercatorToLatLon(data.geometries[0].x, data.geometries[0].y), _mercatorToLatLon(data.geometries[1].x, data.geometries[1].y)];
                        deferred.resolve(bounds);
                    });
                } else {
                    var bounds = [_mercatorToLatLon(geometries[0].x, geometries[0].y), _mercatorToLatLon(geometries[1].x, geometries[1].y)];
                    deferred.resolve(bounds);
                }

                return deferred.promise;
            },

            toLatLng: function(extent, spatialReference) {

                var geometries = _getGeometries(extent);

                //TODO use proj4j instead of arcgis geometry service to convert
                //var conv = proj4(JSON.stringify(spatialReference.wkid),'102100',geometries[0]);

                var svc = config.arcGisRoot + "rest/services/Geometry/GeometryServer/project?";
                svc += 'inSR=' + spatialReference.wkid;
                svc += '&outSR=4326';
                svc += '&geometries={"geometryType":"esriGeometryPoint","geometries":' + JSON.stringify(geometries) + '}';

                var deferred = $q.defer();

                if(spatialReference.wkid !== 4326 && spatialReference.wkid !== 4269) {
                    $.getJSON(svc + "&f=json&callback=?", function (data) {
                        //TODO this seems to work in leaflet but geoserver axis order can change based on version of spec
                        //http://gis.stackexchange.com/questions/11626/does-y-mean-latitude-and-x-mean-longitude-in-every-gis-software
                        var bounds = [[data.geometries[0].x,data.geometries[0].y],[data.geometries[1].x,data.geometries[1].y]];
                        deferred.resolve(bounds);
                    });
                } else {
                    //TODO this seems to work in leaflet but geoserver axis order can change based on version of spec
                    //http://gis.stackexchange.com/questions/11626/does-y-mean-latitude-and-x-mean-longitude-in-every-gis-software
                    var bounds = [[geometries[0].x, geometries[0].y], [geometries[1].x, geometries[1].y]];
                    deferred.resolve(bounds);
                }

                return deferred.promise;
            },

            solrReady: function(value) {
                return _solrReady(value);
            },

            toSolrParams: function(filters) {
                var filterString = '', orFilters = {}, name;
                $.each(filters, function (index, facet) {
                    if (facet.filter !== '') {
                        name = _solrReady(facet.name);
                    } else {
                        name = facet.name;  //probably a solr function, don't escape
                    }
                    if (facet.style === 'CHECK') {  //CHECK is an OR filter
                        if(orFilters[facet.filter]) {
                            orFilters[facet.filter].push(name);
                        } else {
                            orFilters[facet.filter] = [name];
                        }
                    } else if (facet.style === 'RANGE' || facet.style === 'STATS' || facet.style === 'DATE') {
                        if (facet.filter !== facet.name) {
                            filterString += '&fq=' + facet.filter + ':' + _solrReady(facet.name);
                        } else if (facet.model) {  //TODO figure out why this is happening (filter field and name are same)
                            filterString += '&fq=' + facet.filter + ':[' + facet.model[0] + ' TO ' + facet.model[1] + ']';
                        } else {  //last ditch effort/hack (should not happen)
                            var filterValue = facet.humanized.substring(facet.humanized.indexOf(':')+1);
                            filterString += '&fq=' + facet.filter + ':' + filterValue;
                        }
                    } else {
                        //filter is optional (but typical, currently can only be blank from saved search)
                        if(facet.filter === '') {
                            filterString += '&fq=' + name;
                        } else {
                            filterString += '&fq=' + facet.filter + ":" + name;
                        }
                    }
                });
                $.each(orFilters, function (name, orFilter) { //apply OR filters
                    filterString += '&fq={!tag=' + name + '}' + name + ":(" + orFilter.join(" ") + ")";
                });
                return filterString;
            },

            //TODO above call calls this then does a join with &fq=
            toSolrQueryList: function(filters) {
                var filterQuery = [], orFilters = {}, name;
                $.each(filters, function (index, facet) {
                    if (facet.filter !== '') {
                        name = _solrReady(facet.name);
                    } else {
                        name = facet.name;  //probably a solr function, don't escape
                    }
                    if (facet.style === 'CHECK') {  //CHECK is an OR filter
                        if(orFilters[facet.filter]) {
                            orFilters[facet.filter].push(name);
                        } else {
                            orFilters[facet.filter] = [name];
                        }
                    } else if (facet.style === 'RANGE' || facet.style === 'STATS') {
                        filterQuery.push(facet.filter + ':' + facet.name);
                    } else {
                        //filter is optional (but typical, currently can only be blank from saved search)
                        if(facet.filter === '') {
                            filterQuery.push(name);
                        } else {
                            filterQuery.push(facet.filter + ':' + name);
                        }
                    }
                });
                $.each(orFilters, function (name, orFilter) { //apply OR filters
                    filterQuery.push('{!tag=' + name + '}' + name + ':(' + orFilter.join(' ') + ')');
                });
                return filterQuery;
            },

            toClassicParams: function(params, savedSearch) {
                var voyagerParams = '';

                if(angular.isDefined(params.q)) {
                    if(!savedSearch) {
                        voyagerParams += _toClassic(params, 'q', 'q');
                    } else {
                        voyagerParams += '/q=' + params.q;
                    }
                }

                voyagerParams += _toClassic(params, 'fq', 'f');

                voyagerParams += _toClassic(params, 'place', 'place');
                voyagerParams += _toClassic(params, 'place.op', 'place.op');

                voyagerParams += _toClassic(params, 'voyager.list', 'voyager.list');

                voyagerParams += _toClassic(params, 'links.to', 'links.to');
                voyagerParams += _toClassic(params, 'links.from', 'links.from');
                voyagerParams += _toClassic(params, 'shards', 'catalog');

                if(angular.isDefined(params.view) && params.view !== 'card') {
                    voyagerParams += '/view=' + params.view;
                }
                if(angular.isDefined(params.sort)) {
                    voyagerParams += '/sort=' + params.sort;
                }
                if(angular.isDefined(params.sortdir) && params.sortdir === 'desc') {
                    voyagerParams += '/sort.reverse=true';
                }

                return voyagerParams;
            },

            toIdTextArray: function(source) {
                source = source.replace(/ /g, '').split(',');
                return _.transform(source, function(arr, val, idx) {
                    arr[idx] = {id: val, text: val};
                });
            },

            toPlaceFilter: function(params) {
                var placeFq = '';
                if (angular.isDefined(params['place.op'])) {
                    placeFq += ' place.op=' + params['place.op'];
                    delete params['place.op'];
                }
                if (angular.isDefined(params['place.id'])) {
                    placeFq += ' place.id=' + params['place.id'];
                    delete params['place.id'];
                }
                placeFq = '{!' + placeFq +  '}place:"' + params.place + '"';
                delete params.place;
                return placeFq;
            }
        };

    });