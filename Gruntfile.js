'use strict';

module.exports = function (grunt) {
	// Load all grunt tasks
	require('load-grunt-tasks')(grunt, {pattern: ['grunt-*', '!grunt-build-lifecycle']});
	// Show elapsed time at the end
	require('time-grunt')(grunt);

	// Project configuration.
	grunt.initConfig({
		// Project settings
		config: {
			// Configurable paths
			dev: 'src',
			dist: 'dist',
			temp: '.tmp'
		},
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			'<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
			'* Copyright (c) <%= grunt.template.today("yyyy") %> Regents of the University of California' +
			' Licensed MIT */\n',
		// Task configuration.
		lifecycle: { // need to build out
			// Lint Step
			// js hint all js
			// lint the css?
			// leaning toward the client and admin being separate files in dist as such concat not needed
			// clean
			// test
			// uglify
			// plato?
			// open plato and coverage?
			// separate from lifecycle build task for taking a group of maps and building caches
			// separate from lifecycle support watch and serve
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish')
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			scripts: {
				src: ['src/**/*.js']
			},
			test: {
				src: ['test/**/*-test.js']
			}
		},
		clean: {
			files: ['dist', 'test/coverage', 'test/report']
		},
		concat: {
			options: {
				banner: '<%= banner %>',
				stripBanners: true
			},
			dist: {
				src: ['src/**/*.js'],
				dest: 'dist/jquery.<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				src: ['src/**/*.js'],
				dest: 'dist/jquery.<%= pkg.name %>.min.js'
			}
		},
		connect: {
			server: {
				options: {
					hostname: 'localhost',
					port: 9000,
					livereload: true
				}
			}
		},
		karma: {
			options: {
				configFile: 'karma.conf.js'
			},
			unit: {
				background: true
			},
			report: {
				singleRun: true,
				browsers: ['Chrome'],
				reporters: ['progress', 'html', 'coverage']
			}
		},
		watch: {
			options: {
				livereload: true
			},
			html: {
				files: ['index.html']
			},
			styles: {
				files: ['styles/**/*.css']
			},
			karma: {
				files: ['src/**/*.js', 'test/**/*-test.js'],
				tasks: ['karma:unit:run']
			}
		}
	});

	// Making grunt default to force so it won't die on jshint warnings
	grunt.option('force', true);

	grunt.loadNpmTasks('grunt-build-lifecycle');

	// Default task.
	grunt.registerTask('default', ['clean', 'jshint', 'karma:unit', 'server']);
	grunt.registerTask('server', ['connect', 'watch']);
	grunt.registerTask('report', ['clean', 'jshint', 'karma:report']);
	grunt.registerTask('release', ['clean', 'jshint', 'concat', 'uglify']);
};
