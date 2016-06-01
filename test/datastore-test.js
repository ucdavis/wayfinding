/*global jasmine, beforeEach, afterEach, describe, it, $, expect*/

// https://github.com/velesin/jasmine-jquery
// https://github.com/velesin/jasmine-jquery/tree/support-jasmine-v2 -- we are using this version

'use strict';

var fixtures = jasmine.getFixtures();

// given relative path test/fixtures/ to karma
fixtures.fixturesPath = 'base/test/fixtures/';

describe('Datastore', function () {

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

    // Testing the datastore internals

    it('builds the right number of doors per floor', function() {
        // First obtain the datastore
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        // Do we have doors for each floor?
        expect(datastore.paths.length).toEqual(2);

        // Do we have the proper number of doors for each floor?
        // These magic numbers are from the maps SVG door counts
        expect(datastore.doors[0].length).toEqual(18);
        expect(datastore.doors[1].length).toEqual(2);
     });

    it('builds the right number of paths per floor', function() {
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        // Do we have paths for each floor?
        expect(datastore.paths.length).toEqual(2);

        // Do we have the proper number of paths for each floor?
        // These magic numbers are from the maps SVG path counts
        expect(datastore.paths[0].length).toEqual(64);
        expect(datastore.paths[1].length).toEqual(28);
    });

    it('builds the right number of portals per floor', function() {
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));


        // Do we have portals for each floor?
        expect(datastore.portals.length).toEqual(2);

        // Do we have the proper number of portals for each floor?
        // These magic numbers are from the maps SVG portal counts
        expect(datastore.portals[0].length).toEqual(2);
        expect(datastore.portals[1].length).toEqual(2);
    });

    it('correctly matches portals on different floors', function() {
        // First, let's try building everything
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        // Is each portal linking to the correct floor?
        expect(datastore.portals[0][0].toFloor).toEqual(1);
        expect(datastore.portals[0][1].toFloor).toEqual(1);
        expect(datastore.portals[1][0].toFloor).toEqual(0);
        expect(datastore.portals[1][1].toFloor).toEqual(0);

        // Is each portal correctly paired?
        expect(datastore.portals[0][0].match).toEqual(0);
        expect(datastore.portals[0][1].match).toEqual(1);
        expect(datastore.portals[1][0].match).toEqual(0);
        expect(datastore.portals[1][1].match).toEqual(1);
    });

    it('has the right number of connections for doors per floor', function() {
        // First, let's try building everything
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        var connectionCountFloor1 = 0;
        var connectionCountFloor2 = 0;

        // Loop through each door element and count its connections
        datastore.doors[0].forEach(function(el) {
            connectionCountFloor1 += el.doors.length;
            connectionCountFloor1 += el.paths.length;
            connectionCountFloor1 += el.portals.length;
        });

        datastore.doors[1].forEach(function(el) {
            connectionCountFloor2 += el.doors.length;
            connectionCountFloor2 += el.paths.length;
            connectionCountFloor2 += el.portals.length;
        });

        // Are the number of connections correct for doors on each floor?
        // The magic numbers are from hand counting the connections on the maps
        expect(connectionCountFloor1).toEqual(20);
        expect(connectionCountFloor2).toEqual(2);
    });

    it('has the right number of connections for paths per floor', function() {
        // First, let's try building everything
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        var connectionCountFloor1 = 0;
        var connectionCountFloor2 = 0;

        // Loop through each path element and count its connections
        datastore.paths[0].forEach(function(el) {
            connectionCountFloor1 += el.doors.length;
            connectionCountFloor1 += el.paths.length;
            connectionCountFloor1 += el.portals.length;
        });

        datastore.paths[1].forEach(function(el) {
            connectionCountFloor2 += el.doors.length;
            connectionCountFloor2 += el.paths.length;
            connectionCountFloor2 += el.portals.length;
        });

        // Are the number of connections correct for paths on each floor?
        // The magic numbers are from hand counting the connections on the maps
        expect(connectionCountFloor1).toEqual(296);
        expect(connectionCountFloor2).toEqual(70);
    });

    it('has the right number of connections for portals per floor', function() {
        // First, let's try building everything
        var datastore = JSON.parse($('#myMaps').wayfinding('getDataStore'));

        var connectionCountFloor1 = 0;
        var connectionCountFloor2 = 0;

        // Loop through each portal element and count its connections
        datastore.portals[0].forEach(function(el) {
            connectionCountFloor1 += el.doors.length;
            connectionCountFloor1 += el.paths.length;
            connectionCountFloor1 += el.portals.length;
        });

        datastore.portals[1].forEach(function(el) {
            connectionCountFloor2 += el.doors.length;
            connectionCountFloor2 += el.paths.length;
            connectionCountFloor2 += el.portals.length;
        });

        // Are the number of connections correct for portals on each floor?
        // The magic numbers are from hand counting the connections on the maps
        expect(connectionCountFloor1).toEqual(2);
        expect(connectionCountFloor2).toEqual(2);
    });
});
