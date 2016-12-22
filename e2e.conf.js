var HtmlScreenshotReporter = require('protractor-jasmine2-screenshot-reporter');

var reporter = new HtmlScreenshotReporter({
    dest: './reports/protractor',
    reportTitle: 'Navigo Reporter',
    filename: 'navigo-reports.html'
});

exports.config = {

    //seleniumAddress: 'http://localhost:4444/wd/hub',
	
	//directConnect: true,

    // Capabilities to be passed to the webdriver instance.
    capabilities: {
        'browserName': 'chrome',
        chromeOptions: {
            args: ['--lang=en',
                '--window-size=1920,1080'
            ]
        }
    },

    // Spec patterns are relative to the current working directly when
    // protractor is called.
    specs: ['test/e2e/*/*'],

    // Setup the report before any tests start
    beforeLaunch: function() {
        return new Promise(function(resolve){
            reporter.beforeLaunch(resolve);
        });
    },

    onPrepare: function() {
        jasmine.getEnv().addReporter(reporter);
    },

    afterLaunch: function(exitCode) {
        return new Promise(function(resolve){
            reporter.afterLaunch(resolve.bind(this, exitCode));
        });
    },

    // Options to be passed to Jasmine-node.
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        includeStackTrace: true,
        isVerbose: true
    },

    allScriptsTimeout: 50000,

    verbose:true,

    debug:true
};