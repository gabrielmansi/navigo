// Generated on 2014-12-22 using generator-angular 0.7.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-config')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);


    grunt.registerTask('serve', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['connect:dist:keepalive']);
        }

        if (target === 'build') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'ts:dev',
            'clean:server',
            'compass',
            //'concurrent:server',
            'autoprefixer',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('default', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'concurrent:server',
            'autoprefixer',
            'newer:jshint',
            'watch'
        ]);
    });

    grunt.registerTask('server', function () {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve']);
    });

    grunt.registerTask('test', [
        'ts:dev',
        'clean:server',
        'newer:jshint',
        'concurrent:test',
        'autoprefixer',
        'connect:test',
        'karma:unit',
        'coverage'
    ]);

    grunt.registerTask('test-chrome', [
        'ts:dev',
        'clean:server',
        'concurrent:test',
        'autoprefixer',
        'connect:test',
        'karma:chrome'
    ]);

    grunt.registerTask('build', [
        'ts:dev',
        'clean:dist',
        'useminPrepare',
        'compass',
        'autoprefixer',
        'concat',
        'ngAnnotate:dist',
        'copy:dist',
        'cssmin',
        'uglify',
        //'rev',
        'revision',
        'regex-replace',
        'usemin',
        'htmlmin'
    ]);

    grunt.registerTask('ci', [
        'test',
        'build'
    ]);
};
