/*global jasmine, beforeEach, afterEach, describe, it, $, expect*/

// https://github.com/velesin/jasmine-jquery

'use strict';

var fixtures  = jasmine.getFixtures();

// given relative path test/fixtures/ to karma
fixtures.fixturesPath = 'base/test/fixtures/';

describe('Wayfinding', function () {

	var $example;

	beforeEach(function () {
		fixtures.load('example.html');
		$example = $('.example');
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
		expect($example.find('.directionPath').length).toEqual(0);
//		$example.wayfinding('routeTo', 'R101');
//		expect($example).toContainElement('.directionPath');
	});

	xit('is destructible', function () {
		$example.wayfinding('destroy');
		expect($example).toBeEmpty();
	});


});
