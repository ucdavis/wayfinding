'ust strict';

var phantom = require('phantom');

console.log('Loading SVGs ...');

phantom.create(function (ph) {
	ph.createPage(function(page) {
		page. onConsoleMessage = function (msg, lineNum, sourceId) {
			console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
		};
		page.open('about:blank', function(status) {
			console.log(status);
			page.includeJs('http://code.jquery.com/jquery.js', function() {
				page.injectJs('../src/wayfinding.datastore.js', function () {
					page.injectJs('../src/jquery.wayfinding.js', function () {

						// console.log('hot beef', injectState);
						// for (key in page) {
						// 	if (page.hasOwnProperty(key)) {
						// 		console.log(key);
						// 	}
						// }

		page. onConsoleMessage = function (msg, lineNum, sourceId) {
			console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
		};
						page.evaluate(function() {
							console.log('setting up div');
							$('body').append('<div id="myMaps">fred</div');
							console.log('calling wayfinding');
							$('#myMaps').wayfinding({
								'maps': [
											{'path': 'http://lcdscreens.law.ucdavis.edu/map/floor_1.svg', 'id': 'floor1'},
											{'path': 'http://lcdscreens.law.ucdavis.edu/map/floor_2.svg', 'id': 'floor2'}
										],
								'path': {
									width: 3,
									color: 'cyan',
									radius: 8,
									speed: 8
								},
								'startpoint': function () {
									return 'lcd.1';
								},
								'defaultMap': 'floor1'
							}, function() {
								console.log('callback reached');
								return $('div').text();
							});
						},
						function (result) {
							console.log(result);

							// setTimeout(ph.exit, 10000);

							// ph.exit();
							// console.log(result.a);
							// console.log(result.b);
							// console.log(result.c);
						});
						setTimeout(function() {
							page.evaluate(function(){
								return $('div').text();
							}, function(result){
								console.log(result);
								ph.exit();
							});
						}, 5000);
					});
				});
			});
		});
	});
});

// jsdom.env(
// 	'<!doctype html>' +
// 	'<html><head><title>Check Map</title></head><body>' +
// 	'<div id="myMaps"></div>' +
// 	'</body</html>',
// 	['http://code.jquery.com/jquery.js', '../src/wayfinding.datastore.js', '../src/jquery.wayfinding.js'],
// 	function (errors, window) {
// 		'use strict';
// 		if (errors) {
// 			console.log(errors);
// 			return;
// 		}
// 		console.log(window.$('div').length);
// 		window.$('#myMaps').wayfinding({
// 			'maps': maps,
// 			'path': {
// 				width: 3,
// 				color: 'cyan',
// 				radius: 8,
// 				speed: 8
// 			},
// 			'startpoint': function () {
// 				return 'lcd.1';
// 			},
// 			'defaultMap': 'floor1'
// 		}, function(){
// 			console.log('callback reached');
// 			console.log(window.$('svg').length);
// 			console.log(window.$('div').length);
// 			console.log(window.$('div').text());
// 		});
// 	}
// );
