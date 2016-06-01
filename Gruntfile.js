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
			app: '.',
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
			'bowerSetup': [
				'bowerInstall'
			],
			// Lint Step
			'validate': [
				'jshint',
				'eslint'
			],
			// C++ compilation step
			'build': [
				'shell:makeClean',
				'shell:compileEmscripten'
			],
			'test': [ // run all tests
				'connect:test',
				'karma:unit'
			],
			'package': [
				'clean',
				'uglify',
				'shell:emscriptenPathfinding',
				'shell:priorityQueue'
			],
			'document': [
				'jsdoc'
			],
			'open-docs': [
				'open:docs',
				//'open:coverage'
			],
			'benchmark': [ // separate from document as it adds a milestone each time
				'plato',
				'open:plato'
			]
			// separate from lifecycle build task for taking a group of maps and building caches
			// separate from lifecycle support watch and serve
		},
		bowerInstall: { // Automatically inject Bower components into the HTML file https://github.com/stephenplusplus/grunt-bower-install
			target: {
				// Point to the files that should be updated when
				// you run `grunt bower-install`
				src: [
					'<%= config.app %>/index.html' // .html support...
				],

				// Optional:
				// ---------
				cwd: '',
				dependencies: true,
				devDependencies: false,
				exclude: [
					/jquery/,
					/modernizr/
				],
				fileTypes: {},
				ignorePath: ''
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish'),
                ignores: [
                    'src/**/emscripten.pathfinding.js',
                    'src/**/priority-queue.min.js'
                ]
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
		eslint: {
			options: {
				config: 'eslint.json',
				format: 'stylish',
			},
			target: [
				'<%= config.app %>/src/{,*/}*.js',
				'test/spec/{,*/}*.js'
			]
		},
		clean: {
			files: ['dist', 'test/coverage', 'test/report']
		},
		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				src: [
                    'src/**/*.js',
                    '!src/**/emscripten.pathfinding.js',
                    '!src/**/priority-queue.js'
                ],
				dest: 'dist/jquery.<%= pkg.name %>.min.js'
			}
		},
		connect: {
			options: {
				port: 9000,
				livereload: 35729,
				// Change this to '0.0.0.0' to access the server from outside
				hostname: 'localhost'
			},
			livereload: {
				options: {
					open: true,
					base: [
						'.tmp',
						'<%= config.app %>'
					]
				}
			},
			test: {
				options: {
					port: 9001,
					base: [
						'test'
					]
				}
			},
			datastore: {
				options: {
					livereload: false,
					open: false,
					base: [
						'.tmp',
						'<%= config.app %>'
					]
				}
			},
			dist: {
				options: {
					open: true,
					base: '<%= config.dist %>',
					livereload: false
				}
			}
		},
		karma: {
			options: {
				configFile: 'karma.conf.js'
			},
			unit: {
				singleRun: true,
				browsers: ['PhantomJS'],
				reporters: ['progress']
			},
			report: {
				singleRun: true,
				browsers: ['Chrome'],
				reporters: ['progress', 'html', 'coverage']
			}
		},
		jsdoc: {
			dist: {
				// Force usage of JSDoc 3.3.0
				jsdoc: './node_modules/.bin/jsdoc',
				// The rest of your configuration.
				src: [
					'<%= config.app %>/src/**/*.js',
					'README.md',
                    '!src/**/emscripten.pathfinding.js',
                    '!src/**/priority-queue.min.js'
				],
				options: {
					destination: 'docs/',
					template: 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template',
					configure: 'node_modules/grunt-jsdoc/node_modules/ink-docstrap/template/jsdoc.conf.json'
				}
			}
		},
		plato: {
			all: {
				options: {
					jshint: grunt.file.readJSON('.jshintrc'),
					complexity: {
						logicalor: false,
						switchcase: false,
						forin: true,
						trycatch: true
					},
					exclude: /\.min\.js$/ // excludes source files finishing with ".min.js"
				},
				files: {
					'plato': [
						'<%= config.dev %>/{,*/}*.js',
						'!<%= config.dev %>/{,*/}emscripten.pathfinding.js',
						'!<%= config.dev %>/{,*/}priority-queue.min.js'
					]
				}
			}
		},
		open: {
			server: {
				path: 'http://localhost:<%= connect.options.port %>'
			},
			plato: {
				file: 'plato/index.html'
			},
			coverage: { // grab the latest Chrome coverage report, currently bug that only covers last browser to finish
				path: function () {
					var reports = grunt.file.expand('coverage/Chrome*/index.html');
					return reports[reports.length - 1].toString();
				}
			},
			docs: {
				file: 'docs/index.html'
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
		},
		shell: {
			datastore: {
				command: 'node tasks/datastores.js',
				options: {
					execOptions: {
						cwd: '.'
					}
				}
			},
			emscriptenPathfinding: {
				command: 'cp src/emscripten.pathfinding.js dist/',
				options: {
					execOptions: {
						cwd: '.'
					}
				}
			},
			priorityQueue: {
				command: 'cp src/priority-queue.min.js dist/',
				options: {
					execOptions: {
						cwd: '.'
					}
				}
			},
			makeClean: {
				command: 'make clean',
				options: {
					execOptions: {
						cwd: '.'
					}
				}
			},
			compileEmscripten: {
				command: 'make',
				options: {
					execOptions: {
						cwd: '.'
					}
				}
			}
		}
	});

	// Making grunt default to force so it won't die on jshint warnings
	// grunt.option('force', true);

	grunt.loadNpmTasks('grunt-build-lifecycle');

	// Default task.
	grunt.registerTask('default', ['package']);
	grunt.registerTask('server', ['connect:livereload', 'watch']);
	grunt.registerTask('datastore', ['connect:datastore', 'shell:datastore']);
};
