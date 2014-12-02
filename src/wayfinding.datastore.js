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
	dataStore: null,
	portalSegments: [],
	accessible: false,

	// Needs to be here in WayfindingDataStore and not in jQuery.Wayfinding as it
	// can be used by NodeJS scripts to clean up rooms and generate routes as well.
	cleanupSVG: function (el) {
		// clean up after illustrator -> svg issues
		$('#Rooms a, #Doors line', el).each(function () {
			if ($(this).prop('id') && $(this).prop('id').indexOf('_') > 0) {
				var oldID = $(this).prop('id');
				$(this).prop('id', oldID.slice(0, oldID.indexOf('_')));
			}
		});
	}, //function cleanupSVG

	// Extract data from the svg maps
	buildDataStore: function (mapNum, map, el) {
		var path,
			doorId,
			x1,
			y1,
			x2,
			y2,
			matches,
			portal,
			portalId;

		//Paths

		WayfindingDataStore.dataStore.paths[mapNum] = [];

		$('#Paths line', el).each(function (i, line) {
			path = {};
			path.floor = map.id; // floor_1
			path.mapNum = mapNum; // index of floor in array 1
			path.route = Infinity; //Distance
			path.prior = -1; //Prior node in path that yielded route distance

			path.ax = $(this).attr('x1');
			path.ay = $(this).attr('y1');
			path.doorA = [];
			path.bx = $(this).attr('x2');
			path.by = $(this).attr('y2');
			path.doorB = [];
			path.length = Math.sqrt(Math.pow(path.ax - path.bx, 2) + Math.pow(path.ay - path.by, 2));

			path.connections = []; //other paths
			path.portals = []; // connected portals

			WayfindingDataStore.dataStore.paths[mapNum].push(path);
		});

		//Doors and starting points
		//roomId or POI_Id

		$('#Doors line', el).each(function () { // index, line
			x1 = $(this).attr('x1');
			y1 = $(this).attr('y1');
			x2 = $(this).attr('x2');
			y2 = $(this).attr('y2');
			doorId = $(this).attr('id');

			$.each(WayfindingDataStore.dataStore.paths[mapNum], function (index, path) {
				if (map.id === path.floor && ((path.ax === x1 && path.ay === y1) || (path.ax === x2 && path.ay === y2))) {
					path.doorA.push(doorId);
				} else if (map.id === path.floor && ((path.bx === x1 && path.by === y1) || (path.bx === x2 && path.by === y2))) {
					path.doorB.push(doorId);
				}
			});

		});

		//Portal Segments -- string theory says unmatched portal segment useless -- no wormhole

		$('#Portals line', el).each(function () { // index, line
			portal = {};

			portalId = $(this).attr('id');

			if (portalId && portalId.indexOf('_') > -1) {
				portalId = portalId.slice(0, portalId.indexOf('_'));
			}

			portal.id = portalId;
			portal.type = portalId.split('.')[0];
			portal.floor = map.id;

			portal.mate = portalId.split('.').slice(0, 2).join('.') + '.' + map.id;

			portal.mapNum = mapNum;

			portal.matched = false;

			x1 = $(this).attr('x1');
			y1 = $(this).attr('y1');
			x2 = $(this).attr('x2');
			y2 = $(this).attr('y2');

			matches = $.grep(WayfindingDataStore.dataStore.paths[mapNum], function (n) { // , i
				return ((x1 === n.ax && y1 === n.ay) || (x1 === n.bx && y1 === n.by));
			});

			if (matches.length !== 0) {
				portal.x = x1;
				portal.y = y1;
			} else {
				portal.x = x2;
				portal.y = y2;
			}

			//portal needs length -- long stairs versus elevator
			portal.length = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

			WayfindingDataStore.portalSegments.push(portal);
		});
	}, // function finishfloor

	// after data extracted from all svg maps then build portals between them
	buildPortals: function (maps) {

		var segmentOuterNum,
			segmentInnerNum,
			outerSegment,
			innerSegment,
			portal,
			mapNum,
			pathOuterNum,
			pathInnerNum,
			portalNum,
			pathNum;

		for (segmentOuterNum = 0; segmentOuterNum < WayfindingDataStore.portalSegments.length; segmentOuterNum++) {

			outerSegment = WayfindingDataStore.portalSegments[segmentOuterNum];

			if (outerSegment.matched === false) {

				for (segmentInnerNum = segmentOuterNum; segmentInnerNum < WayfindingDataStore.portalSegments.length; segmentInnerNum++) {
					if (WayfindingDataStore.portalSegments[segmentInnerNum].id === outerSegment.mate && WayfindingDataStore.portalSegments[segmentInnerNum].mate === outerSegment.id) {
						innerSegment = WayfindingDataStore.portalSegments[segmentInnerNum];

						portal = {};

						outerSegment.matched = true;
						innerSegment.matched = true;

						portal.type = outerSegment.type;
						portal.accessible = (portal.type === 'Elev' || portal.type === 'Door') ? true : false; // consider changing to != Stair

						portal.idA = outerSegment.id;
						portal.floorA = outerSegment.floor;
						portal.floorANum = outerSegment.mapNum;
						portal.xA = outerSegment.x;
						portal.yA = outerSegment.y;
						portal.connectionsA = []; //only paths

						portal.idB = innerSegment.id;
						portal.floorB = innerSegment.floor;
						portal.floorBNum = innerSegment.mapNum;
						portal.xB = innerSegment.x;
						portal.yB = innerSegment.y;
						portal.connectionsB = []; // only paths

						portal.length = outerSegment.length + innerSegment.length;

						portal.route = Infinity;
						portal.prior = -1;

						WayfindingDataStore.dataStore.portals.push(portal);

					}
				}
			}
		}

		//check each path for connections to other paths
		//checks only possible matchs on same floor, and only for half-1 triangle of search area to speed up search
		for (mapNum = 0; mapNum < maps.length; mapNum++) {
			for (pathOuterNum = 0; pathOuterNum < WayfindingDataStore.dataStore.paths[mapNum].length - 1; pathOuterNum++) {
				for (pathInnerNum = pathOuterNum + 1; pathInnerNum < WayfindingDataStore.dataStore.paths[mapNum].length; pathInnerNum++) {
					if (
						(WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].ax === WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].ax &&
						WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].ay === WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].ay) ||
							(WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].bx === WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].ax &&
								WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].by === WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].ay) ||
							(WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].ax === WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].bx &&
								WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].ay === WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].by) ||
							(WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].bx === WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].bx &&
								WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].by === WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].by)
					) {
						WayfindingDataStore.dataStore.paths[mapNum][pathOuterNum].connections.push(pathInnerNum);
						WayfindingDataStore.dataStore.paths[mapNum][pathInnerNum].connections.push(pathOuterNum);
					}
				}
			}
		}

		//optimize portal searching of paths
		for (portalNum = 0; portalNum < WayfindingDataStore.dataStore.portals.length; portalNum++) {
			for (mapNum = 0; mapNum < maps.length; mapNum++) {
				for (pathNum = 0; pathNum < WayfindingDataStore.dataStore.paths[mapNum].length; pathNum++) {
					if (WayfindingDataStore.dataStore.portals[portalNum].floorA === WayfindingDataStore.dataStore.paths[mapNum][pathNum].floor &&
							((WayfindingDataStore.dataStore.portals[portalNum].xA === WayfindingDataStore.dataStore.paths[mapNum][pathNum].ax &&
								WayfindingDataStore.dataStore.portals[portalNum].yA === WayfindingDataStore.dataStore.paths[mapNum][pathNum].ay) ||
								(WayfindingDataStore.dataStore.portals[portalNum].xA === WayfindingDataStore.dataStore.paths[mapNum][pathNum].bx &&
									WayfindingDataStore.dataStore.portals[portalNum].yA === WayfindingDataStore.dataStore.paths[mapNum][pathNum].by))) {
						WayfindingDataStore.dataStore.portals[portalNum].connectionsA.push(pathNum);
						WayfindingDataStore.dataStore.paths[mapNum][pathNum].portals.push(portalNum);
					} else if (WayfindingDataStore.dataStore.portals[portalNum].floorB === WayfindingDataStore.dataStore.paths[mapNum][pathNum].floor &&
							((WayfindingDataStore.dataStore.portals[portalNum].xB === WayfindingDataStore.dataStore.paths[mapNum][pathNum].ax &&
								WayfindingDataStore.dataStore.portals[portalNum].yB === WayfindingDataStore.dataStore.paths[mapNum][pathNum].ay) ||
							(WayfindingDataStore.dataStore.portals[portalNum].xB === WayfindingDataStore.dataStore.paths[mapNum][pathNum].bx &&
								WayfindingDataStore.dataStore.portals[portalNum].yB === WayfindingDataStore.dataStore.paths[mapNum][pathNum].by))) {
						WayfindingDataStore.dataStore.portals[portalNum].connectionsB.push(pathNum);
						WayfindingDataStore.dataStore.paths[mapNum][pathNum].portals.push(portalNum);
					}
				}
			}
		}

		WayfindingDataStore.portalSegments = [];

	}, // end function buildportals

	generateRoutes: function (startpoint, maps) {
		var sourceInfo,
		mapNum,
		sourcemapNum;

		sourceInfo = WayfindingDataStore.getDoorPaths(maps, startpoint);

		for (mapNum = 0; mapNum < maps.length; mapNum++) {
			if (maps[mapNum].id === sourceInfo.floor) {
				sourcemapNum = mapNum;
				break;
			}
		}

		$.each(sourceInfo.paths, function (i, pathId) {
			WayfindingDataStore.dataStore.paths[sourcemapNum][pathId].route = WayfindingDataStore.dataStore.paths[sourcemapNum][pathId].length;
			WayfindingDataStore.dataStore.paths[sourcemapNum][pathId].prior = 'door';
			WayfindingDataStore.recursiveSearch('pa', sourcemapNum, pathId, WayfindingDataStore.dataStore.paths[sourcemapNum][pathId].length);
		});
	},

	recursiveSearch: function (segmentType, segmentFloor, segment, length) {
		//SegmentType is PAth or POrtal, segment floor limits search, segment is id per type and floor, length is total length of current thread
		// for each path on this floor look at all the paths we know connect to it
		$.each(WayfindingDataStore.dataStore.paths[segmentFloor][segment].connections, function (i, tryPath) {
			// check and see if the current path is a shorter path to the new path
			if (length + WayfindingDataStore.dataStore.paths[segmentFloor][tryPath].length < WayfindingDataStore.dataStore.paths[segmentFloor][tryPath].route) {
				WayfindingDataStore.dataStore.paths[segmentFloor][tryPath].route = length + WayfindingDataStore.dataStore.paths[segmentFloor][tryPath].length;
				WayfindingDataStore.dataStore.paths[segmentFloor][tryPath].prior = segment;
				WayfindingDataStore.dataStore.paths[segmentFloor][tryPath].priorType = segmentType;
				WayfindingDataStore.recursiveSearch('pa', segmentFloor,  tryPath, WayfindingDataStore.dataStore.paths[segmentFloor][tryPath].route);
			}
		});

		// if the current path is connected to any portals
		if (WayfindingDataStore.dataStore.paths[segmentFloor][segment].portals.length > 0) {
			// look at each portal, tryPortal is portal index in portals
			$.each(WayfindingDataStore.dataStore.paths[segmentFloor][segment].portals, function (i, tryPortal) {
				if (length + WayfindingDataStore.dataStore.portals[tryPortal].length < WayfindingDataStore.dataStore.portals[tryPortal].route && (WayfindingDataStore.accessible === false || (WayfindingDataStore.accessible === true && WayfindingDataStore.dataStore.portals[tryPortal].accessible))) {
					WayfindingDataStore.dataStore.portals[tryPortal].route = length + WayfindingDataStore.dataStore.portals[tryPortal].length;
					WayfindingDataStore.dataStore.portals[tryPortal].prior = segment;
					WayfindingDataStore.dataStore.portals[tryPortal].priormapNum = WayfindingDataStore.dataStore.paths[segmentFloor][segment].mapNum;
					WayfindingDataStore.dataStore.portals[tryPortal].priorType = segmentType;
					// if the incoming segment to the portal is at one end of the portal try all the paths at the other end
					if ($.inArray(segment, WayfindingDataStore.dataStore.portals[tryPortal].connectionsA) !== -1) {
						$.each(WayfindingDataStore.dataStore.portals[tryPortal].connectionsB, function (i, tryPath) {
							//if adding this path
							if (length + WayfindingDataStore.dataStore.portals[tryPortal].length + WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorBNum][tryPath].length < WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorBNum][tryPath].route) {
								WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorBNum][tryPath].route = WayfindingDataStore.dataStore.portals[tryPortal].route + WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorBNum][tryPath].length;
								WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorBNum][tryPath].prior = tryPortal;
								WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorBNum][tryPath].priorType = 'po';
								WayfindingDataStore.recursiveSearch('pa', WayfindingDataStore.dataStore.portals[tryPortal].floorBNum, tryPath, WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorBNum][tryPath].route);
							}
						});
					} else {
						$.each(WayfindingDataStore.dataStore.portals[tryPortal].connectionsA, function (i, tryPath) {
							// if adding this path
							if (length + WayfindingDataStore.dataStore.portals[tryPortal].length + WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorANum][tryPath].length < WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorANum][tryPath].route) {
								WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorANum][tryPath].route = WayfindingDataStore.dataStore.portals[tryPortal].route + WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorANum][tryPath].length;
								WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorANum][tryPath].prior = tryPortal;
								WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorANum][tryPath].priorType = 'po';
								WayfindingDataStore.recursiveSearch('pa', WayfindingDataStore.dataStore.portals[tryPortal].floorANum, tryPath, WayfindingDataStore.dataStore.paths[WayfindingDataStore.dataStore.portals[tryPortal].floorANum][tryPath].route);
							}
						});
					}
				}
			});
		}
	},

	//get the set of paths adjacent to a door or endpoint.
	getDoorPaths: function (maps, door) {
		var mapNum,
		pathNum,
		doorANum,
		doorBNum,
		result = {
			'paths': [],
			'floor': null
		};

		for (mapNum = 0; mapNum < maps.length; mapNum++) {
			for (pathNum = 0; pathNum < WayfindingDataStore.dataStore.paths[mapNum].length; pathNum++) {
				for (doorANum = 0; doorANum < WayfindingDataStore.dataStore.paths[mapNum][pathNum].doorA.length; doorANum++) {
					if (WayfindingDataStore.dataStore.paths[mapNum][pathNum].doorA[doorANum] === door) {
						result.paths.push(pathNum); // only pushing pathNum because starting on a single floor
						result.floor = WayfindingDataStore.dataStore.paths[mapNum][pathNum].floor;
					}
				}
				for (doorBNum = 0; doorBNum < WayfindingDataStore.dataStore.paths[mapNum][pathNum].doorB.length; doorBNum++) {
					if (WayfindingDataStore.dataStore.paths[mapNum][pathNum].doorB[doorBNum] === door) {
						result.paths.push(pathNum); // only pushing pathNum because starting on a single floor
						result.floor = WayfindingDataStore.dataStore.paths[mapNum][pathNum].floor;
					}
				}
			}
		}

		return result;
	},

	// from a given end point generate an array representing the reverse steps needed to reach destination along shortest path
	backTrack: function (segmentType, segmentFloor, segment) {
		var step;

		// if we aren't at the startpoint point
		if (segment !== 'door') {
			step = {};
			step.type = segmentType;
			step.floor = segmentFloor;
			step.segment = segment;
			solution.push(step);
			switch (segmentType) {
			case 'pa':
				WayfindingDataStore.backTrack(WayfindingDataStore.dataStore.paths[segmentFloor][segment].priorType, segmentFloor, WayfindingDataStore.dataStore.paths[segmentFloor][segment].prior);
				break;
			case 'po':
				WayfindingDataStore.backTrack(WayfindingDataStore.dataStore.portals[segment].priorType, WayfindingDataStore.dataStore.portals[segment].priormapNum, WayfindingDataStore.dataStore.portals[segment].prior);
				break;
			}
		}
	},

	getShortestRoute: function (maps, destinations, startpoint) {
		function _minLengthRoute(maps, destination, startpoint) {
			var destInfo,
			mapNum,
			minPath,
			reversePathStart,
			destinationmapNum,
			i;

			destInfo = WayfindingDataStore.getDoorPaths(maps, destination);

			for (mapNum = 0; mapNum < maps.length; mapNum++) {
				if (maps[mapNum].id === destInfo.floor) {
					destinationmapNum = mapNum;
					break;
				}
			}

			minPath = Infinity;
			reversePathStart = -1;

			for (i = 0; i < destInfo.paths.length; i++) {
				if (WayfindingDataStore.dataStore.paths[destinationmapNum][destInfo.paths[i]].route < minPath) {
					minPath = WayfindingDataStore.dataStore.paths[destinationmapNum][destInfo.paths[i]].route;
					reversePathStart = destInfo.paths[i];
				}
			}

			if (reversePathStart !== -1) {
				solution = []; //can't be set in backtrack because it is recursive.
				WayfindingDataStore.backTrack('pa', destinationmapNum, reversePathStart);
				solution.reverse();

				return {
					'startpoint': startpoint,
					'endpoint': destination,
					'solution': solution,
					'distance': minPath
				};
			}

			return {
				'startpoint': startpoint,
				'endpoint': destination,
				'solution': [],
				'distance': minPath
			};
		}

		if (Array.isArray(destinations)) {
			return $.map(destinations, function (dest) {
				return _minLengthRoute(maps, dest, startpoint);
			});
		} else {
			return _minLengthRoute(maps, destinations, startpoint);
		}
	},

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
	},

	build: function (startpoint, maps, accessible) {
		// Reset dataStore data
		if(accessible === undefined) {
			accessible = false;
		}
		WayfindingDataStore.accessible = accessible;

		WayfindingDataStore.dataStore = {
			'paths': [],
			'portals': []
		};

		WayfindingDataStore.portalSegments = [];

		// Build the dataStore from each map given
		$.each(maps, function(i, map) {
			WayfindingDataStore.cleanupSVG(map.el);
			WayfindingDataStore.buildDataStore(i, map, map.el);
		});

		WayfindingDataStore.buildPortals(maps);

		WayfindingDataStore.generateRoutes(startpoint, maps);

		return WayfindingDataStore.dataStore;
	} // function build
};

//  ]]>
