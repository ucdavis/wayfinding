/*global $*/

'use strict';

var fs = require('fs'),
	phantom = require('phantom'),
	questions = require('prompt'),
	selectionquestions = [
		{
			name: 'serverURL',
			message: 'server'.grey + ':'.white,
			'default': 'http://localhost:9000/test/fixtures/datastores.html'
		},
		{
			name: 'doorSelection',
			message: 'Process (all or filename)'.grey + ':'.white,
			'default': 'test\\fixtures\\start.txt'
		},
		{
			name: 'destination',
			message: 'path where .JSON files should be saved'.grey + ':'.white,
			'default': 'test\\fixtures\\datastores'
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
			page.set('onConsoleMessage', function () {
				page.evaluate(
					function() {
						// return JSON
						return $('#myMaps').wayfinding('getDataStore');
					},
					function(result) {
						//write resulting JSON to appropriate file
						fs.writeFile(destination + door + ((acc) ? '.acc' : '') + '.JSON', result, function(err) {
							if (err) {
								next(report, 'ERROR creating ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
							} else {
								next(report, 'successfully wrote ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
							}
						});
						ph.exit();
					}
				);
			});
			page.open(serverURL + '?d=' + door + '&a=' + acc, function(status) {
				if (status !== 'success') {
					console.log('unable to open datastore page');
				}
			});
		});
	});
}


function processDoors() {
	var actions = [];
	doors = doors.sort();
	doors.map(function(door) {
		actions.push([getDataStore, door, false]);
		actions.push([getDataStore, door, true]);
	});
	next(actions);
}

function getDoors() {
	phantom.create(function (ph) {
		ph.createPage(function(allpage) {
			allpage.set('onConsoleMessage', function () {
				allpage.evaluate(
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
						doors = result;
						next([
							[processDoors],
							[report, 'end'],
							[process.exit, '0']
						]);
						ph.exit();
					}
				);
			});
			allpage.open(serverURL, function(status) {
				if (status !== 'success') {
					console.log('unable to open server to get door list');
				}
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
