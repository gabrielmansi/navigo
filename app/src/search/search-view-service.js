'use strict';
angular.module('voyager.search').
	factory('searchViewService', function () {

	var _view;
	var _viewChanged = false;
	var _mapView;

	return {
		getPageClass: function(filterVisible, view, showMap, searchError, resultError) {
			var viewChanged = angular.isUndefined(_view) ?  false: _view !== view;
			if (viewChanged) {
				_viewChanged = true;
			}
			_view = view;
			var isMapFilterVisible = filterVisible && (view === 'map');
			var page = {};
			page.listViewClass = '';

			if (!showMap) {
				page.mapWrapperClass = 'tab_center';
				page.mapContentClass = 'col-lg-12 col-md-12 no_float';
				page.headerClass = 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no_float';
			} else if (view === 'card' || view === 'list') {
				page.mapContentClass = 'col-lg-8 col-md-8 col-sm-8 col-xs-6 col-lg-push-4 col-md-push-4 col-sm-push-4 col-xs-push-6 no_float';
				page.headerClass = 'col-lg-8 col-md-8 col-sm-12 col-xs-12';

				if (page.filterVisible) {
					page.mapWrapperClass = 'map_fixed col-lg-4 col-md-4 col-sm-4 col-xs-6 filter_opened';
				} else {
					page.mapWrapperClass = 'map_fixed col-lg-4 col-md-4 col-sm-4 col-xs-6';
				}
			} else if (view === 'table') {
				page.mapContentClass = 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no_float';
				page.headerClass = 'col-lg-12 col-md-12 col-sm-12 col-xs-12';

				if (filterVisible) {
					page.mapWrapperClass = 'map_fixed tab_center filter_opened';
				} else {
					page.mapWrapperClass = 'map_fixed tab_center col-lg-12 col-md-12 col-sm-12 col-xs-12';
				}
			} else {
				if (isMapFilterVisible) {
					page.mapWrapperClass = 'map_fixed col-lg-6 col-md-6 col-sm-5 col-xs-5 filter_opened';
					page.mapContentClass = 'map_view_content col-lg-6 col-md-6 col-sm-7 col-xs-7 col-lg-push-6 col-md-push-6 col-sm-push-5 col-xs-push-5';
					page.headerClass = 'col-lg-6 col-md-6 col-sm-12 col-xs-12';
				} else {
					page.mapWrapperClass = 'map_fixed col-lg-8 col-md-8 col-sm-6 col-xs-6';
					page.mapContentClass = 'map_view_content col-lg-4 col-md-4 col-sm-6 col-xs-6 col-lg-push-8 col-md-push-8 col-sm-push-6 col-xs-push-6';
					page.headerClass = 'col-lg-4 col-md-4 col-sm-12 col-xs-12';
					page.listViewClass = 'alt_list_view';
				}
			}

			if (searchError || resultError) {
				page.mapContentClass += ' extra_height';
			}

			return page;
		},

		changeMapSize: function(mapSize) {
			if(mapSize === 'small-map') {
				return {
					bigMap: true,
					mapClass: 'col-sm-12',
					mapSize: 'big-map'
				};
			}

			return {
				bigMap: false,
				mapClass: 'col-md-4 col-sm-5 col-lg-3 col-xs-5',
				mapSize:'small-map'
			};
		},

		viewChanged: function() {
			return _viewChanged;
		},

		setViewChanged: function(viewChanged) {
			_viewChanged = viewChanged;
			if (viewChanged === false) {
				_mapView = undefined;
			}
		},

		setUserView: function(mapView) {
			_mapView = mapView;
		},

		getUserView: function() {
			return _mapView;
		}
	};

	});
