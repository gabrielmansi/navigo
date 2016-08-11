/* global config */
'use strict';

angular.module('voyager.heatmap')
    .service('heatmapService', function($q, $timeout, solrUtil, colorizer, $rootScope) {
        var query = {q: '*:*'};
        var blur = 5;
        var offset = 0;
        var interpMethod = 'linear';
        var callbacks = {
            render: []
        };
        var stats = false;
        var opacity = config.searchMap.heatmapOpacity;
        var color1 = colorizer.rgb(config.searchMap.heatmapColor1);
        var color2 = colorizer.rgb(config.searchMap.heatmapColor2);
        var self = this;

        function interpolate(min, max, method) {
            var delta = max - min;
            var fx;
            if (method === 'linear') {
                fx = function(x) {
                    return delta*x;
                };
            }
            else if (method === 'exp') {
                fx = function(x) {
                    return Math.exp(x * Math.log(1+delta))-1;
                };
            }
            else if (method === 'log') {
                fx = function(x) {
                    return delta * Math.log((x+1))/Math.log(2);
                };
            }
            else {
                throw 'not supported: ' + method;
            }

            return function(x) {
                return min + fx(x);
            };
        }

        function doFetch(bbox, level, offset, d) {
            solrUtil.heatmap(bbox, query, level).then(function(result) {
                var hm = result.data.facet_counts.facet_heatmaps.geohash;
                if (offset !== 0) {
                    doFetch(bbox, hm[1]+offset, 0, d);
                }
                else {
                    hm = _.zipObject(
                        _.filter(hm, function(val, i) {
                            return i % 2 === 0;
                        }),
                        _.filter(hm, function(val, i) {
                            return i % 2 !== 0;
                        })
                    );
                    d.resolve(hm);
                }
            });
        }

        function fire (evt, obj) {
            _.forEach(callbacks[evt], function(cb) {
                cb.call(null, obj);
            });
        }

        /**
         * Fetches the heatmap.
         *
         * @param  {string} bbox  Bounding box string, w,s,e,n ordering.
         * @param  {number} level Level to render at (optional).
         * @return {object} Promise to result with the heatmap object.
         */
        this.fetch = function(bbox, level) {
            var d = $q.defer();
            doFetch(bbox, level, offset, d);
            return d.promise;
        };

        /**
         * Initializes the heatmap.
         *
         * @param {L.Map} map The leaflet map the heatmap layer will be part of.
         * @return {L.Canvas.Layer} The heatmap layer.
         */
        this.init = function(map) {
            var throttle = null;
            var HeatmapLayer = L.CanvasLayer.extend({
                clear: function() {
                    var can = this.getCanvas();
                    var ctx = can.getContext('2d');
                    ctx.clearRect(0, 0, can.width, can.height);
                },

                renderGrid: function(hm) {
                    var hmRect = {
                        ul: map.latLngToContainerPoint({lng:hm.minX, lat:hm.maxY}),
                        lr: map.latLngToContainerPoint({lng:hm.maxX, lat:hm.minY}),
                    };
                    hmRect.width = hmRect.lr.x - hmRect.ul.x;
                    hmRect.height = hmRect.lr.y - hmRect.ul.y;

                    var can = this.getCanvas();
                    var ctx = can.getContext('2d');
                    ctx.strokeStyle = 'rgb(0,255,0)';
                    ctx.strokeRect(hmRect.ul.x, hmRect.ul.y, hmRect.width, hmRect.height);
                },

                render: function() {
                    $rootScope.$broadcast('renderHeatmapStarting', {message:'started heatmap rendering'});

                    if (throttle !== null) {
                        $timeout.cancel(throttle);
                    }

                    var layer = this;
                    layer.clear();
                    throttle = $timeout(function() {
                        self.fetch(map.getBounds().toBBoxString()).then(function(hm) {
                            layer.clear();

                            // get values and compute min max
                            var values = hm.counts_ints2D;
                            if (_.isEmpty(values)) {
                                return;
                            }

                            if (stats === true) {
                                var flatValues = _.flatten(values);
                                flatValues = _.filter(flatValues, function(val) {
                                    return val !== null;
                                });
                                hm.std = _.stdDeviation(flatValues);
                                hm.max = _.max(flatValues);
                                hm.min = _.min(flatValues);
                            }
                            else {
                                hm.max = _.max(values.map(_.max));
                                hm.min = _.min(values.map(_.min));
                            }

                            // get the interpolation function
                            var interp = interpolate(0, 1, interpMethod);

                            // width/height of each grid cell in lng/lat
                            var dx = (hm.maxX - hm.minX) / hm.columns;
                            var dy = (hm.maxY - hm.minY) / hm.rows;

                            var can = layer.getCanvas();
                            can.style.webkitFilter = 'blur('+blur+'px)';

                            var ctx = can.getContext('2d');

                            var y = hm.maxY;
                            for (var i = 0; i < hm.rows; i++) {
                                var row = values[i];
                                if (!_.isEmpty(row)) {
                                    var x = hm.minX;
                                    for (var j = 0; j < hm.columns; j++) {
                                        var p1 = map.latLngToContainerPoint({lng:x, lat:y});
                                        var p2 = map.latLngToContainerPoint({lng:x+dx, lat:y-dy});

                                        var val = interp(values[i][j]/hm.max);
                                        if (val > 0) {
                                            var rgb = colorizer.interpolate(color1,color2,val);
                                            rgb = rgb.opacify(opacity);
                                            ctx.fillStyle = rgb.rgba();
                                            ctx.fillRect(p1.x, p1.y, p2.x-p1.x, p2.y-p1.y);
                                        }
                                        x += dx;
                                    }
                                }
                                y -= dy;
                            }

                            fire('render', hm);
                            $rootScope.$broadcast('renderHeatmapEnding', {message:'started heatmap rendering'});
                        });
                    }, 200);
                }
            });

            var heatmap = new HeatmapLayer();
            map.on('zoomstart', function() {
                heatmap.clear();
            });

            this.layer = heatmap;
            return heatmap;
        };

        /**
         * Registers a callback with the heatmap layer. Supported events include
         * 'init', and 'render'.
         */
        this.on = function(evt, handler) {
            callbacks[evt].push(handler);
        };

        /**
         * Sets the heatmap query filter.
         *
         * @param {object} q The query object containing 'q', 'fq', etc... parameters.
         *
         * @return {object} This service.
         */
        this.filter = function(q) {
            query = q;
            return self;
        };

        /**
         * Sets the heatmap blur filter value.
         *
         * @param {number} b Blur value in pixels.
         *
         * @return {object} This service.
         */
        this.blur = function(b) {
            blur = b;
            return self;
        };

        /**
         * Sets the heatmap interpolation method.
         *
         * @param {string} m Method name, one of 'linear', 'exp', or 'log'.
         *
         * @return {object} This service.
         */
        this.interpMethod = function(m) {
            interpMethod = m;
            return self;
        };

        /**
         * Sets the heatmap level offset.
         *
         * @param {offset} o Hetamap level offset value.
         *
         * @return {object} This service.
         */
        this.offset = function(o) {
            offset = 0;
            return self;
        };

        /**
         * Sets computation of extended stats of the heatmap.
         *
         * @param {boolean} s Whether to compute extended stats or not.
         *
         * @return {object} This service.
         */
        this.stats = function(s) {
            stats = s;
            return self;
        };

        /**
         * Sets the overall opacity of the heatmap layer.
         *
         * @param {number} o Opacity value between 0 (transparent) and 1 (opaque).
         *
         * @return {object} This service.
         */
        this.opacity = function(o) {
            opacity = o;
            return self;
        };
    });