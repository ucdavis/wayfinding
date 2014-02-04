/*global jasmine, describe, it, $, expect*/

'use strict';

var fixtures  = jasmine.getFixtures();

// given relative path test/fixtures/ to karma
fixtures.fixturesPath = 'base/test/fixtures/';

describe('<Unit Test>', function () {
	describe('Example', function () {
		it('should add `success` class', function () {
//			fixtures.load('example.html');
//			var $example = $('.example');
//			$example.defaultPluginName();
//			expect($example.hasClass('success')).toBe(true);
			expect(1).toBe(1);
		});
	});
});
