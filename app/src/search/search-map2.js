/*global angular, $, L */

angular.module('voyager.search')
	.directive('vsSearchMap', function ($compile, config, mapUtil, baseMapService, $timeout, mapControls, configService, $window, $http, sugar, $rootScope, mapCustomControls, searchViewService) {
		'use strict';

		function getMapSizeTemplate() {
			var mapSizeTemplate = '<div ng-show="view == \'table\'" class="leaflet-control-map-size-toggle leaflet-bar leaflet-control">';
			mapSizeTemplate += '<div class="map-size-drop-down">';
			mapSizeTemplate += '<div class="icon-arrow flyout-trigger" ng-click="toggleMapSizeDropDown()"><span class="icon-search_map"></span></div>';
			mapSizeTemplate += '<div class="flyout"><div class="arrow"></div><div class="flyout_inner">';
			mapSizeTemplate += '<ul><li><a href="javascript:;" ng-click="switchMap(\'large\')">Large map</a></li>';
			mapSizeTemplate += '<li><a href="javascript:;" ng-click="switchMap(\'small\')">Small map</a></li>';
			mapSizeTemplate += '<li><a href="javascript:;" ng-click="switchMap(\'no\')">No map</a></li>';
			mapSizeTemplate += '</ul></div></div></div></div>';

			return mapSizeTemplate;
		}

		function getExtent(params) {
			//copy mapDefault so it doesn't get modified
			var extent = $.extend({}, configService.getDefaultMapView());
			if (params.vw) {  //use query string if on url
				extent = configService.parseMapViewString(params.vw, ' ');
			}
			return extent;
		}

		function toggleMapMode($element, $scope, leafletData) {

			if ($scope.displayFormat === 'detail_format') {
				leafletData.getMap('search-map').then(function (map) {
					map.dragging.disable();
					map.doubleClickZoom.disable();
					map.scrollWheelZoom.disable();
					if (map.drawRectangle !== undefined) {
						map.drawRectangle.disable();
					}
					$element.addClass('dragging_disabled');
				});
			}
			else {
				leafletData.getMap('search-map').then(function (map) {
					map.dragging.enable();
					map.doubleClickZoom.enable();
					map.scrollWheelZoom.disable();
					$element.removeClass('dragging_disabled');
					$scope.resizeMap(true);
				});

				$('#searchByMap').addClass('selected').siblings().removeClass('selected');
			}
		}

		return {
			compile: function(element, attr) {
				element.append('<leaflet class="search-map" style="height: 100%" center="clientDefault" defaults="defaults" controls="controls" layers="layers" id="search-map" watch-markers="no"></leaflet>');

				return function (scope) {           //<- This is link function
					if(angular.isDefined(attr.zoom)) {
						scope.clientDefault.zoom = parseInt(attr.zoom);
					}
				};
			},
			controller: function ($scope, $element, $attrs, leafletData, $stateParams) {

				var _drawedShape;
				var _cancelledDraw = false;
				var _searchBoundaryLayer;
				var _searchBoundary;
				var _remove;
				var _closeMarker;
				var _editMarker;
				var _bufferBoundaryLayer;
				var _timer;
				var windowEl = angular.element($window);

				$scope._drawing = false;
				$scope.toolType = 'rectangle';
				$scope.clientDefault = getExtent($stateParams, config);
				$scope.defaults = baseMapService.getDefaultConfig();
				if($attrs.basemapvisible !== 'false') {
					$scope.layers = baseMapService.getLayers($attrs.origin);
				} else  {
					$scope.layers = {};
				}
				$scope.controls = {
					custom: []
				};

				mapControls.init($scope, 'search-map');

				var _unbindResize = function() {
					windowEl.unbind('resize', $scope.resizeMap);
				};

				function _cancelDraw() {
					$scope.$emit('cancelledDraw');
					$scope._drawing = false;
					_cancelledDraw = true;
					if(_drawedShape) {
						_drawedShape.disable();
					}
				}

				$scope.$on('removeFilter', function() {
					_cancelDraw();
					_removeLayers();
					_removeMarkers();
				});

				$scope.$on('clearBboxEvent', function(){
					_removeLayers();
					_removeMarkers();
				});


				var zoomIn = $scope.zoomIn;
				$scope.zoomIn = function(e) {
					_cancelDraw();
					zoomIn(e);
					_unbindResize();
				};

				var zoomOut = $scope.zoomOut;
				$scope.zoomOut = function(e) {
					_cancelDraw();
					zoomOut(e);
					_unbindResize();
				};

				var defaultExtent = $scope.defaultExtent;
				$scope.defaultExtent = function(e) {
					_cancelDraw();
					defaultExtent(e);
				};

				$scope.toggleDisplayFormat = function(type, event) {
					event.preventDefault();
					event.stopPropagation();

					if ($scope.selectedMapType !== type) {
						$scope.selectedMapType = type;
						$(event.currentTarget).addClass('selected').siblings().removeClass('selected');
						$scope.$emit('searchTypeChanged', type);
						if(type !== 'Map') {
							_cancelDraw();
						} else {
							$scope.selectDrawingTool(event, $scope.toolType);
						}
					}
				};

				var searchControls = L.control();

				$scope.addDrawingTool = function() {
					searchControls.setPosition('topleft');
					searchControls.onAdd = function () {
						return $compile($(mapCustomControls.getDrawingToolTemplate()))($scope)[0];
					};
				};

				$scope.addDrawingTool();

				var clickTime;
				$scope.toggleDrawingOption = function($event) {
					clickTime = (new Date());
					$event.preventDefault();
					$event.stopPropagation();
					$scope.releaseDrawingOption($event);
					return false;
				};

				$scope.releaseDrawingOption = function($event) {
					var newTime = (new Date());

					$event.preventDefault();
					$event.stopPropagation();

					if (angular.isDefined(clickTime) || clickTime.getSeconds() !== newTime.getSeconds()) {
						_cancelDraw();
						$scope.showDrawingTools = true;
					} else {
						$scope.selectDrawingTool($event, $scope.toolType);
					}

					return false;
				};

				function currentColor() {
					return mapUtil.currentColor($scope.selectedDrawingType);
				}

				$scope.toggleDrawingTools = function(show) {
					if(_timer) {
						$timeout.cancel(_timer);
					}
					if (show === false) {
						_timer = $timeout(function() {
							$scope.showDrawingTools = false;
						}, 1000);
					} else {
						$scope.showDrawingTools = true;
					}
				};

				$scope.selectDrawingTool = function($event, toolType) {
					$event.preventDefault();

					$scope.toolType = toolType;
					$scope.showDrawingTools = false;

					if($scope._drawing) {
						_cancelDraw();
					}

					$scope._drawing = true;
					_createShape(currentColor());
				};

				var _map;
				var markerIcon = L.icon({
					iconUrl: 'assets/img/marker-icon.png',
					iconSize: [14, 14]
				});

				leafletData.getMap('search-map').then(function (map){
					_map = map;

					map.on('draw:created', function (e) {
						_searchBoundary = e;
					});

					_mapEvents(map);
				});


				function _createShape(color) {
					leafletData.getMap('search-map').then(function (map) {
						map.vsSearchType = $scope.selectedDrawingType;

						$timeout(function() {
							if(_drawedShape) {
								_drawedShape.disable();
							}
							if ($scope.toolType === 'polyline') {
								_drawedShape = new L.Draw.Polyline(map, {shapeOptions: _shapeOptions(color), repeatMode:true, showArea: false});
							}
							else if ($scope.toolType === 'polygon') {
								_drawedShape = new L.Draw.Polygon(map,{shapeOptions: _shapeOptions(color), repeatMode:true, showArea: true});
							}
							else if ($scope.toolType === 'point') {
								_drawedShape = new L.Draw.Marker(map,{icon: markerIcon, repeatMode:false});
							}
							else {
								_drawedShape = new L.Draw.Rectangle(map,{shapeOptions: _shapeOptions(color), repeatMode:true, showArea: false});
							}
							_drawedShape.enable();
						});
					});
				}

				function _shapeOptions(color) {
					return {color: color, fillColor: color, strokeOpacity: 0.8, fillOpacity: 0.0};
				}

				function _option() {
					var color = currentColor();
					return {color: color, weight: 4, 'stroke-color': color, 'stoke-opacity': 0.8, fill: false};
				}

				function _convertBuffer(geoJSON) {
					mapCustomControls.convertBuffer($scope.buffer, geoJSON.geometry).then(function(response){
						geoJSON.geometry = response.data;
						if (_bufferBoundaryLayer) {
							_map.removeLayer(_bufferBoundaryLayer);
						}

						_bufferBoundaryLayer = L.geoJson(geoJSON, {
						    style: {color: currentColor(), weight: 0, fill: true, opacity: 0.8}
						}).addTo(_map);

						$scope.search.place = mapUtil.convertToWkt(geoJSON.geometry);
						$scope.search.displayBBox = mapUtil.formatWktForDisplay($scope.search.place);

						if ($attrs.cancel === 'false') {
							$rootScope.$broadcast('bboxChangeEvent', {place: $scope.search.place});
						}
						// $scope.buffer.distance = 0;
					});
				}

				function _mapEvents(map) {

					map.on('draw:drawstop', function () {
						if (_.isEmpty(map.vsSearchType) || _searchBoundary === undefined || _remove) {
							_remove = false;
							return;
						}

						var placeType = map.vsSearchType;
						var latLngs;
						var pointInx = 0;

						if (angular.isUndefined($scope.search)) {
							$scope.search = {};
						}

						$scope.search['place.op'] = placeType;

						if (angular.isDefined(_searchBoundaryLayer)) {
							_removeLayers();
						}

						if ($scope.toolType === 'rectangle') {
							latLngs = _searchBoundary.layer.getLatLngs();
							_searchBoundaryLayer = L.rectangle(_searchBoundary.layer.getBounds(), _option());
							pointInx = 2;

							$scope._bbox = _searchBoundary.layer.getBounds().toBBoxString().replace(/,/g, ' ');
							$scope.search.displayBBox = sugar.formatBBox($scope._bbox);

						} else if ($scope.toolType === 'polyline') {
							latLngs = _searchBoundary.layer.getLatLngs();
							_searchBoundaryLayer = L.polyline(latLngs, _option());
							pointInx = 1;
						} else if ($scope.toolType === 'polygon') {
							latLngs = _searchBoundary.layer.getLatLngs();
							_searchBoundaryLayer = L.polygon(latLngs, _option());

						} else if ($scope.toolType === 'point') {
							latLngs = _searchBoundary.layer.getLatLng();
							_searchBoundaryLayer = L.marker(latLngs, {icon: markerIcon});
						}

						if ($scope.toolType !== 'rectangle') {
							$scope._bbox = mapUtil.convertToWkt(_searchBoundaryLayer);
							$scope.search.displayBBox = mapUtil.formatWktForDisplay($scope._bbox);
						}

						_searchBoundaryLayer.addTo(map);

						$scope.search.place = $scope._bbox;

						_addLayerMarkers(map, pointInx);

						$scope._drawing = false;
					});

					map.on('layeradd', function () {
						// dynamic basemaps produce image layers which overlap drawing and jeojson - force image layers behind
						if(!config.map.config.cached) {
							$('.leaflet-image-layer').css('z-index','-1');
						}
					});
				}

				function _addLayerMarkers(map, pointInx) {
					if ($scope.toolType !== 'point') {
						_addEditBufferMarker(map, _searchBoundaryLayer.getLatLngs()[pointInx]);
						_addClearBoundaryMarker(map, _searchBoundaryLayer.getLatLngs()[pointInx]);
					} else {
						_addEditBufferMarker(map, _searchBoundaryLayer.getLatLng());
						_addClearBoundaryMarker(map, _searchBoundaryLayer.getLatLng());
					}
				}


				function _addEditBufferMarker(map, pointPosition) {
					if(angular.isDefined(_editMarker) && _editMarker !== null) {
						// _editMarker.setOpacity(1.0);
						_editMarker.setLatLng(pointPosition);
					} else {
						var anchor = [0, 0];
						if ($scope.toolType === 'rectangle') {
							anchor = [-2, 2];
						} else if ($scope.toolType === 'point') {
							anchor = [0, 25];
						}

						var editIcon = L.icon({
							iconUrl: 'assets/img/icon_edit.png',
							iconSize:     [20, 20], // size of the icon
							iconAnchor:   anchor, // point of the icon which will correspond to marker's location
							popupAnchor: [-95, 160]
						});

						_editMarker = L.marker(pointPosition, {icon:editIcon, zIndexOffset: 5000}).addTo(map).bindPopup(addBufferOption());
						_editMarker.on('click', function () {
							_editMarker.openPopup();
						});
					}
				}

				function _addClearBoundaryMarker(map, pointPosition) {

					if(angular.isDefined(_closeMarker) && _closeMarker !== null) {
						// _editMarker.setOpacity(1.0);
						_closeMarker.setLatLng(pointPosition);
					} else {
						if ($attrs.cancel === 'false') {
							return;
						}

						var anchor = [-20, 0];
						if ($scope.toolType === 'rectangle') {
							anchor = [-22, 2];
						} else if ($scope.toolType === 'point') {
							anchor = [-20, 25];
						}

						var closeIcon = L.icon({
							iconUrl: 'assets/img/icon_x.png',
							iconSize:     [20, 20], // size of the icon
							iconAnchor:   anchor // point of the icon which will correspond to marker's location
						});

						_closeMarker = L.marker(pointPosition, {icon:closeIcon, zIndexOffset: 5000}).addTo(map);
						_closeMarker.on('mousedown', function () {
							_removeLayers();
							_removeMarkers();
							_remove = true;
						});
					}
				}

				$scope.bufferMeasures = [{id: 'mi', text: 'Miles'}, {id: 'km', text: 'Kilometers'}, {id: 'm', text: 'Meters'}, {id: 'ft', text: 'Feet'}, {id: 'deg', text: 'Lat/Lng Degree'}, {id: 'nmi', text: 'Nautical Miles'}];
				$scope.buffer = {measure: 'mi'};

				function _removeLayers() {
					if (angular.isDefined(_searchBoundaryLayer)) {
						_map.removeLayer(_searchBoundaryLayer);
						$scope.search.displayBBox = null;
						$scope.search.place = null;
						if (angular.isDefined(_bufferBoundaryLayer)) {
							_map.removeLayer(_bufferBoundaryLayer);
						}
					}
				}

				function _removeMarkers() {
					if (angular.isDefined(_editMarker) && _editMarker !== null) {
						_map.removeLayer(_editMarker);
						_editMarker = null;
					}
					if (angular.isDefined(_closeMarker && _closeMarker !== null)) {
						_map.removeLayer(_closeMarker);
						_closeMarker = null;
					}
				}

				function addBufferOption() {
					return $compile($(mapCustomControls.getBufferTemplate()))($scope)[0];
				}

				addBufferOption();

				$scope.addBuffer = function() {
					if (!isNaN($scope.buffer.distance)) {
						angular.element('.leaflet-popup-close-button')[0].click();
						_convertBuffer(_searchBoundaryLayer.toGeoJSON());
					}
				};

				$scope.bufferCancel = function($event) {
					$event.preventDefault();
					$scope.buffer = {measure: 'mi'};
					angular.element('.leaflet-popup-close-button')[0].click();
				};

				var mapTypeToggleControls = L.control();
				mapTypeToggleControls.setPosition('topleft');
				mapTypeToggleControls.onAdd = function () {
					var template = '<div class="leaflet-map-toggle-section"><div class="leaflet-bar">';
					template += '<a ng-click="toggleDisplayFormat(\'Place\', $event)" id="searchByPlace" class="selected" title="Search by place"><span class="icon-place_search"></span></a>';
					template += '<a ng-click="toggleDisplayFormat(\'Map\', $event)" id="searchByMap" title="Search by map"><span class="icon-search_map"></span></a>';
					template += '</div>';
					template += '</div>';

					return $compile($(template))($scope)[0];
				};

				if($attrs.resize !== 'false') {
					$scope.sizeIcon = 'glyphicon-resize-full';

					var sizeControl = L.control();
					sizeControl.setPosition('bottomright');
					sizeControl.onAdd = function () {

						var template = '<div class="leaflet-bar leaflet-draw-toolbar">';
						template += '<a class="voyager-default-extent" target="_self" ng-click="resize()" title="Resize" style="cursor: pointer"><span class="glyphicon {{sizeIcon}}"></span></a>';
						template += '</div>';

						return $compile($(template))($scope)[0];
					};
					$scope.controls.custom.push(sizeControl);
				}

				$scope.addMapSizeToggleControl = function() {

					var mapSizeControl = L.control();

					mapSizeControl.setPosition('bottomright');
					mapSizeControl.onAdd = function () {
						return $compile(getMapSizeTemplate())($scope)[0];
					};

					$scope.controls.custom.push(mapSizeControl);
				};

				// @TODO where does map spinner go?  When adding map service layer etc
				//var spinControl = L.control();
				//spinControl.setPosition('topright');
				//spinControl.onAdd = function () {
				//	var template = '<div class="leaflet-bar leaflet-draw-toolbar">';
				//	template += '<span us-spinner="{top:\'0px\',left:\'-5px\',radius:4, width:3, length: 5}" spinner-key="map-spinner"></span>';
				//	template += '</div>';
				//	return $compile($(template))($scope)[0];
				//};

				// @TODO: add search on map move feature
				// var moveMapOption = L.control();
				// moveMapOption.setPosition('bottomleft');
				// moveMapOption.onAdd = function () {
				// 	var template = '<div class="leaflet-bar leaflet-draw-toolbar move-map-option">';
				// 	template += '<label ng-dblClick="preventDoubleClick($event)"><input type="checkbox" ng-model="moveMapOption.value" />Search when I move map</label>';
				// 	template += '</div>';
				// 	return $compile($(template))($scope)[0];
				// };
				//$scope.controls.custom.push(moveMapOption);

				if ($attrs.control) {
					$scope.addMapSizeToggleControl();
				}

				if ($scope.displayFormat) {
					$scope.controls.custom.push(mapTypeToggleControls);
				}

				$scope.controls.custom.push(mapControls.getZoomControls($scope));
				$scope.controls.custom.push(searchControls);
				//$scope.controls.custom.push(spinControl);

				// comment out click event that allows user to switch to map view by clicking anywhere on the map
				$element.on('click', function(e){
					if (angular.isDefined($scope.displayFormat) && $element.hasClass('dragging_disabled')) {
						$scope.toggleDisplayFormat('Map',e);
						$scope.$apply();
					}
				});

				$element.on('keydown', function(e){
					if(e.keyCode === 27) {
						_cancelDraw();
					}
				});

				$scope.$watch('displayFormat', function(){
					if (angular.isDefined($scope.displayFormat)) {
						toggleMapMode($element, $scope, leafletData);
					}
				});

				$scope.$watch('view', function(view){
					_cancelDraw();
					leafletData.getMap('search-map').then(function (map) {
						// TODO - limit zoom on table view?  Map is big there too
						if(view === 'map') {
							map.options.minZoom = 2;  //keep from zooming out too far when the map is big
						} else {
							map.options.minZoom = 1;
						}
						//have to wait for angular to refresh scope
						$timeout(function () {  //workaround for leaflet bug:  https://github.com/Leaflet/Leaflet/issues/2021
							map.invalidateSize();  //workaround when initially hidden
							// console.log('view change - moving');
							if(angular.isUndefined(map.currentBounds) && angular.isUndefined(searchViewService.getUserView()) && $attrs.origin !== 'home') {
								$scope.resizeMap();
							}
							// adjust layers control placement if table view is showing map size toggle control
							if (view === 'table') {
								$('.leaflet-control-layers-toggle').parent().parent().addClass('leaflet-bottom-search');
							} else {
								$('.leaflet-control-layers-toggle').parent().parent().removeClass('leaflet-bottom-search');
							}
						}, 200);
					});
				});

		        $scope.switchMap = function(size) {
		            $scope.$emit('mapSizeChanged', size);
		        };

		        $scope.toggleMapSizeDropDown = function() {
		            var dropDownEl = angular.element('.map-size-drop-down');

		            if (!dropDownEl.hasClass('opened')) {
		                dropDownEl.addClass('hover_flyout bottom opened');
		            } else {
		                dropDownEl.removeClass('hover_flyout bottom opened');
		            }
		        };

				$scope.preventDoubleClick = function(event) {
					event.stopPropagation();
				};

				$scope.cancelDraw = function(event) {
					_cancelDraw();
					event.preventDefault();
					$('.voyager-pan').addClass('selected').parents('.leaflet-control').siblings().find('a').not('#searchByMap').removeClass('selected');
				};

				$scope.resize = function() {
					var zoom = 10;
					if ($scope.sizeIcon === 'glyphicon-resize-full') {
						$scope.sizeIcon = 'glyphicon-resize-small';
						zoom = 2;
					} else {
						$scope.sizeIcon = 'glyphicon-resize-full';
					}

					$scope.toggleMap();
					leafletData.getMap('search-map').then(function (map) {
						//have to wait for angular to refresh scope
						$timeout(function () {  //workaround for leaflet bug:  https://github.com/Leaflet/Leaflet/issues/2021
							map.invalidateSize();  //workaround when initially hidden
							if(angular.isDefined(map.currentBounds)) {
								//map.fitBounds(map.currentBounds);
							} else {
								map.setZoom(zoom);
							}
						}, 200);
					});
				};

				$scope.resizeMap = function(isFull) {
					leafletData.getMap('search-map').then(function (map) {
						if (!map.currentBounds) {
							var ratio;
							$timeout(function() {
								if (isFull) {
									ratio = (windowEl.innerHeight() - 85) / 256;
								} else {
									ratio = $element.outerHeight() / 256;
								}

								var emptySpace = Math.ceil(ratio - Math.floor(ratio)) + 1;
								if (emptySpace > 0) {
									// TODO - zooming to try and fill in empty space?
									// this is problematic since the config defines the extent and zoom and this will ignore that
									//map.setZoom(emptySpace);
								}

								if (isFull) {
									$timeout(function() {
										map.invalidateSize();
									}, 200);
								}
							}, 200);
						} else {
							map.invalidateSize();
						}
					});
				};

				//windowEl.bind('resize', $scope.resizeMap);
				$scope.$on('$destory', function(){
					_unbindResize();
				});
			}
		};
	});