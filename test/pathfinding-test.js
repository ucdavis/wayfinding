/*global jasmine, beforeEach, afterEach, describe, it, $, expect, Module*/

// https://github.com/velesin/jasmine-jquery
// https://github.com/velesin/jasmine-jquery/tree/support-jasmine-v2 -- we are using this version

'use strict';

var fixtures = jasmine.getFixtures();

// given relative path test/fixtures/ to karma
fixtures.fixturesPath = 'base/test/fixtures/';

describe('Pathfinding', function () {
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
        }, function() {
            done();
        });
	});

	afterEach(function () {
		$example.wayfinding('destroy');
	});

	it('finds the correct path between rooms on the same floor', function() {
        // Meticulously constructed by hand
        var shortestPath = ['door-0-0','path-0-4','path-0-63','path-0-62',
            'path-0-1','path-0-22','path-0-55','path-0-50','path-0-49',
            'door-0-15'];

        // First obtain the datastore
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        // Get the path from the pathfinding algorithm
        // Chose these rooms based off the wayfinding demo
        // It was the only way to confirm the correct path
        var path = Module.pathfinding(
            JSON.stringify(datastore),'R125','lobby',false);

        // Do we get the same path going in reverse?
        var reversePath = Module.pathfinding(
            JSON.stringify(datastore),'lobby','R125',false);

        // Are the path lengths the same?
        expect(path.size()).toEqual(shortestPath.length);
        expect(reversePath.size()).toEqual(shortestPath.length);

        // Were the shortest paths taken?
        for(var i = 0; i < path.size(); i++) {
            expect(path.get(i)).toMatch(shortestPath[i]);
            expect(reversePath.get(i)).toMatch(shortestPath[path.size()-1-i]);
        }
    });

    it('finds the correct path between rooms on different floors', function() {
        // Meticulously constructed by hand
        var shortestPath = ['door-0-0','path-0-4','path-0-63','path-0-62',
            'path-0-23','path-0-25','path-0-0','portal-0-1','portal-1-1',
            'path-1-5','path-1-4','path-1-9','path-1-10','path-1-0','door-1-0'];

        // First obtain the datastore
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        // Get the path from the pathfinding algorithm
        // Chose these rooms based off the wayfinding demo
        // It was the only way to confirm the correct path
        var path = Module.pathfinding(
            JSON.stringify(datastore),'R201','lobby',false);

        // Do we get the same path going in reverse?
        var reversePath = Module.pathfinding(
            JSON.stringify(datastore),'lobby','R201',false);

        // Are the path lengths the same?
        expect(path.size()).toEqual(shortestPath.length);
        expect(reversePath.size()).toEqual(shortestPath.length);

        // Were the shortest paths taken?
        for(var i = 0; i < path.size(); i++) {
            expect(path.get(i)).toMatch(shortestPath[i]);
            expect(reversePath.get(i)).toMatch(shortestPath[path.size()-1-i]);
        }
    });

    it('finds the correct, accessible path between rooms on different floors',
    function() {
        // Meticulously constructed by hand
        var shortestPath = ['door-0-0','path-0-4','path-0-5','path-0-8',
            'path-0-2','path-0-20','path-0-19','path-0-18','portal-0-0',
            'portal-1-0','path-1-1','path-1-6','path-1-7','path-1-8','path-1-9',
            'path-1-10','path-1-0','door-1-0'];

        // First obtain the datastore
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        // Get the path from the pathfinding algorithm
        // Chose these rooms based off the wayfinding demo
        // It was the only way to confirm the correct path
        var path = Module.pathfinding(
            JSON.stringify(datastore),'R201','lobby',true);

        // Do we get the same path going in reverse?
        var reversePath = Module.pathfinding(
            JSON.stringify(datastore),'lobby','R201',true);

        // Are the path lengths the same?
        expect(path.size()).toEqual(shortestPath.length);
        expect(reversePath.size()).toEqual(shortestPath.length);

        // Were the shortest paths taken?
        for(var i = 0; i < path.size(); i++) {
            expect(path.get(i)).toMatch(shortestPath[i]);
            expect(reversePath.get(i)).toMatch(shortestPath[path.size()-1-i]);
        }
    });

    it('handles invalid room names gracefully', function() {
        // First obtain the datastore
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        // TWO BAD ROOMS
        // Get the path from the pathfinding algorithm
        // Chose rooms not in the wayfinding demo to get error
        var path = Module.pathfinding(
            JSON.stringify(datastore),'fakeroom1','fakeroom2',
            true);

        // Valid error message when both rooms invalid
        var error = 'Invalid rooms, start: fakeroom1, end: fakeroom2';

        // Is there only one result in paths?
        expect(path.size()).toEqual(1);

        // Does the pathfinding code correctly identify both invalid rooms?
        expect(path.get(0)).toMatch(error);

        // BAD START ROOM
        // Get the path from the pathfinding algorithm
        // Chose a room not in the wayfinding demo to get error
        path = Module.pathfinding(
            JSON.stringify(datastore),'fakeroom','lobby',
            true);

        // Valid error message when start room invalid
        error = 'Invalid room, start: fakeroom';

        // Is there only one result in paths?
        expect(path.size()).toEqual(1);

        // Does the pathfinding code correctly identify both invalid rooms?
        expect(path.get(0)).toMatch(error);

        // BAD END ROOM
        // Get the path from the pathfinding algorithm
        // Chose a room not in the wayfinding demo to get error
        path = Module.pathfinding(
            JSON.stringify(datastore),'lobby','fakeroom',
            true);

        // Valid error message when end room invalid
        error = 'Invalid room, end: fakeroom';

        // Is there only one result in paths?
        expect(path.size()).toEqual(1);

        // Does the pathfinding code correctly identify both invalid rooms?
        expect(path.get(0)).toMatch(error);
    });

    it('handles an unreachable room gracefully', function() {
        // First obtain the datastore
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        // Delete connection between R202 and path
        // Index values found meticulously by hand
        datastore.paths[1][13].doors.length = 0;
        datastore.doors[1][1].paths.length = 0;

        // Get the path from the pathfinding algorithm
        // Chose R202 because the connection was removed
        var path = Module.pathfinding(
            JSON.stringify(datastore),'lobby','R202',
            true);

        // Valid error message when a room is unreachable
        var error = 'Path not found between start: lobby & end: R202';

        // Is there only one result in paths?
        expect(path.size()).toEqual(1);

        // Does the pathfinding code correctly identify an unreachable room?
        expect(path.get(0)).toMatch(error);
    });
});
