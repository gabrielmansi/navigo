// Note: when running in Voyager, this static file is partially overwritten with voyager config settings
/* jshint ignore:start */
var config = {
    'root': 'http://voyagerdemo.com/daily/',
    //'root': 'http://voyagerdemo.com/198/',
    //'root': 'http://localhost:8888/',
    'explorePath': 'voyager',
    'enableEmail': true,
    'title' : 'Voyager Search',
    'configid': 'default',
    'require':{
        'fields':'api/rest/i18n/fields/standard.json',
        'fileFormats':'api/rest/i18n/field/format.json',
        'locations':'api/rest/i18n/field/location.json'
    },
    'rawFields': {
        'fileExtension':true,
        'src':true
    },
    'mapDefault': {'lat': 0, 'lng': 0, 'zoom': 0},
    demo:false,
    arcGisRoot:'//sampleserver1.arcgisonline.com/ArcGIS/',
    metadataStyle:'FGDC Classic',
    'map': {
        'type': 'ArcGISLayerDefinition',
        'config': {
            'name': 'ESRI Street Map',
            'url': 'http://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/',
            'cached': true,
            'selected': true,
            'defaultView': '-98, 40.5, 3'
        }
    },
    mapApp:'http://www.arcgis.com/home/webmap/viewer.html',
    markerLimit:10001,
    proxy:'http://localhost:8888/proxy/jsonp/',
    docActions: [
        {text:'Add to Cart', action:'add', visible:'canCart', toggle:'inCart', off:'Remove', onIcon:'icon-plus', offIcon:'icon-x', offListIcon:'fa fa-shopping-cart', offList:'Remove from Cart'},
        {text:'Download', action:'download', visible:'hasDownload', alt:'Open'},
        {text:'Open in Map Viewer', action:'open', visible:'isService', url:'http://voyagerdemo.com/voyagerwidget/'},
        {text:'Open in ArcMap', action:'openArcMap', visible:'isEsriLayer'}
    ],
    docLink: {text:'Preview', action:'preview', visible:'isService'},
    //analyticsId: 'UA-56933647-1',
    analyticsId: '',
    analyticsUrl: 'http://voyagerdemo.com/log/message',
    ui: {
        details:{
            map:{text:'Preview',icon:'glyphicon glyphicon-globe'},
            add:{text:'Add to Cart',icon:'glyphicon glyphicon-list'}
        },
        navbar: {
            add:{text:'Cart',icon:'icon-card_list'}
        },
        list: {
            name:'Cart'
        }
    },
    "homepage": {
        "showHomepage":true,
        "showPlaceQuery": true,
        "wrapMap": true,
        "featuredContentTitle": "Featured",
        "showSidebarLinks": true,
        "sidebarLinksTitle": "Collections",
        "sidebarLinksLabel": "Featured",
        "footerHTML": "&copy; 2015 Voyager Search"
        //"bannerHTML": "<h3 class=\"banner\" style=\"line-height: 40px; background-color: green; color: white; height: 20px; margin: 0px;\">BANNER<\/h3>"
    },
    defaultTask:'',
    ecobar: false,
    bulkLimit:250,
    "searchMap": {
       "footprintColor": "#0000ff",
        "footprintWidth": 5,
        "heatmapColor1": "#00FF00",
        "heatmapColor2": "#FF0000",
        "heatmapOpacity": 0.75,
        "heatmapBlurRadius": 4
    },
    excludeDetails : ['_', 'allow_', 'deny_', 'http_header', 'tree', 'links', 'geo', 'path_to_', 'debug_properties', 'linkcount_', 'hasThumb', 'hasPreview', 'hasMetadata', 'md5', 'worker', 'extractor', 'hasLayerFile', 'id', 'extent', 'root', 'indexing_warning'],
    chartData: 'http://voyagerdemo.com/sql/solr/v0/select?q=*:*&fl=name,meta_Field_Name,meta_Operator,meta_Producing,fl_Well_Depth,meta_Well_Statu,%20meta_Well_Type&wt=json&rows=1000&json.wrf=JSON_CALLBACK',
    rememberMe: true,
    editAll: false
};
/* jshint ignore:end */