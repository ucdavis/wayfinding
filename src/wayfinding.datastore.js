/*global $*/
/*jslint devel: true, browser: true, windows: true, plusplus: true, maxerr: 50, indent: 4 */

/**
 * @preserve
 * Wayfinding Datastore v0.4.0
 * https://github.com/ucdavis/wayfinding
 *
 * Copyright (c) 2010-2014 University of California Regents
 * Licensed under GNU General Public License v2
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Date: 2014-12-02
 *
 * The purpose of separating these functions from jquery.wayfinding.js
 * is to allow their reuse in situations where a DOM is not present such
 * as in NodeJS cache building / analysis scripts.
 *
 */

//  <![CDATA[

'use strict';

var WayfindingDataStore = {
	accessible: false,

	checkMaps: function (maps, startpoint) {
		var mapNum,
			pathNum,
			//debugLine,
			report = [],
			i = 0;

		//generateRoutes();

		for (mapNum = 0; mapNum < maps.length; mapNum++) {

			report[i++] = 'Checking map: ' + mapNum;

			for (pathNum = 0; pathNum < WayfindingDataStore.dataStore.paths[mapNum].length; pathNum++) {
				if (WayfindingDataStore.dataStore.paths[mapNum][pathNum].route === Infinity || WayfindingDataStore.dataStore.paths[mapNum][pathNum].prior === -1) {
					report[i++] = 'Unreachable path: ' + pathNum;
					//Show where paths that are unreachable from the given start point are.
					//debugLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
					//debugLine.setAttribute('class', 'debugPath');
					//debugLine.setAttribute('x1', WayfindingDataStore.dataStore.paths[mapNum][pathNum].ax);
					//debugLine.setAttribute('y1', WayfindingDataStore.dataStore.paths[mapNum][pathNum].ay);
					//debugLine.setAttribute('x2', WayfindingDataStore.dataStore.paths[mapNum][pathNum].bx);
					//debugLine.setAttribute('y2', WayfindingDataStore.dataStore.paths[mapNum][pathNum].by);
					//$('#' + WayfindingDataStore.dataStore.paths[mapNum][pathNum].floor + ' #Paths', el).append(debugLine);
				}
			}
			report[i++] = '\n';

			/* jshint ignore:start */
			$('#Rooms a', maps[mapNum].el).each(function (_i, room) {
				var doorPaths = WayfindingDataStore.getShortestRoute(maps, $(room).attr('id'), startpoint);

				if (doorPaths.solution.length === 0) {
					report[i++] = 'Unreachable room: ' + $(room).attr('id');
					//highlight unreachable rooms
					//$(room).attr('class', 'debugRoom');
				}
			}); //
			/* jshint ignore:end */
			report[i++] = '\n';
		}

		return report.join('\n');
	}, // checkMap function

	// Returns all rooms in the given 'maps' array
	getRooms: function(maps) {
		var rooms = [];

		$.each(maps, function (i, map) {
			$('#Doors line', map.el).each(function () {
				var doorId = $(this).attr('id');

				// cleanupSVG does this but it might not be called at this point.
				// Ensure IDs do not have Illustrator '_' junk
				if (doorId && doorId.indexOf('_') > 0) {
					var oldID = doorId;
					doorId = oldID.slice(0, oldID.indexOf('_'));
				}

				rooms.push(doorId);
			});
		});

		return rooms;
	},

	// Returns a count of all rooms
	countRooms: function(maps) {
		var rooms = 0;

		$.each(maps, function (i, map) {
			rooms = rooms + $('#Rooms polygon', map.el).length;
		});

		return rooms;
	},

	// Returns a count of all doors
	countDoors: function(maps) {
		var doors = 0;

		$.each(maps, function (i, map) {
			doors = doors + $('#Doors line', map.el).length;
		});

		return doors;
	},

	// Returns a count of all paths
	countPaths: function(maps) {
		var paths = 0;

		$.each(maps, function (i, map) {
			paths = paths + $('#Paths line', map.el).length;
		});

		return paths;
	}

};

//  ]]>
