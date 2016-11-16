/*global angular, _, L, Wkt, alert, $ */

angular.module('voyager.map').
    factory('mapUtil', function (leafletData, config, $timeout) {

        'use strict';

        function _getBounds(bbox) {
            bbox = bbox.replace(/,/g, ' ');
            var bboxCoords = bbox.split(' ');
            var recStart = {'lat': bboxCoords[3], 'lng': bboxCoords[0]},
                recEnd = {'lat': bboxCoords[1], 'lng': bboxCoords[2]};
            return [recStart, recEnd];
        }

        var _defaultConfig = {
            //tileLayer: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}/",
            attributionControl: false,
            scrollWheelZoom: true,
            zoomControl: false,
//            noWrap: true,
//            continuousWorld: false,
            minZoom: 1
        };

        var _layers = {
            baselayers: {
                base: {
                    name: 'arcgis',
                    type: 'xyz',
                    url: 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}/',
                    layerParams: {
//                        noWrap: true,
//                        continuousWorld: false
                    },
                    layerOptions: {
                        showOnSelector: false
                    }
                }
            }
        };

        var baseMap = _.getPath(config, 'map.config.url');

        if(angular.isDefined(baseMap)) {
            if (config.map.config.proxy) {
                baseMap = config.root + 'proxy?' + baseMap;
            }
            if(config.map.type === 'WMSLayerDefinition') {
                delete _defaultConfig.tileLayer;
                _defaultConfig.crs = 'EPSG4326';
                _layers = {
                    baselayers: {
                        base: {
                            name: config.map.config.name,
                            type: 'wms',
                            url: baseMap,
                            layerOptions: {
                                layers: config.map.config.layers,
                                showOnSelector: false
                            },
                            layerParams: {
//                                noWrap: true,
//                                continuousWorld: false
                            }
                        }
                    }
                };
            } else if (config.map.type === 'MapboxLayerDefinition') {
                _layers.baselayers.base.url = baseMap.replace(/\$/g, '');  //remove $ needed for OL (classic) map
            } else {  // assumes ArcGIS
                if(config.map.config.cached === true) {
                    _layers.baselayers.base.url = baseMap + 'tile/{z}/{y}/{x}/';
                    if(config.map.config.simpleWGS84) {
                        // custom crs - snagged from leaflet 1.0 to support 4326 better
                        var wgs84Proj = L.extend({}, L.Projection.LonLat, {bounds:L.bounds([-180, -90], [180, 90])});
                        var wgs84 = L.extend({}, L.CRS, {
                            projection: wgs84Proj,
                            transformation: new L.Transformation(1 / 180, 1, -1 / 180, 0.5),
                            getSize: function (zoom) {
                                var b = this.projection.bounds,
                                    s = this.scale(zoom),
                                    min = this.transformation.transform(b.min, s),
                                    max = this.transformation.transform(b.max, s);

                                return L.point(Math.abs(max.x - min.x), Math.abs(max.y - min.y));
                            }
                        });
                        _defaultConfig.crs = wgs84;
                    }
                } else {  // not a cached base map - assume ArcGIS dynamic base // TODO - support other types?  which ones?
                    delete _defaultConfig.tileLayer;
                    // TODO - support other crs/spatial reference?  If not leaflet supported will need proj4j
                    //_defaultConfig.crs = 'EPSG4326';
                    _layers = {
                        baselayers: {
                            base: {
                                name: config.map.config.name,
                                type: 'agsDynamic',
                                url: baseMap,
                                layerOptions: {
                                    layers: config.map.config.layers,
                                    showOnSelector: false
                                }
                            }
                        }
                    };
                }
            }
        }

        function _getStyle(type, weight) {
            var color = config.searchMap.footprintColor;
            var _weight = config.searchMap.footprintWidth;
            if (angular.isDefined(type)) {
                color = (type.toLowerCase() === 'within') ? '#f06eaa' : '#1771b4';
                _weight = 1;
            }
            if (angular.isDefined(weight)) {
                _weight = weight;
            }
            return {color:color, weight:_weight};
        }

        return {
            getDefaultConfig: function() { return _defaultConfig;},

            getLayers: function(origin) {
                if(origin === 'home') {
                    var homeLayer = _.clone(_layers, true);
                    if (config.homepage.wrapMap === false) {
                        homeLayer.baselayers.base.layerParams.noWrap = true;
                    }
                    return homeLayer;
                }
                return _layers;
            },

            getRectangle: function(bbox, type, weight) {
                var bounds = _getBounds(bbox), style = _getStyle(type, weight);
                return L.rectangle(bounds, {color: style.color, weight: style.weight, fill:false});
            },

            getPolygon: function(geo, type, weight) {
                var style = _getStyle(type, weight);
                return L.polygon(geo.coordinates[0], {color: style.color, weight: style.weight, fill:false});
            },

            getGeoJson: function(geo, type, weight) {
                if(_.isString(geo)) {
                    geo = JSON.parse(geo);
                }
                var style = _getStyle(type, weight);
                var isPoint = geo.type === 'Point' || geo.type === 'MultiPoint';
                return L.geoJson(geo, {
                    style: {
                        color: style.color,
                        weight: isPoint?0:style.weight,
                        opacity: 0.65,
                        fill: isPoint,
                        fillOpacity: 0.65
                    },
                    pointToLayer: function(f, ll) {
                        return L.circleMarker(ll, {
                            radius: 6,
                            fillColor: style.color
                        });
                    }
                });
            },

            drawBBox: function (map, bbox, fit, type) {
                var box = this.getRectangle(bbox, type, 3);
                map.addLayer(box);
                if (fit) {
                    map.fitBounds(_getBounds(bbox));
                }
                return box;
            },

            drawPolygon: function (map, geo, fit, type) {
                var polygon = this.getPolygon(geo, type, 3);
                map.addLayer(polygon);
                if (fit) {
                    map.fitBounds(polygon.getBounds());
                }
                return polygon;
            },

            drawGeoJson: function (map, geo, fit, type, checkArea) {
                var geoJson = this.getGeoJson(geo, type, 3);
                var bounds = geoJson.getBounds();
                var area = 100000;  // default to large area
                if (checkArea) {
                    var lyr = L.GeoJSON.geometryToLayer(geo);
                    var latlngs = lyr.getLatLngs();
                    area = L.GeometryUtil.geodesicArea(latlngs);
                    if(area < 15000 && area !== 0) {  // 15000 sq meters ~ 10 miles
                        if(geo.type !== 'Point') {  // just show a point since the polygon may not be visible when zoomed out
                            geo.type = 'Point';
                            var center = bounds.getCenter();
                            geo.coordinates = [center.lng, center.lat];
                            geoJson = this.getGeoJson(geo, type, 3);
                        }
                    }
                }
                map.addLayer(geoJson);
                if (fit) {
                    $timeout(function() {
                        map.currentBounds = bounds;  //flag so resize event doesn't override
                        map.fitBounds(bounds);
                        if(area < 15000 && area !== 0) {  // 15000 sq meters ~ 10 miles
                            // TODO - can we make this smarter
                            // check the basemap zoom levels/boundaries and align with our area to get a more accurate zoom level
                            // use some kind of "near me" to find nearest location (placefinder?) and zoom to the boundaries of this point and that place
                            map.setZoom(3);  // area is small, zoom out
                        }
                    });
                }
                return geoJson;
            },

            fitToBBox: function (map, bbox, checkArea) {
                var bounds = _getBounds(bbox);
                map.fitBounds(bounds);
                if (checkArea) {
                    var area = L.GeometryUtil.geodesicArea(bounds);
                    if(area < 15000) {  // 15000 sq meters ~ 10 miles
                        map.setZoom(3);  // area is small, zoom out
                    }
                    // TODO - since we zoomed out, should we add a marker to indicate where the bbox is
                }
            },

            isWkt: function (args) {
                var wkt = new Wkt.Wkt();

                try {
                    wkt.read(args);
                } catch (e1) {
                    try {
                        wkt.read(args.replace('\n', '').replace('\r', '').replace('\t', ''));
                    } catch(e2) {
                        return false;
                    }
                }

                return true;
            },

            getWkt: function (args) {
                var wkt = new Wkt.Wkt();
                try { // Catch any malformed WKT strings
                    wkt.read(args);
                } catch (e1) {
                    try {
                        wkt.read(args.replace('\n', '').replace('\r', '').replace('\t', ''));
                    } catch (e2) {
                        if (e2.name === 'WKTError') {
                            alert('Wicket could not understand the WKT string you entered. Check that you have parentheses balanced, and try removing tabs and newline characters.');
                            return;
                        }
                    }
                }
                return wkt.toObject({}); // Make an object
            },
            moveMapTo: function (wktObj, map) {
                if (wktObj.getBounds !== undefined && typeof wktObj.getBounds === 'function') {
                    // For objects that have defined bounds or a way to get them
                    var height = $(map.getContainer()).height();
                    if (height > 0) {  //map freezes when setting bounds if container isn't shown yet
                        map.fitBounds(wktObj.getBounds());
                    } else {
                        map.moveToLater = wktObj.getBounds();
                    }
                } else {
                    if (wktObj.getLatLng !== undefined && typeof wktObj.getLatLng === 'function') {
                        map.panTo(wktObj.getLatLng());
                    }
                }
            },
            // ** just info on bbox and extent since leaflet has no concept of extent and minx etc **
            // toBBoxString = 'southwest_lng,southwest_lat,northeast_lng,northeast_lat'
            // northEast = new google.maps.LatLng(maxY, maxX);
            // southWest = new google.maps.LatLng(minY, minX);
            // bbox = left,bottom,right,top
            // bbox = min Longitude , min Latitude , max Longitude , max Latitude
            setExtent: function (map, param) {
                var bounds = map.getBounds();
                param.extent = bounds.toBBoxString().replace(/,/g, ' ');
                var center = bounds.getCenter();
                param.center = center.lat + ' ' + center.lng;
                param.zoom = map.getZoom();
            },
            startDraw: function (e, mapId) {
                leafletData.getMap(mapId).then(function (map) {
                    var options = {shapeOptions: {strokeOpacity: 0.8, fillOpacity: 0.0}, showArea: false};
                    if (e.target.id === 'clip-rectangle') {
                        new L.Draw.Rectangle(map, options).enable();
                    } else {
                        var polygon = new L.Draw.Polygon(map, options);
                        polygon.enable();
                    }
                });
            },
            getBounds: function(bbox) {
                return _getBounds(bbox);
            },

            isBbox: function(value) {
                var isBbox = false;
                if (_.isString(value) && !_.isEmpty(value)) {
                    var coords = value.split(' ');
                    var nonNumeric = _.find(coords, function(val) {
                        return isNaN(val);
                    });
                    if(angular.isUndefined(nonNumeric)) {
                        isBbox = true;
                    }
                }
                return isBbox;
            },
            convertToWkt: function(latlngs) {
                var wkt = new Wkt.Wkt();
                wkt.fromObject(latlngs);
                return wkt.write();
            },
            formatWktForDisplay: function(wkt) {

                if (!this.isWkt(wkt)) {
                    return wkt;
                }

                var wktArray = wkt.split(' ');
                var firstPartWkt = wktArray[0].split('.');
                var lastPartWkt = wktArray.pop().split('.');

                var shortWkt = firstPartWkt[0];

                if (firstPartWkt[1]) {
                    shortWkt += '.' + firstPartWkt[1].substring(0, (firstPartWkt[1].length > 1) ? 2 : 1);
                }

                shortWkt += ' ... ' + lastPartWkt[0];

                if (lastPartWkt[1]) {
                    var endLastPartArray = lastPartWkt[1].split(')');
                    if (endLastPartArray[0].length > 2) {
                        endLastPartArray[0] = endLastPartArray[0].substring(0, 2);
                    }
                    shortWkt += '.' + endLastPartArray.join(')');
                }

                return shortWkt;
            },
            currentColor: function(type) {
                return (type === 'Within') ? '#f06eaa' : '#1771b4';
            }
        };

    });
