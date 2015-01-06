/*global document*/

'use strict';

var phantom = require('phantom');

console.log('Loading SVGs ...');

phantom.create(function (ph) {
	ph.createPage(function(page) {
		page.onConsoleMessage = function (msg, lineNum, sourceId) {
			console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
		};
		page.open('http://localhost:9000/', function(status) {
			console.log('Opened ', status);
			page.evaluate(
				function() {
					// trigger mapping with certain startpoint
					// return JSON
					return $('#myMaps').wayfinding('getDataStore');
				},
				function(result) {
					//write resulting JSON to appropriate file
					console.log('Page title is ' + result);
					ph.exit();
				}
			);
		});
	});
});
