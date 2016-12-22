'use strict';

// Watches files for changes and runs tasks based on the changed files
module.exports = {
	js: {
		files: ['<%= yeoman.app %>/src/{,*/}*.js',
			'<%= yeoman.app %>/common/{,*/}*.js',
			'<%= yeoman.app %>/common/{,*/}*.ts',
			'<%= yeoman.app %>/src/{,*/}*.ts',
			'<%= yeoman.app %>/src/{,*/}*.html'],
		tasks: ['ts:dev', 'newer:jshint:all'],
		options: {
			livereload: true
		}
	},
	jsTest: {
		files: ['test/spec/{,*/}*.js'],
		tasks: ['newer:jshint:test', 'karma']
	},
	compass: {
		files: ['<%= yeoman.app %>/styles/{,**/}*.{scss,sass}'],
		tasks: ['compass:server', 'autoprefixer']
	},
	gruntfile: {
		files: ['Gruntfile.js']
	}
};