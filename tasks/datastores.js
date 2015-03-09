/*global $*/

'use strict';

var fs = require('fs'),
	phantom = require('phantom'),
	questions = require('prompt'),
	selectionquestions = [
		{
			name: 'serverURL',
			message: 'server'.grey + ':'.white,
			'default': 'http://localhost:9000/'
		},
		{
			name: 'doorSelection',
			message: 'Process (all or filename)'.grey + ':'.white,
			'default': 'test\\fixtures\\start.txt'
		},
		{
			name: 'destination',
			message: 'path where .JSON files should be saved'.grey + ':'.white
		}
	],
	nextList = [],
	doors = [],
	serverURL,
	destination;

function next() {
	var todo,
		current,
		task,
		args = {};
	if (arguments.length > 0) {
		if (!Array.isArray(arguments['0'])) {
			todo = [arguments];
		} else {
			todo = [];
			arguments['0'].forEach(function (item) {
				todo.push(item);
			});
		}
		nextList = todo.concat(nextList);
	}
	if (nextList.length > 0) {
		current = Array.prototype.slice.apply(nextList.shift());
		task = current[0];
		args = current.slice(1);
		task.apply(null, args);
	}
}

function report(message) {
	if (typeof message === 'string') {
		console.log(message);
	} else {
		console.dir(message);
	}
	next();
}

function getDataStore(door, acc) {
	phantom.create(function (ph) {
		ph.createPage(function(page) {
			page.onConsoleMessage = function (msg, lineNum, sourceId) {
				console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
			};
			page.open(serverURL, function(status) {
				console.log('Opened ', status);
				page.evaluate(
					function(d, a) {
						// trigger mapping with certain startpoint
						// return JSON
						$('#myMaps').wayfinding('startpoint', d);
						$('#myMaps').wayfinding('accessibleRoute', a);
						return $('#myMaps').wayfinding('getDataStore');
					},
					function(result) {
						//write resulting JSON to appropriate file
						// next(report, 'Door ' + door + ' returned ' + result.substring(0, 71));
						fs.writeFile(destination + door + ((acc) ? '.acc' : '') + '.JSON', result, function(err) {
							if (err) {
								next(report, 'ERROR creating ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
							} else {
								next(report, 'successfully wrote ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
							}
						});
						ph.exit();
					}, door, acc
				);
			});
		});
	});
}

function processDoors() {
	var actions = [];
	doors.map(function(door) {
		actions.push([getDataStore, door, true]);
		actions.push([getDataStore, door, false]);
	});
	// for (var item in actions) {
	// 	if (actions.hasOwnProperty(item)) {
	// 		next(report, actions[item]);
	// 	}
	// }
	next(actions);
}

function getDoors() {
	phantom.create(function (ph) {
		ph.createPage(function(page) {
			page.onConsoleMessage = function (msg, lineNum, sourceId) {
				console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
			};
			page.open(serverURL, function(status) {
				console.log('Opened ', status);
				page.evaluate(
					function() {
						var response = [],
							id;
						$.each($('#myMaps div'), function (i, map) {
							$.each($('#Doors line', map), function(j, door) {
								// if the id isn't already in the array then add it
								id = $(door).attr('id');
								if (response.indexOf(id) === -1) {
									response.push(id);
								}
							});
						});
						return response;
					},
					function(result) {
						doors = result.sort();
						next([
							[processDoors],
							[report, 'end'],
							[process.exit, '0']
						]);
						ph.exit();
					}
				);
			});
		});
	});
}

console.log('Wayfinding dataStore generator');
questions.message = '';
questions.delimiter = '';
questions.start();

questions.get(selectionquestions, function(err, result) {
	if (!err) {
		serverURL = result.serverURL;
		destination = result.destination;
		if (destination.slice(-1) !== '\\') {
			destination += '\\';
		}
		if (result.doorSelection === 'all') {
			next([
				[report, 'start'],
				[getDoors]
			]);
		} else {
			console.log('fetch doors from', result.doorSelection);
			doors = fs.readFileSync(result.doorSelection, 'utf8').split('\n');
			next([
				[report, 'start'],
				[processDoors],
				[report, 'end'],
				[process.exit, '0']
			]);
		}
	} else {
		return 'canceled by user';
	}
});
