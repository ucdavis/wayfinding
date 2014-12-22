'ust strict';

if (console.debug === undefined) {
	console.debug = console.log;
}

var jsdom = require('jsdom');//,
	// fs = require('fs');

jsdom.defaultDocumentFeatures = {
	FetchExternalResources: ['script'],
	ProcessExternalResources: ['script'],
	MutationEvents: '2.0',
	QuerySelector: false
};

require('json');

var maps = [
	{'path': 'http://localhost:9000/test/fixtures/demo_map_1.svg', 'id': 'floor1'},
	{'path': 'http://localhost:9000/test/fixtures/demo_map_1.svg', 'id': 'floor2'}
];

// var processed = 0;

console.debug('Loading SVGs ...');

jsdom.env(
	'<!doctype html>' +
	'<html><head><title>Check Map</title></head><body>' +
	'<div id="myMaps"></div>' +
	'</body</html>',
	['http://code.jquery.com/jquery.js', '../src/wayfinding.datastore.js', '../src/jquery.wayfinding.js'],
	function (errors, window) {
		'use strict';
		if (errors) {
			console.log(errors);
			return;
		}
		console.log(window.$('div').length);
		window.$('#myMaps').wayfinding({
			'maps': maps,
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
		}, function(){
			console.log('callback reached');
			console.log(window.$('svg').length);
			console.log(window.$('div').length);
			console.log(window.$('div').text());
		});
	}
);

// Load SVGs
// $.each(maps, function (i, map) {
// 	var svgDiv = $('<div id="' + map.id + '"><\/div>');

// 	fs.readFile(map.path, 'utf8', function (err, data) {
// 		if (err) {
// 			return console.log(err);
// 		}

// 		maps[i].svgHandle = data;
// 		maps[i].el = svgDiv;

// 		svgDiv.append(data);

// 		processed = processed + 1;

// 		if(processed === maps.length) {
// 			var rooms = WayfindingDataStore.getRooms(maps);
// 			var randomRoom = rooms[Math.floor(Math.random() * rooms.length)];

// 			console.log('Rooms: ' + WayfindingDataStore.countRooms(maps));
// 			console.log('Doors: ' + WayfindingDataStore.countDoors(maps));
// 			console.log('Paths: ' + WayfindingDataStore.countPaths(maps));

// 			console.log('Using randomly choosen room ' + randomRoom + ' as the starting point.');
// 			console.log('Be aware that the randomly choosen room could itself be disconnected from the map. Recommended to run the script a few times and only consider common results.');

// 			var dataStore = WayfindingDataStore.build(randomRoom, maps);

// 			console.log(WayfindingDataStore.checkMaps(maps, randomRoom));
// 		}
// 	});
// });
