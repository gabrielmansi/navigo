var modRewrite = require('connect-modrewrite');
var serveStatic = require('serve-static');

module.exports = {
    options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729,
        middleware: function (connect, options) {
            var optBase = (typeof options.base === 'string') ? [options.base] : options.base,
                middleware = [modRewrite(['^[^\\.]*$ /index.html [L]'])]
                    .concat(optBase.map(function (path) {
                        if (path.indexOf('rewrite|') === -1) {
                            return serveStatic(path);
                        } else {
                            path = path.replace(/\\/g, '/').split('|');
                            return  connect().use(path[1], serveStatic(path[2]));
                        }
                    }));

            return middleware;
        }
    },
    livereload: {
        options: {
            open: true,
            base: [
                '.tmp',
                'rewrite|/bower_components|./bower_components',
                'rewrite|/app/styles|./app/styles', // for sourcemaps
                '<%= yeoman.app %>'
            ]
        }
    },
    test: {
        options: {
            port: 9002,
                base: [
                '.tmp',
                'test',
                '<%= yeoman.app %>'
            ]
        }
    },
    dist: {
        options: {
            base: '<%= yeoman.dist %>'
        }
    }
};