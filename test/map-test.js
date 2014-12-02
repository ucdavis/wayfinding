/*global jasmine, beforeEach, afterEach, describe, waits, xit, it, $, expect*/

// https://github.com/velesin/jasmine-jquery
// https://github.com/velesin/jasmine-jquery/tree/support-jasmine-v2 -- we are using this version

'use strict';

var fixtures = jasmine.getFixtures();

// given relative path test/fixtures/ to karma
fixtures.fixturesPath = 'base/test/fixtures/';

describe('Wayfinding', function () {

	var $example;

	beforeEach(function (done) {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
		fixtures.load('example.html');
		$example = $('#myMaps');
		$example.wayfinding({
			'maps': [
				{'path': 'base/test/fixtures/demo_map_1.svg', 'id': 'floor1'},
				{'path': 'base/test/fixtures/demo_map_2.svg', 'id': 'floor2'}
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
		});
		setTimeout(function() {
			done();
		}, 1000);
		// waits(5000); // could implement a callback to speed this up rather than just waiting...
	});

	afterEach(function () {
		$example.wayfinding('destroy');
	});

	it('loads two maps', function () {
		expect($example.find('div').length).toEqual(2);
		expect($example.find('#floor1:visible').length).toBe(1);
	});

	it('changes startpoint', function () {
		expect($example.wayfinding('startpoint')).toEqual('lcd.1');
		$example.wayfinding('startpoint', 'lobby');
		expect($example.wayfinding('startpoint')).toEqual('lobby');
	});

	it('routes to room 101', function () {
		jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
		expect($example.find('.directionPath').length).toEqual(0);
		$example.wayfinding('routeTo', 'R101');
		expect($example).toContain('.directionPath');
		expect($example.find('.directionPath').attr('d')).toBe('M297,354L297,373Q297,381 289,381L107,381Q99,381 99,373L99,344Q99,336 106.15541752799933,339.5777087639997L117,345');
	});

	it('is destructible', function () {
		$example.wayfinding('destroy');
		expect($example).toBeEmpty();
	});


});
