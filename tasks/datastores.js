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

// function waitFor(testFx, onReady, onFail, timeOutMillis) {
// 	var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000, //< Default Max Timout is 3s
// 		start = new Date().getTime(),
// 		condition = false,
// 		interval = setInterval(function() {
// 			if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
// 				// If not time-out yet and condition not yet fulfilled
// 				condition = testFx();
// 				console.log(condition);
// 			} else {
// 				if (!condition) {
// 					// If condition still not fulfilled (timeout but condition is 'false')
// 					console.log('timed out waiting');
// 					clearInterval(interval); //< Stop this interval
// 					onFail();
// 				} else {
// 					// Condition fulfilled (timeout and/or condition is 'true')
// 					console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
// 					clearInterval(interval); //< Stop this interval
// 					onReady(); //< Do what it's supposed to do once the condition is fulfilled
// 				}
// 			}
// 		}, 250); //< repeat check every 250ms
// }

// function getDataStore(door, acc) {
// 	phantom.create(function (ph) {
// 		ph.createPage(function(page) {
// 			page.onConsoleMessage = function (msg, lineNum, sourceId) {
// 				console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
// 			};
// 			page.open(serverURL + '?d=' + door + '&a=' + acc, function(status) {
// 				if (status !== 'success') {
// 					console.log('unable to open datastore page');
// 				} else {
// 					waitFor(function() {
// 						// Check in the page if a specific element is now visible
// 						return page.evaluate(function() {
// 							return $('#status').is(':visible');
// 						});
// 					}, function() {
// 						page.evaluate(
// 							function() {
// 								// trigger mapping with certain startpoint
// 								// return JSON
// 								return $('#myMaps').wayfinding('getDataStore');
// 							},
// 							function(result) {
// 								console.log('result', result);
// 								//write resulting JSON to appropriate file
// 								// next(report, 'Door ' + door + ' returned ' + result.substring(0, 71));
// 								fs.writeFile(destination + door + ((acc) ? '.acc' : '') + '.JSON', result, function(err) {
// 									if (err) {
// 										next(report, 'ERROR creating ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
// 									} else {
// 										next(report, ' successfully wrote ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
// 									}
// 								});
// 								ph.exit();
// 							}
// 						);
// 					}, function() {
// 						console.log('FAILED for', door, acc);
// 						next();
// 						ph.exit();
// 					},
// 					5000);
// 				}
// 			});
// 		});
// 	});
// }

// function getDataStore(door, acc) {
// 	phantom.create(function (ph) {
// 		ph.createPage(function(page) {
// 			page.onConsoleMessage = function (msg, lineNum, sourceId) {
// 				console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
// 			};
// 			page.open(serverURL + '?d=' + door + '&a=' + acc, function(status) {
// 				var result;
// 				if (status !== 'success') {
// 					console.log('unable to open datastore page');
// 				} else {
// 					// page.set('onCallback', function(data) {
// 					// 	console.log(data);
// 					// });

// 					result = page.evaluate(
// 						function() {
// 							// trigger mapping with certain startpoint
// 							// return $('#myMaps').wayfinding('getDataStore');

// 							return 'fred';

// 							// if (typeof window.callPhantom === 'function') {
// 							// 	var ret = $('#myMaps').wayfinding('getDataStore');
// 							// 	window.callPhantom(ret);
// 							// }

// 						});
// 					console.log('result', result);
// 					//write resulting JSON to appropriate file
// 					// next(report, 'Door ' + door + ' returned ' + result.substring(0, 71));
// 					fs.writeFile(destination + door + ((acc) ? '.acc' : '') + '.JSON', result, function(err) {
// 						if (err) {
// 							next(report, 'ERROR creating ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
// 						} else {
// 							next(report, ' successfully wrote ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
// 						}
// 					});
// 					ph.exit();
// 				}
// 			});
// 		});
// 	});
// }

function getDataStore(door, acc) {
	phantom.create(function (ph) {
		ph.createPage(function(page) {
			page.open(serverURL + '?d=' + door + '&a=' + acc, function(status) {
				if (status !== 'success') {
					console.log('unable to open datastore page');
				} else {
					page.set('onConsoleMessage', function (msg, lineNum, sourceId) {
						page.evaluate(
							function() {
								// return JSON
								return $('#myMaps').wayfinding('getDataStore');
							},
							function(result) {
								//write resulting JSON to appropriate file
								// next(report, 'Door ' + door + ' returned ' + result.substring(0, 71));
								fs.writeFile(destination + door + ((acc) ? '.acc' : '') + '.JSON', result, function(err) {
									if (err) {
										next(report, 'ERROR creating ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
									} else {
										next(report, ' successfully wrote ' + destination + door + ((acc) ? '.acc' : '') + '.JSON');
									}
								});
								ph.exit();
							}
						);
					});
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
				console.log('Reading map to get doors:', status);
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
