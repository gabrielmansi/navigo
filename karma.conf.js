// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function(config) {
    config.set({
        // base path, that will be used to resolve files and exclude
        basePath: '',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks: ['jasmine', 'sinon'],

        // list of files / patterns to load in the browser
        files: [
            'app/bower_components/querystring/querystring.js',
            'app/bower_components/jquery/jquery.js',
            'app/bower_components/angular/angular.js',
            'app/bower_components/angulartics/dist/angulartics.min.js',
            'app/bower_components/angulartics/dist/angulartics-ga.min.js',
            'app/bower_components/angular-rangeslider/angular.rangeSlider.js',
            'app/bower_components/angular-mocks/angular-mocks.js',
            'app/bower_components/angular-resource/angular-resource.js',
            'app/bower_components/angular-cookies/angular-cookies.js',
            'app/bower_components/angular-sanitize/angular-sanitize.js',
            'app/bower_components/angular-route/angular-route.js',
            'app/bower_components/angular-local-storage/dist/angular-local-storage.min.js',
            'app/bower_components/angular-translate/angular-translate.js',
            'app/bower_components/angular-dialog-service/dist/dialogs.min.js',
            'app/bower_components/angular-dialog-service/dist/dialogs-default-translations.min.js',
            'app/bower_components/spin.js/spin.js',
            'app/bower_components/ng-sortable/dist/ng-sortable.js',
            'app/bower_components/spin.js/jquery.spin.js',
            'app/bower_components/angular-spinner/angular-spinner.js',
            'app/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
            'app/bower_components/lodash/dist/lodash.js',
            'app/bower_components/lodash-brass/dist/lodash-contrib.js',
            'app/bower_components/underscore.string/dist/underscore.string.min.js',
            'app/bower_components/angular-grid/build/ng-grid.js',
            'app/bower_components/ng-table/ng-table.min.js',
            'app/lib/ng_table/ng-table-resizable-columns.src.js',
            'app/bower_components/angular-ui-router/release/angular-ui-router.js',
            'app/bower_components/select2/select2.js',
            'app/bower_components/angular-ui-select2/src/select2.js',
            'app/bower_components/angular-aria/angular-aria.js',
            'app/bower_components/leaflet/dist/leaflet.js',
            'app/bower_components/leaflet/dist/leaflet-src.js',
            'app/bower_components/leaflet.draw/dist/leaflet.draw.js',
            'app/bower_components/angular-leaflet-directive/dist/angular-leaflet-directive.min.js',
            'app/bower_components/leaflet.markercluster/dist/leaflet.markercluster.js',
            'app/bower_components/angular-block-ui/dist/angular-block-ui.min.js',
            'app/bower_components/angular-slider/slider.js',
            'app/bower_components/marked/lib/marked.js',
            'app/bower_components/angular-marked/angular-marked.min.js',
            'app/lib/leaflet/wicket.js',
            'app/lib/leaflet/wicket-leaflet.js',
            'app/lib/tree/*.js',
            'app/config.js',
            'app/bower_components/voyager-ui-toolkit/dist/vs.toolkit.min.js',
            'app/common/**/*module.js',
            'app/common/**/*.js',
            'app/src/**/*module.js',
            'app/src/**/*.js',
            //'app/scripts/*.js',
            //'app/scripts/**/*.js',
            'test/mock/**/*.js',
            'test/spec/**/*.js',
            'app/src/**/*.html',
            'app/common/**/*.html'
        ],

        // list of files / patterns to exclude
        exclude: ['app/src/initializer.js'],

        //plugins: ['karma-threshold-reporter'],

        // coverage reporter generates the coverage
        reporters: ['progress', 'coverage', 'threshold'],

        thresholdReporter: {
            statements: 90,
            branches: 60,
            functions: 70,
            lines: 80
        },
        // web server port
        //port: 8080,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: ['Chrome'],


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true,

        preprocessors: {
            '**/**/*.html': 'ng-html2js',
            'app/src/**/*.js': ['coverage']
        },

        ngHtml2JsPreprocessor: {
            // setting this option will create only a single module that contains templates
            // from all the files, so you can load them all with module('foo')
            stripPrefix: 'app/',
            moduleName: 'templates'
        },

        coverageReporter: {
            reporters:[
                {type: 'html', dir:'test/coverage/', subdir: 'html-report'},
                {type: 'cobertura', dir:'test/coverage/', subdir: 'cobertura-report'},
                {type: 'json', dir: 'test/coverage/', subdir: 'threshold'}
            ]
        },

        //junitReporter: {
        //    outputDir: 'reports', // results will be saved as $outputDir/$browserName.xml
        //    outputFile: 'test-results.xml', // if included, results will be saved as $outputDir/$browserName/$outputFile
        //    suite: '', // suite will become the package name attribute in xml testsuite element
        //    useBrowserName: false, // add browser name to report and classes names
        //    nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
        //    classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
        //    properties: {} // key value pair of properties to add to the <properties> section of the report
        //},

        client: {
            captureConsole: true
        },

        browserDisconnectTimeout: 5000,
        browserNoActivityTimeout: 30000,
        browserDisconnectTolerance: 10
    });
};
