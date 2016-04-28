/*global document, jQuery*/
/*jslint devel: true, browser: true, windows: true, plusplus: true, maxerr: 50, indent: 4 */

/**
 * @preserve
 * Wayfinding v2.0.0
 * https://github.com/ucdavis/wayfinding
 *
 * Copyright (c) 2010-2014 University of California Regents
 * Licensed under GNU General Public License v2
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Date: 2014-12-02
 *
 * @module wayfinding
 * @main wayfinding
 * @namespace wayfinding
 * @version 2.0.0
 * @requires jQuery
 *
 */

//  <![CDATA[

(function ($) {
	'use strict';

	/**
	 * @typedef defaults
	 * @memberOf wayfinding
	 * @type {object}
	 * @property {map[]} maps collection of maps to be used by wayfinding
	 * @property {path} path collection of behavior and styling for the solution path
	 * @property {string|function} startpoint either a string identifier for
	 * the startpoint or a function that returns the same
	 * @property {string|function} endpoint either a string identifier for the
	 * endpoint or a function that returns the same
	 * @property {boolean} accessibleRoute if true will avoid routes that use stairs
	 * @property {string|function} defaultMap either a string idenfier for the
	 * map to show upon load, or a function that returns the same
	 * @property {string} loadMessage the message to show while the maps are bring loaded
	 * @property {null|object|string} datastoreCache [description]
	 * @property {boolean} showLocation [description]
	 * @property {object} locationIndicator [description]
	 * @property {boolean} pinchToZoom [description]
	 * @property {boolean} zoomToRoute [description]
	 * @property {integer} zoomPadding [description]
	 * @property {integer} floorChangeAnimationDelay [description]
	 */

	/**
	 * @todo verify that endpoint can take both string and function, there is
	 * some code in place for this
	 */

	var defaults = {
		/**
		 * @typedef map
		 * @memberOf wayfinding
		 * @type object
		 * @property {string} path relative URL to load the map from
		 * @property {string} id the identifier by which the map is referenced by other maps
		 */
		'maps': [{'path': 'floorplan.svg', 'id': 'map.1'}],
		/**
		 * @typedef path
		 * @memberOf wayfinding
		 * @typedef {object}
		 * @property {string} color any valid CSS color
		 * @property {integer} radius the turn ration in pixels to apply to the solution path
		 * @property {integer} speed the speed at which the solution path will be drawn
		 * @property {integer} width the width in pixels of the solution path
		 */
		'path': {
			color: 'red', // the color of the solution path that will be drawn
			radius: 10, // the radius in pixels to apply to the solution path
			speed: 8, // the speed at which the solution path with be drawn
			width: 3 // the width of the solution path in pixels
		},
		// The door identifier for the default starting point
		'startpoint': function () {
			return 'startpoint';
		},
		// If specified in the wayfinding initialization
		// route to this point as soon as the maps load. Can be initialized
		// as a function or a string (for consistency with startpoint)
		'endpoint': false,
		// Controls routing through stairs
		// if true return an accessible route
		// if false return the shortest route possible
		'accessibleRoute': false,
		// Provides the identifier for the map that should be show at startup,
		// if not given will default to showing first map in the array
		'defaultMap': function () {
			return 'map.1';
		},
		'loadMessage': 'Loading',
		// should dataStoreCache should be used
		// null is cache should not be used
		// object if cache is being passed
		// string representing url if it should be used
		// string is URL path where filename to load will be in the form startpoint + '.json' or startpoint + '.acc.json'
		'dataStoreCache': null,
		// place marker for "you are here"
		'showLocation': false,
		//styling for the "you are here pin"
		'locationIndicator': {
			fill: 'red',
			height: 40
		},
		'pinchToZoom': false, // requires jquery.panzoom
		'zoomToRoute': true,
		'zoomPadding': 25,
		// milliseconds to wait during animation when a floor change occurs
		'floorChangeAnimationDelay': 1250
	},
	dataStore;

	// should array of arrays be looked into
	// should floor only be stored by id?
	// or is it enough that it is already the index of the enclosing array?
	// remove portal id strings?

	/**
	 * @typedef datastore
	 * @memberOf plugin
	 * @type {object}
	 * @property {floors[]} p holds an array of floors each of which has an array of paths
	 * @property {portals[]} q holds an array of portals
	 */

	/**
	 * @typedef floors
	 * @memberOf plugin
	 * @type {paths[]}
	 */

	/**
	 * @typedef paths
	 * @memberOf plugin
	 * @type {object}
	 * @property {string} floor floor identifier
	 * @property {float} x on the first end of the path the x coord
	 * @property {float} y on the first end of the path the y coord
	 * @property {float} m on the second end of the path the x coord
	 * @property {float} n on the second end of the path the y coord
	 * @property {string[]} d an array of doors that connect to the first end of the path
	 * @property {string[]} e an array of doors that connect to the second end of the path
	 * @property {string[]} c array of connections to other paths
	 * @property {string[]} q array of connections to portals
	 * @property {string} o prior path type "pa" or "po"
	 * @property {float} l length of this segment
	 * @property {float} r current shortest combined lengths to reach here
	 * @property {string} p prior path segment to follow back for shortest path
	 */

	/**
	 * @todo change floor to f in floors
	 */

	/**
	 * @typedef portals
	 * @memberOf plugin
	 * @type {object}
	 * @property {string} t portal type as string
	 * @property {boolean} a accessible boolean
	 * @property {string} f floor of first end as string
	 * @property {integer} g floor of first end as number
	 * @property {float} x x coord of first end
	 * @property {float} y y coord of first end
	 * @property {float} c connections to paths of first end
	 * @property {string} j floor of second end as string
	 * @property {integer} k floor of second end as number
	 * @property {float} m x coord of second end
	 * @property {float} n y coord of second end
	 * @property {string[]} d connections to paths of second end
	 * @property {float} l length of this segment
	 * @property {float} r current shortest combined lengths to reach here
	 * @property {string} p prior path segment to follow back for shortest path
	 * @property {integer} q prior map number
	 * @property {string} o prior path type "pa" or "po"
	 */

	/**
	 * The jQuery plugin namespace.
	 * @external "jQuery.fn"
	 * @see {@link http://docs.jquery.com/Plugins/Authoring The jQuery Plugin Guide}
	 */

	/**
	 * Wayfinding
	 * @function external:"jQuery.fn".wayfinding
	 * @namespace plugin
	 */

	$.fn.wayfinding = function (action, options, callback) {
		var passed = options,
			obj, // the jQuery object being worked with;
			maps, // the array of maps populated from options each time
			defaultMap, // the floor to show at start propulated from options
			startpoint, // the result of either the options.startpoint value or the value of the function
			portalSegments = [], // used to store portal pieces until the portals are assembled, then this is dumped.
			solution,
			result, // used to return non jQuery results
			drawing,
			id_to_index = {},  // maps floor IDs to an index in 'maps'
			queue;


		/**
		 * @function escapeSelector
		 * @memberOf plugin
		 * @private
		 * @inner
		 * @param {string} sel the jQuery selector to escape
		 * @description to handle jQuery selecting ids with periods and other special characters
		 */
		function escapeSelector(sel) {
			return sel.replace(/(:|\.|\[|\])/g, '\\$1');
		}

		// Applies linear interpolation to find the correct value
		// for traveling from value oldValue to newValue taking into account
		// that you are (i / steps) of the way through the process
		function interpolateValue(oldValue, newValue, i, steps) {
			return (((steps - i) / steps) * oldValue) + ((i / steps) * newValue);
		}

		function CheckMapEmpty(value) {
			this.value = value;
			this.message = ' no maps identified in collection to load';
			this.toString = function() {
				return this.value + this.message;
			};
		}

		function CheckMapDuplicates(value) {
			this.value = value;
			this.message = ' has duplicate map ids';
			this.toString = function() {
				return this.value + this.message;
			};
		}

		function CheckMapBadDefault(value) {
			this.value = value;
			this.message = ' wasn\'t in the list of maps';
			this.toString = function() {
				return this.value + this.message;
			};
		}

		// Ensure floor ids are unique.
		function checkIds(el) {
			var mapNum,
				checkNum,
				reassign = false,
				defaultMapValid = false,
				status;

			status = $(el).find('div')
				.hide()
				.end()
				.append('<div id="WayfindingStatus" style="">' + options.loadMessage + '</div>');

			if (maps.length > 0) {
				for (mapNum = 0; mapNum < maps.length; mapNum++) {
					for (checkNum = mapNum; checkNum < maps.length; checkNum++) {
						if (mapNum !== checkNum && maps[mapNum].id === maps[checkNum].id) {
							reassign = true;
						}
					}
				}
				if (reassign === true) {
					$(status).text(options.errorMessage);
					throw new CheckMapDuplicates(JSON.stringify(maps));
				}

				//check that defaultMap is valid as well
				for (mapNum = 0; mapNum < maps.length; mapNum++) {
					if (maps[mapNum].id === defaultMap) {
						defaultMapValid = true;
					}
				}
				if (defaultMapValid === false) {
					$(status).text(options.errorMessage);
					throw new CheckMapBadDefault(defaultMap);
				}
			} else {
				// raise exception about no maps being found
				$(status).text(options.errorMessage);
				throw new CheckMapEmpty(JSON.stringify(maps));
			}
		} //function checkIds

		//Takes x and y coordinates and makes a location indicating pin for those
		//coordinates. Returns the pin element, not yet attached to the DOM.
		function makePin(x, y, type) {
			var indicator,
				pin,
				circle,
				height = options.locationIndicator.height, // add error checking?
				symbolPath;

			indicator = document.createElementNS('http://www.w3.org/2000/svg', 'g');

			$(indicator).attr('class', type);

			pin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

			symbolPath = 'M0.075,0';
			symbolPath += 'c-2.079-10.207-5.745-18.703-10.186-26.576c-3.295-5.84-7.111-11.23-10.642-16.894c-1.179-1.891-2.196-3.888-3.327-5.85';
			symbolPath += 'c-2.266-3.924-4.102-8.472-3.984-14.372c0.113-5.766,1.781-10.391,4.186-14.172c3.954-6.219,10.578-11.317,19.465-12.657';
			symbolPath += 'c7.268-1.095,14.08,0.756,18.911,3.58c3.948,2.31,7.005,5.394,9.329,9.027c2.426,3.793,4.096,8.274,4.236,14.12';
			symbolPath += 'c0.072,2.995-0.418,5.769-1.109,8.069c-0.699,2.328-1.823,4.274-2.824,6.353c-1.953,4.06-4.4,7.777-6.857,11.498';
			symbolPath += 'C9.954,-26.789,3.083,-15.486,0.075,0z';

			pin.setAttribute('d', symbolPath);
			pin.setAttribute('fill', '#E81E25');
			pin.setAttribute('stroke', '#000000');
			pin.setAttribute('stroke-width', '3.7');
			pin.setAttribute('stroke-miterlimit', '10');

			circle.setAttribute('cx', '0');
			circle.setAttribute('cy', '-63.757');
			circle.setAttribute('r', '9.834');

			indicator.appendChild(pin);
			indicator.appendChild(circle);

			indicator.setAttribute('transform', 'translate(' + x + ' ' + (y - 10 * (height / 125)) + ') scale(' + height / 125 + ')');

			return indicator;

		} //function makePin

		// Extract data from the svg maps
		function buildDataStore(mapNum, map, el) {
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
			dataStore.p[mapNum] = [];

			$('#Paths line', el).each(function () {
				path = {};
				path.floor = map.id; // floor_1
//				path.mapNum = mapNum; // index of floor in array 1
				path.r = Infinity; //Distance
				path.p = -1; //Prior node in path that yielded route distance

				path.x = $(this).attr('x1');
				path.y = $(this).attr('y1');
				path.d = [];
				path.m = $(this).attr('x2');
				path.n = $(this).attr('y2');
				path.e = [];
				path.l = Math.sqrt(Math.pow(path.x - path.m, 2) + Math.pow(path.y - path.n, 2));

				path.c = []; //other paths
				path.q = []; // connected portals

				dataStore.p[mapNum].push(path);
			});

			//Doors and starting points
			//roomId or POI_Id

			$('#Doors line', el).each(function () { // index, line
				x1 = $(this).attr('x1');
				y1 = $(this).attr('y1');
				x2 = $(this).attr('x2');
				y2 = $(this).attr('y2');
				doorId = $(this).attr('id');

				$.each(dataStore.p[mapNum], function (index, segment) {
					if (map.id === segment.floor && ((segment.x === x1 && segment.y === y1) || (segment.x === x2 && segment.y === y2))) {
						segment.d.push(doorId);
					} else if (map.id === segment.floor && ((segment.m === x1 && segment.n === y1) || (segment.m === x2 && segment.n === y2))) {
						segment.e.push(doorId);
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

				matches = $.grep(dataStore.p[mapNum], function (n) { // , i
					return ((x1 === n.x && y1 === n.y) || (x1 === n.m && y1 === n.n));
				});

				if (matches.length !== 0) {
					portal.x = x1;
					portal.y = y1;
				} else {
					portal.x = x2;
					portal.y = y2;
				}

				//portal needs length -- long stairs versus elevator
				portal.l = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

				portalSegments.push(portal);
			});
		} // function buildDataStore

		// after data extracted from all svg maps then build portals between them
		function buildPortals() {

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

			for (segmentOuterNum = 0; segmentOuterNum < portalSegments.length; segmentOuterNum++) {

				outerSegment = portalSegments[segmentOuterNum];

				if (outerSegment.matched === false) {

					for (segmentInnerNum = segmentOuterNum; segmentInnerNum < portalSegments.length; segmentInnerNum++) {
						if (portalSegments[segmentInnerNum].id === outerSegment.mate && portalSegments[segmentInnerNum].mate === outerSegment.id) {
							innerSegment = portalSegments[segmentInnerNum];

							portal = {};

							outerSegment.matched = true;
							innerSegment.matched = true;

							portal.t = outerSegment.type;
							portal.a = (portal.t === 'Elev' || portal.t === 'Door') ? true : false; // consider changing to != Stair

//							portal.idA = outerSegment.id;
							portal.f = outerSegment.floor;
							portal.g = outerSegment.mapNum;
							portal.x = outerSegment.x;
							portal.y = outerSegment.y;
							portal.c = []; //only paths

//							portal.idB = innerSegment.id;
							portal.j = innerSegment.floor;
							portal.k = innerSegment.mapNum;
							portal.m = innerSegment.x;
							portal.n = innerSegment.y;
							portal.d = []; // only paths

							portal.l = outerSegment.l + innerSegment.l; // length is combined lengths

							portal.r = Infinity;
							portal.p = -1;

							dataStore.q.push(portal);

						}
					}
				}
			}

			//check each path for connections to other paths
			//checks only possible matchs on same floor, and only for half-1 triangle of search area to speed up search
			for (mapNum = 0; mapNum < maps.length; mapNum++) {
				for (pathOuterNum = 0; pathOuterNum < dataStore.p[mapNum].length - 1; pathOuterNum++) {
					for (pathInnerNum = pathOuterNum + 1; pathInnerNum < dataStore.p[mapNum].length; pathInnerNum++) {
						if (
							(dataStore.p[mapNum][pathInnerNum].x === dataStore.p[mapNum][pathOuterNum].x &&
							dataStore.p[mapNum][pathInnerNum].y === dataStore.p[mapNum][pathOuterNum].y) ||
								(dataStore.p[mapNum][pathInnerNum].m === dataStore.p[mapNum][pathOuterNum].x &&
									dataStore.p[mapNum][pathInnerNum].n === dataStore.p[mapNum][pathOuterNum].y) ||
								(dataStore.p[mapNum][pathInnerNum].x === dataStore.p[mapNum][pathOuterNum].m &&
									dataStore.p[mapNum][pathInnerNum].y === dataStore.p[mapNum][pathOuterNum].n) ||
								(dataStore.p[mapNum][pathInnerNum].m === dataStore.p[mapNum][pathOuterNum].m &&
									dataStore.p[mapNum][pathInnerNum].n === dataStore.p[mapNum][pathOuterNum].n)
						) {
							// push onto connections
							dataStore.p[mapNum][pathOuterNum].c.push(pathInnerNum);
							dataStore.p[mapNum][pathInnerNum].c.push(pathOuterNum);
						}
					}
				}
			}

			//optimize portal searching of paths
			for (portalNum = 0; portalNum < dataStore.q.length; portalNum++) {
				for (mapNum = 0; mapNum < maps.length; mapNum++) {
					for (pathNum = 0; pathNum < dataStore.p[mapNum].length; pathNum++) {
						if (dataStore.q[portalNum].f === dataStore.p[mapNum][pathNum].floor &&
								((dataStore.q[portalNum].x === dataStore.p[mapNum][pathNum].x &&
									dataStore.q[portalNum].y === dataStore.p[mapNum][pathNum].y) ||
									(dataStore.q[portalNum].x === dataStore.p[mapNum][pathNum].m &&
										dataStore.q[portalNum].y === dataStore.p[mapNum][pathNum].n))) {
							dataStore.q[portalNum].c.push(pathNum);
							dataStore.p[mapNum][pathNum].q.push(portalNum);
						} else if (dataStore.q[portalNum].j === dataStore.p[mapNum][pathNum].floor &&
								((dataStore.q[portalNum].m === dataStore.p[mapNum][pathNum].x &&
									dataStore.q[portalNum].n === dataStore.p[mapNum][pathNum].y) ||
								(dataStore.q[portalNum].m === dataStore.p[mapNum][pathNum].m &&
									dataStore.q[portalNum].n === dataStore.p[mapNum][pathNum].n))) {
							dataStore.q[portalNum].d.push(pathNum);
							dataStore.p[mapNum][pathNum].q.push(portalNum);
						}
					}
				}
			}

			portalSegments = [];

		} // end function buildportals

		//get the set of paths adjacent to a door or endpoint.
		function getDoorPaths(door) {
			var mapNum,
				pathNum,
				doorANum,
				doorBNum,
				doorPaths = {
					'paths': [],
					'floor': null
				};

			for (mapNum = 0; mapNum < maps.length; mapNum++) {
				for (pathNum = 0; pathNum < dataStore.p[mapNum].length; pathNum++) {
					for (doorANum = 0; doorANum < dataStore.p[mapNum][pathNum].d.length; doorANum++) {
						if (dataStore.p[mapNum][pathNum].d[doorANum] === door) {
							doorPaths.paths.push(pathNum); // only pushing pathNum because starting on a single floor
							doorPaths.floor = dataStore.p[mapNum][pathNum].floor;
						}
					}
					for (doorBNum = 0; doorBNum < dataStore.p[mapNum][pathNum].e.length; doorBNum++) {
						if (dataStore.p[mapNum][pathNum].e[doorBNum] === door) {
							doorPaths.paths.push(pathNum); // only pushing pathNum because starting on a single floor
							doorPaths.floor = dataStore.p[mapNum][pathNum].floor;
						}
					}
				}
			}
			return doorPaths;
		}

		function recursiveSearch(segmentType, segmentFloor, segment, length) {
			//SegmentType is PAth or POrtal, segment floor limits search, segment is id per type and floor, length is total length of current thread
			// for each path on this floor look at all the paths we know connect to it

			// for each connection
			$.each(dataStore.p[segmentFloor][segment].c, function (i, tryPath) {
				// check and see if the current path is a shorter path to the new path
				if (length + dataStore.p[segmentFloor][tryPath].l < dataStore.p[segmentFloor][tryPath].r) {
					dataStore.p[segmentFloor][tryPath].r = length + dataStore.p[segmentFloor][tryPath].l;
					dataStore.p[segmentFloor][tryPath].p = segment;
					dataStore.p[segmentFloor][tryPath].o = segmentType;
					recursiveSearch('pa', segmentFloor, tryPath, dataStore.p[segmentFloor][tryPath].r);
				}
			});

			// if the current path is connected to any portals
			if (dataStore.p[segmentFloor][segment].q.length > 0) {

				// look at each portal, tryPortal is portal index in portals
				$.each(dataStore.p[segmentFloor][segment].q, function (i, tryPortal) {

					if (length + dataStore.q[tryPortal].l < dataStore.q[tryPortal].r && (options.accessibleRoute === false || (options.accessibleRoute === true && dataStore.q[tryPortal].a))) {
						dataStore.q[tryPortal].r = length + dataStore.q[tryPortal].l;
						dataStore.q[tryPortal].p = segment;
						dataStore.q[tryPortal].q = segmentFloor;
						dataStore.q[tryPortal].o = segmentType;

						// if the incoming segment to the portal is at one end of the portal try all the paths at the other end
						if ($.inArray(segment, dataStore.q[tryPortal].c) !== -1) {
							$.each(dataStore.q[tryPortal].d, function (ia, tryPath) {
								//if adding this path
								if (length + dataStore.q[tryPortal].l + dataStore.p[dataStore.q[tryPortal].k][tryPath].l < dataStore.p[dataStore.q[tryPortal].k][tryPath].r) {
									dataStore.p[dataStore.q[tryPortal].k][tryPath].r = dataStore.q[tryPortal].r + dataStore.p[dataStore.q[tryPortal].k][tryPath].l;
									dataStore.p[dataStore.q[tryPortal].k][tryPath].p = tryPortal;
									dataStore.p[dataStore.q[tryPortal].k][tryPath].o = 'po';
									recursiveSearch('pa', dataStore.q[tryPortal].k, tryPath, dataStore.p[dataStore.q[tryPortal].k][tryPath].r);
								}
							});
						} else {
							$.each(dataStore.q[tryPortal].c, function (ib, tryPath) {
								// if adding this path
								if (length + dataStore.q[tryPortal].l + dataStore.p[dataStore.q[tryPortal].g][tryPath].l < dataStore.p[dataStore.q[tryPortal].g][tryPath].r) {
									dataStore.p[dataStore.q[tryPortal].g][tryPath].r = dataStore.q[tryPortal].r + dataStore.p[dataStore.q[tryPortal].g][tryPath].l;
									dataStore.p[dataStore.q[tryPortal].g][tryPath].p = tryPortal;
									dataStore.p[dataStore.q[tryPortal].g][tryPath].o = 'po';
									recursiveSearch('pa', dataStore.q[tryPortal].g, tryPath, dataStore.p[dataStore.q[tryPortal].g][tryPath].r);
								}
							});
						}
					}
				});
			}
		}

		function generateRoutes() {
			var sourceInfo,
				mapNum,
				sourcemapNum;

			sourceInfo = getDoorPaths(startpoint);

			for (mapNum = 0; mapNum < maps.length; mapNum++) {
				if (maps[mapNum].id === sourceInfo.floor) {
					sourcemapNum = mapNum;
					break;
				}
			}

			$.each(sourceInfo.paths, function (i, pathId) {
				dataStore.p[sourcemapNum][pathId].r = dataStore.p[sourcemapNum][pathId].l;
				dataStore.p[sourcemapNum][pathId].p = 'door';
				recursiveSearch('pa', sourcemapNum, pathId, dataStore.p[sourcemapNum][pathId].l);
			});
		}


		// from a given end point generate an array representing the reverse steps needed to reach destination along shortest path
		function backTrack(segmentType, segmentFloor, segment) {
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
					backTrack(dataStore.p[segmentFloor][segment].o, segmentFloor, dataStore.p[segmentFloor][segment].p);
					break;
				case 'po':
					backTrack(dataStore.q[segment].o, dataStore.q[segment].q, dataStore.q[segment].p);
					break;
				}
			}
		}

		function getShortestRoute() {

			var destInfo,
				mapNum,
				destinationmapNum,
				reversePathStart,
				minPath,
				i;

			destInfo = getDoorPaths(options.endpoint);

			for (mapNum = 0; mapNum < maps.length; mapNum++) {
				if (maps[mapNum].id === destInfo.floor) {
					destinationmapNum = mapNum;
					break;
				}
			}

			minPath = Infinity;
			reversePathStart = -1;

			for (i = 0; i < destInfo.paths.length; i++) {

				if (dataStore.p[destinationmapNum][destInfo.paths[i]].r < minPath) {
					minPath = dataStore.p[destinationmapNum][destInfo.paths[i]].r;
					reversePathStart = destInfo.paths[i];
				}
			}

			if (reversePathStart !== -1) {
				solution = []; //can't be set in backtrack because it is recursive.
				backTrack('pa', destinationmapNum, reversePathStart);
				solution.reverse();
			}
			return solution;
		}

		function buildOld() {

			dataStore = {
				'p': [], // paths
				'q': [] // portals
			};

			portalSegments = [];

			// Build the dataStore from each map given
			$.each(maps, function(i, map) {
				// cleanupSVG(map.el); // commented out as already run by initialize
				buildDataStore(i, map, map.el);
			});

			buildPortals();
			generateRoutes();

			return dataStore;
		} // function buildOld


		// Orders points based on x, y, and ID in that order.
	    function comparePoints(point_a, point_b) {
	       if (point_a.x != point_b.x) {
	           return point_a.x - point_b.x;
	       }
	       else if (point_a.y != point_b.y) {
	           return point_a.y - point_b.y;
	       }
	       else {
	           return point_a.id - point_b.id;
	       }
	    }


		function buildDoors(floor, map) {        
	        dataStore.doors[floor] = [];
	        
	        $('#Doors line', map).each(function () { // index, line
	            var door = {};
	            
	            door.floor = floor;
	            door.x1 = parseInt($(this).attr('x1'));
	            door.x1_f = parseFloat($(this).attr('x1'));
	            door.y1 = parseInt($(this).attr('y1'));
	            door.y1_f = parseFloat($(this).attr('y1'));
	            door.x2 = parseInt($(this).attr('x2'));
	            door.x2_f = parseFloat($(this).attr('x2'));
	            door.y2 = parseInt($(this).attr('y2'));
	            door.y2_f = parseFloat($(this).attr('y2'));
	            door.doorId = $(this).attr('id').split("_")[0];
	            door.id = dataStore.doors[floor].length;
	            //door.length = Math.sqrt(Math.pow(door.x2_f - door.x1_f, 2) + Math.pow(door.y2_f - door.y1_f, 2));

	            door.paths = [];
	            door.doors = [];
	            door.portals = [];
	            
	            dataStore.doors[floor].push(door);
	            queue.queue({
	                x: door.x1,
	                y: door.y1,
	                id: dataStore.doors[floor].length - 1,
	                type: "doors"
	            });
	            queue.queue({
	                x: door.x2,
	                y: door.y2,
	                id: dataStore.doors[floor].length - 1,
	                type: "doors"
	            });
	        });
	    }

	    function buildPaths(floor, map) {
        	        
	        dataStore.paths[floor] = [];
	        
	        $('#Paths line', map).each(function (i, line) {
	            var path = {};
	            
	            path.floor = floor;
	            path.x1 = parseInt($(this).attr('x1'));
	            path.x1_f = parseFloat($(this).attr('x1'));
	            path.y1 = parseInt($(this).attr('y1'));
	            path.y1_f = parseFloat($(this).attr('y1'));
	            path.x2 = parseInt($(this).attr('x2'));
	            path.x2_f = parseFloat($(this).attr('x2'));
	            path.y2 = parseInt($(this).attr('y2'));
	            path.y2_f = parseFloat($(this).attr('y2'));
	            path.length = Math.sqrt(Math.pow(path.x2_f - path.x1_f, 2) + Math.pow(path.y2_f - path.y1_f, 2));
	            path.pathId = dataStore.paths[floor].length;
	            path.id = dataStore.paths[floor].length;
	            
	            path.paths = [];
	            path.doors = [];
	            path.portals = [];
	            
	            dataStore.paths[floor].push(path);
	            queue.queue({
	                x: path.x1,
	                y: path.y1,
	                id: dataStore.paths[floor].length - 1,
	                type: "paths"
	            });
	            queue.queue({
	                x: path.x2,
	                y: path.y2,
	                id: dataStore.paths[floor].length - 1,
	                type: "paths"
	            });
	        });
	    }

	    function buildPortals(floor, map) {

	        dataStore.portals[floor] = [];
	        
	        $('#Portals line', map).each(function () { // index, line
	            var portal = {};

	            portal.floor = floor;
	            portal.x1 = parseInt($(this).attr('x1'));
	            portal.x1_f = parseFloat($(this).attr('x1'));
	            portal.y1 = parseInt($(this).attr('y1'));
	            portal.y1_f = parseFloat($(this).attr('y1'));
	            portal.x2 = parseInt($(this).attr('x2'));
	            portal.x2_f = parseFloat($(this).attr('x2'));
	            portal.y2 = parseInt($(this).attr('y2'));
	            portal.y2_f = parseFloat($(this).attr('y2'));

	            portal.paths = [];
	            portal.doors = [];
	            portal.portals = [];
	            portal.id = dataStore.portals[floor].length;

	            var portalID = $(this).attr('id').split("_")[0].split(".");
	            
	            portal.portalId = portalID[0] + "." + portalID[1];
	            
	            var to_floor = id_to_index[portalID[2]];
	            if (to_floor == undefined) {
	                to_floor = -1;
	            }
	            
	            portal.to_floor = parseInt(to_floor);
	            portal.accessible = false;
	            portal.match = -1;
	            
	            if (portalID[0] === "Elev") {
	                portal.accessible = true;
	            }

	            portal.length = Math.sqrt(Math.pow(portal.x2_f - portal.x1_f, 2) + Math.pow(portal.y2_f - portal.y1_f, 2));

	            dataStore.portals[floor].push(portal);
	            queue.queue({
	                x: portal.x1,
	                y: portal.y1,
	                id: dataStore.portals[floor].length - 1,
	                type: "portals"
	            });
	            queue.queue({
	                x: portal.x2,
	                y: portal.y2,
	                id: dataStore.portals[floor].length - 1,
	                type: "portals"
	            });
	        });
	    }

	    function buildConnections(floor) {
	        	       
	        if (queue.length == 0 ) {
	            return;
	        }

	        var start = queue.dequeue();
	        var connected = [start];
	        var previous = start;
	        
	        while(queue.length > 0) {
	            var point = queue.dequeue();
	            
	            if (previous.x == point.x && previous.y == point.y) {
	                connected.push(point);
	            }
	            else {
	                // matches "closest" paths together, stores connection in 'dataStore'
	                $.each(connected, function(i, firstPath) {
	                    $.each(connected, function(j, secondPath) {
	                        if (i != j) {
	                            dataStore[firstPath.type][floor][firstPath.id][secondPath.type].push(secondPath.id);
	                        }
	                    });
	                });
	                connected = [point];
	            }
	            previous = point;
	        }
	        
	        $.each(connected, function(i, firstPath) {
	            $.each(connected, function(j, secondPath) {
	                if (i != j) {
	                    dataStore[firstPath.type][floor][firstPath.id][secondPath.type].push(secondPath.id);
	                }
	            });
	        }); 
	    }

	    function matchPortals() {
        
	        // Go through each portal
	        $.each(dataStore.portals, function(floor, floor_portals) {
	          $.each(floor_portals, function(i, portal) {
	            if (portal.match == -1) {
	              // For each portal, go through linked floor portals
	              // -1 indicates that the other floor does not exist
	              if (portal.to_floor != -1) {
	                $.each(dataStore.portals[portal.to_floor], function(j, portal2) {
	                    if (portal2.portalId == portal.portalId &&
	                        portal2.to_floor == portal.floor)
	                    {
	                      portal.match = portal2.id;
	                      portal2.match = portal.id;
	                    }
	                });
	              }
	            }
	          });
	        });
	    }

		function build() {
	        
	        dataStore = {
	            'doors': [],
	            'paths': [],
	            'portals': []
	        };

	        // Build the dataStore from each map given
	        $.each(maps, function(i, map) {
	            queue = new PriorityQueue({ comparator: comparePoints });
	            buildDoors(i, map.el);
	            buildPaths(i, map.el);
	            buildPortals(i, map.el); 
	            buildConnections(i);
	        });

	        matchPortals();
    	} // function build

		// Ensure a dataStore exists and is set, whether from a cache
		// or by building it.
		function establishDataStore(onReadyCallback) {

			if (options.dataStoreCache) {
				if (typeof options.dataStoreCache === 'object') {

					dataStore = options.dataStoreCache;

					if(typeof onReadyCallback === 'function') {
						onReadyCallback();
					}
				} else if (typeof options.dataStoreCache === 'string') {
					var cacheUrl = options.dataStoreCache + startpoint + ((options.accessibleRoute) ? '.acc' : '') + '.json';

					$.getJSON(cacheUrl, function (response) {

						dataStore = response;

						if(typeof onReadyCallback === 'function') {
							onReadyCallback();
						}
					}).fail(function () {

						dataStore = build();

						if(typeof onReadyCallback === 'function') {
							onReadyCallback();
						}
					});
				}
			} else {

				dataStore = build();

				if(typeof onReadyCallback === 'function') {
					onReadyCallback();
				}
			}
		}

		// Set the start point, and put a location indicator
		// in that spot, if feature is enabled.
		// if using dataStores then trigger loading of new datastore.
		function setStartPoint(point, el) {
			var start,
				attachPinLocation,
				x,
				y,
				pin;

			//clears locationIndicators from the maps
			$('g.startPin', el).remove();

			options.startpoint = point;

			// set startpoint correctly
			if (typeof options.startpoint === 'function') {
				startpoint = options.startpoint();
			} else {
				startpoint = options.startpoint;
			}

			if (options.showLocation) {

				start = $('#Doors #' + escapeSelector(startpoint), el);

				var startMap = el.children().has($('#' + escapeSelector(startpoint)));

				attachPinLocation = $('svg', startMap).children().last();

				if (start.length) {
					x = (Number(start.attr('x1')) + Number(start.attr('x2'))) / 2;
					y = (Number(start.attr('y1')) + Number(start.attr('y2'))) / 2;

					pin = makePin(x, y, 'startPin');

					attachPinLocation.after(pin);
				} else {
					return; //start point does not exist
				}
			}
			// if (options.dataStoreCache !== null) {
			// 	establishDataStore();
			// }
		} //function setStartPoint

		function setEndPoint(endPoint, el) {
			var end,
				attachPinLocation,
				x,
				y,
				pin;

			//clears locationIndicators from the maps
			$('g.destinationPin', el).remove();

			if (options.showLocation) {
				end = $('#Doors #' + escapeSelector(endPoint), el);

				attachPinLocation = $('svg').has('#Rooms a[id="' + escapeSelector(endPoint) + '"]');
				if (end.length) {
					x = (Number(end.attr('x1')) + Number(end.attr('x2'))) / 2;
					y = (Number(end.attr('y1')) + Number(end.attr('y2'))) / 2;

					pin = makePin(x, y, 'destinationPin');

					attachPinLocation.append(pin);
				} else {
					return; //end point does not exist
				}
			}
		} //function setEndPoint

		// Set options based on either provided options or defaults
		function getOptions(el) {
			var optionsPrior = el.data('wayfinding:options');

			drawing = el.data('wayfinding:drawing'); // load a drawn path, if it exists

			options = $.extend(true, {}, defaults, options);

			// check for settings attached to the current object
			if (optionsPrior !== undefined) {
				options = optionsPrior;
			} else {
				options = $.extend(true, {}, defaults, options);
			}

			// check for settings attached to the current object
			options = $.metadata ? $.extend(true, {}, options, el.metadata()) : options;

			// Create references to the options
			maps = options.maps;

			// set defaultMap correctly, handle both function and value being passed
			if (typeof options.defaultMap === 'function') {
				defaultMap = options.defaultMap();
			} else {
				defaultMap = options.defaultMap;
			}

			// Set startpoint correctly
			if (typeof options.startpoint === 'function') {
				startpoint = options.startpoint();
			} else {
				startpoint = options.startpoint;
			}
		} //function getOptions

		function setOptions(el) {

			el.data('wayfinding:options', options);
			el.data('wayfinding:drawing', drawing);
			// need to handle cases where WayfindingDataStore isn't loaded if we are separating these out
			el.data('wayfinding:data', dataStore);
		}

		function cleanupSVG(el) { // should only be called once instead of twice if initalize and build for non datastore
			var svg = $(el).find('svg'),
				height = parseInt($(svg).attr('height').replace('px', '').split('.')[0], 10),
				width = parseInt($(svg).attr('width').replace('px', '').split('.')[0], 10);

			// Ensure SVG w/h are divisble by 2 (to avoid webkit blurriness bug on pan/zoom)
			// might need to shift this change to the enclosing element for responsive svgs?
			height = Math.ceil(height / 2) * 2;
			width = Math.ceil(width / 2) * 2;

			// if ($(el).css('padding-bottom') === '' || $(el).css('padding-bottom') === '0px') {
				$(el).css('padding-bottom', (100 * (height / width)) + '%');

				svg.attr('height', '100%')
					.attr('width', '100%')
					.attr('preserveAspectRatio', 'xMinYMin meet');
			// }

			// clean up after illustrator -> svg issues
			$('#Rooms a, #Doors line', el).each(function () {
				if ($(this).prop('id') && $(this).prop('id').indexOf('_') > 0) {
					var oldID = $(this).prop('id');
					$(this).prop('id', oldID.slice(0, oldID.indexOf('_')));
				}
			});
		} //function cleanupSVG

		// Ensures '$el' has a valid jQuery.panzoom object
		function initializePanZoom(el) {

			el.panzoom({
				minScale: 1.0,
				contain: 'invert',
				cursor: 'pointer'
			});

			// Allow clicking on links within the SVG despite $.panZoom()
			el.find('a').on('mousedown touchstart', function(e) {
				e.stopImmediatePropagation();
			});
		} //function initializePanZoom

		// Hide SVG div, hide path lines (they're data, not visuals), make rooms clickable
		function activateSVG(el, svgDiv) {

			// Hide maps until explicitly displayed
			$(svgDiv).hide();

			// Hide route information
			$('#Paths line', svgDiv).attr('stroke-opacity', 0);
			$('#Doors line', svgDiv).attr('stroke-opacity', 0);
			$('#Portals line', svgDiv).attr('stroke-opacity', 0);

			// If #Paths, #Doors, etc. are in a group, ensure that group does _not_
			// have display: none; (commonly set by Illustrator when hiding a layer)
			// and instead add opacity: 0; (which allows for events, unlike display: none;)
			// (A group tag 'g' is used by Illustrator for layers.)
			var $dataGroup = $('#Paths', svgDiv).parent();
			if($dataGroup.is('g')) {
				$dataGroup.attr('opacity', 0).attr('display', 'inline');
			}

			// The following need to use the el variable to scope their calls: el is jquery element

			// Make rooms clickable
			$('#Rooms a', svgDiv).click(function (event) {
				$(el).trigger('wayfinding:roomClicked', [ { roomId: $(this).attr('id') } ] );
				$(el).wayfinding('routeTo', $(this).prop('id'));
				event.preventDefault();
			});

			// Disable clicking on every SVG element except rooms
			$(svgDiv).find('*').css('pointer-events', 'none');
			$('#Rooms a', svgDiv).find('*').css('pointer-events', 'auto');

			$(el).append(svgDiv);

			// jQuery.panzoom() only works after element is attached to DOM
			if(options.pinchToZoom) {
				initializePanZoom($(svgDiv));
			}
		} //function activateSVG

		// Called when animatePath() is switching the floor and also when
		function switchFloor(floor, el) {
			var height = $(el).height();

			$(el).height(height); // preserve height as I'm not yet set switching

			$('div', el).hide();

			$('#' + floor, el).show(0, function() {
				$(el).trigger('wayfinding:floorChanged', { mapId: floor });
			});

			//turn floor into mapNum, look for that in drawing
			// if there get drawing[level].routeLength and use that.

			var i, level, mapNum, pathLength;

			if (drawing) {
				mapNum = -1;

				for (i = 0; i < maps.length; i++) {
					if (maps[i] === floor) {
						mapNum = i;
						break;
					}
				}

				level = -1;

				for (i = 0; i < drawing.length; i++) {
					if (drawing[i].floor === mapNum) {
						level = i;
						break;
					}
				}

				if (level !== -1) {
					pathLength = drawing[level].routeLength;

					// these next three are potentially redundant now
					$(drawing[level].path, el).attr('stroke-dasharray', [pathLength, pathLength]);
					$(drawing[level].path, el).attr('stroke-dashoffset', pathLength);
					$(drawing[level].path, el).attr('pathLength', pathLength);
					$(drawing[level].path, el).attr('stroke-dashoffset', pathLength);

					$(drawing[level].path, el).animate({svgStrokeDashOffset: 0}, pathLength * options.path.speed); //or move minPath to global variable?
				}
			}
		} //function switchFloor

		function hidePath(el) {
			$('path[class^=directionPath]', el).css({
				'stroke': 'none'
			});
		}

		// Uses jQuery.panzoom to pan/zoom to the SVG viewbox coordinate equivalent of (x, y, w, h)
		function panzoomWithViewBoxCoords(cssDiv, svg, x, y, w, h) {

			x = parseFloat(x);
			y = parseFloat(y);
			w = parseFloat(w);
			h = parseFloat(h);

			var viewBox = svg.getAttribute('viewBox');
			var viewX = parseFloat(viewBox.split(/\s+|,/)[0]); // viewBox is [x, y, w, h], x == [0]
			var viewY = parseFloat(viewBox.split(/\s+|,/)[1]);
			var viewW = parseFloat(viewBox.split(/\s+|,/)[2]);
			var viewH = parseFloat(viewBox.split(/\s+|,/)[3]);

			var cssW = $(cssDiv).width();
			var cssH = $(cssDiv).height();

			// Step 1, determine the scale
			var scale = Math.min(( viewW / w ), ( viewH / h ));

			$(cssDiv).panzoom('zoom', parseFloat(scale));

			// Determine bounding box -> CSS coordinate conversion factor
			var bcX = cssW / viewW;
			var bcY = cssH / viewH;

			// Step 2, determine the focal
			var bcx = viewX + (viewW / 2); // box center
			var bcy = viewY + (viewH / 2);

			var fx = (bcx - (x + (w / 2))) * bcX;
			var fy = (bcy - (y + (h / 2))) * bcY;

			// Step 3, apply $.panzoom()
			$(cssDiv).panzoom('pan', fx * scale, fy * scale);
		}

		function animatePath(drawingSegment) {
			var path,
				svg,
				pathRect,
				drawLength,
				oldViewBox,
				animationDuration,
				pad = options.zoomPadding,
				steps = 35,
				duration = 650, // Zoom animation in milliseconds
				oldView = {},
				newView = {},
				step;

			function adjustIn(current, old, target, count, speed) {
				setTimeout(function() {
					var zoomIn = {};
					zoomIn.X = interpolateValue(old.X, target.X, current, count);
					zoomIn.Y = interpolateValue(old.Y, target.Y, current, count);
					zoomIn.W = interpolateValue(old.W, target.W, current, count);
					zoomIn.H = interpolateValue(old.H, target.H, current, count);

					if(options.pinchToZoom) {
						// Use CSS 3-based zooming
						panzoomWithViewBoxCoords($(svg).parent()[0], svg, zoomIn.X, zoomIn.Y, zoomIn.W, zoomIn.H);
					} else {
						// Use SVG viewBox-based zooming
						svg.setAttribute('viewBox', zoomIn.X + ' ' + zoomIn.Y + ' ' + zoomIn.W + ' ' + zoomIn.H);
					}
				}, current * (speed / count));
			}

			function adjustOut(current, old, target, count, speed) {
				setTimeout(function() {
					var zoom = {};
					zoom.X = interpolateValue(target.X, old.X, current, count);
					zoom.Y = interpolateValue(target.Y, old.Y, current, count);
					zoom.W = interpolateValue(target.W, old.W, current, count);
					zoom.H = interpolateValue(target.H, old.H, current, count);

					if(options.pinchToZoom) {
						// Use CSS 3-based zooming
						panzoomWithViewBoxCoords($(svg).parent()[0], svg, zoom.X, zoom.Y, zoom.W, zoom.H);
					} else {
						svg.setAttribute('viewBox', zoom.X + ' ' + zoom.Y + ' ' + zoom.W + ' ' + zoom.H);
					}

					if(current === count) {
						if(drawingSegment === drawing.length) {
							$(obj).trigger('wayfinding:animationComplete');
						}
					}
				}, current * (speed / count));
			}

			if (options.repeat && drawingSegment >= drawing.length) {
				// if repeat is set, then delay and rerun display from first.
				// Don't implement, until we have click to cancel out of this
				setTimeout(function () {
					animatePath(0);
				},
				5000);
			} else if (drawingSegment >= drawing.length) {
				//finished, stop recursion.
				return;
			}

			var mapIdx = drawing[drawingSegment][0].floor;
			svg = $('#' + maps[mapIdx].id + ' svg')[0];

			drawLength = drawing[drawingSegment].routeLength;
			animationDuration = drawLength * options.path.speed;

			switchFloor(maps[drawing[drawingSegment][0].floor].id, obj);

			// Get the complete path for this particular floor-route
			path = $('#' + maps[drawing[drawingSegment][0].floor].id + ' .directionPath' + drawingSegment)[0];

			// Animate using CSS transitions
			// SVG animation technique from http://jakearchibald.com/2013/animated-line-drawing-svg/
			path.style.stroke = options.path.color;
			path.style.strokeWidth = options.path.width;
			path.style.transition = path.style.WebkitTransition = 'none';
			path.style.strokeDasharray = drawLength + ' ' + drawLength;
			path.style.strokeDashoffset = drawLength;
			pathRect = path.getBBox();
			path.style.transition = path.style.WebkitTransition = 'stroke-dashoffset ' + animationDuration + 'ms linear';
			path.style.strokeDashoffset = '0';

			// If this is the last segment, trigger the 'wayfinding:animationComplete' event
			// when it finishes drawing.
			// If we're using zoomToRoute however, don't trigger here, trigger when zoomOut is complete (see below)
			if(options.zoomToRoute === false) {
				if(drawingSegment === (drawing.length - 1)) {
					$(path).one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
						$(obj).trigger('wayfinding:animationComplete');
					});
				}
			} else {
				// Zooming logic...
				// Store the original SVG viewBox in order to zoom out back to it after path animation
				oldViewBox = svg.getAttribute('viewBox');
				oldView.X = parseFloat(oldViewBox.split(/\s+|,/)[0]); // viewBox is [x, y, w, h], x == [0]
				oldView.Y = parseFloat(oldViewBox.split(/\s+|,/)[1]);
				oldView.W = parseFloat(oldViewBox.split(/\s+|,/)[2]);
				oldView.H = parseFloat(oldViewBox.split(/\s+|,/)[3]);

				// Calculate single step size from each direction
				newView.X = ((pathRect.x - pad) > 0) ? (pathRect.x - pad) : 0;
				newView.Y = ((pathRect.y - pad) > 0) ? (pathRect.y - pad) : 0;
				newView.H = pathRect.height + (2 * pad);
				newView.W = pathRect.width + (2 * pad);

				// Loop the specified number of steps to create the zoom in animation
				for (step = 0; step <= steps; step++) {
					adjustIn(step, oldView, newView, steps, duration);
				}
			}


			// Call animatePath after 'animationDuration' milliseconds to animate the next segment of the path,
			// if any.
			// Note: This is not tiny path 'segments' which form the lines curving around
			//       hallways but rather the other 'paths' needed on other floors, if any.
			setTimeout(function () {
				animatePath(++drawingSegment);

				if (options.zoomToRoute) {
					// Loop the specified number of steps to create the zoom out animation
					// or set step = steps to force the zoom out immediately (used on floors
					// no longer visible to the user due to floor changes)

					// Animate zoom out if we're on the last drawing segment, else
					// we can just reset the zoom out (improves performance, user will never notice)
					if((drawing.length === 1) || ((drawing.length > 1) && (drawingSegment === drawing.length))) {
						step = 0; // apply full animation
					} else {
						step = steps; // effectively removes animation and resets the zoom out (only triggered on floors where the user
					}

					for ( ; step <= steps; step++) {
						adjustOut(step, oldView, newView, steps, duration);
					}
				}
			}, animationDuration + options.floorChangeAnimationDelay);
		} //function animatePath

		// The combined routing function
		// revise to only interate if startpoint has changed since last time?
		function routeTo(destination, el) {
			var i,
				draw,
				stepNum,
				level,
				reversePathStart,
				portalsEntered,
				lastStep,
				ax,
				ay,
				bx,
				by,
				aDX,
				aDY,
				bDX,
				bDY,
				cx,
				cy,
				px,
				py,
				curve,
				nx,
				ny,
				thisPath,
				pick;

			options.endpoint = destination;

			// remove any prior paths from the current map set
			$('path[class^=directionPath]', obj).remove();

			//clear all rooms
			$('#Rooms *.wayfindingRoom', obj).removeAttr('class');

			solution = [];

			//if startpoint != destination
			if (startpoint !== destination) {
				// get accessibleRoute option -- options.accessibleRoute

				//highlight the destination room
				$('#Rooms a[id="' + destination + '"] g', obj).attr('class', 'wayfindingRoom');
				setEndPoint(options.endpoint, el);

				solution = getShortestRoute();

				if (reversePathStart !== -1) {

					portalsEntered = 0;
					// Count number of portal trips
					for (i = 0; i < solution.length; i++) {
						if (solution[i].type === 'po') {
							portalsEntered++;
						}
					}

					//break this into a new function?
					drawing = new Array(portalsEntered); // Problem at line 707 character 40: Use the array literal notation [].

					drawing[0] = [];

					//build drawing and modify solution for text generation by adding .direction to solution segments?

					draw = {};

					if(solution.length === 0) {
						console.warn('Attempting to route with no solution. This should never happen. SVG likely has errors. Destination is: ' + destination);
						return;
					}

					//if statement incorrectly assumes one door at the end of the path, works in that case, need to generalize
					if (dataStore.p[solution[0].floor][solution[0].segment].d[0] === startpoint) {
						draw = {};
						draw.floor = solution[0].floor;
						draw.type = 'M';
						draw.x = dataStore.p[solution[0].floor][solution[0].segment].x;
						draw.y = dataStore.p[solution[0].floor][solution[0].segment].y;
						draw.length = 0;
						drawing[0].push(draw);
						draw = {};
						draw.type = 'L';
						draw.floor = solution[0].floor;
						draw.x = dataStore.p[solution[0].floor][solution[0].segment].m;
						draw.y = dataStore.p[solution[0].floor][solution[0].segment].n;
						draw.length = dataStore.p[solution[0].floor][solution[0].segment].l;
						drawing[0].push(draw);
						drawing[0].routeLength = draw.length;
					} else if (dataStore.p[solution[0].floor][solution[0].segment].e[0] === startpoint) {
						draw = {};
						draw.type = 'M';
						draw.floor = solution[0].floor;
						draw.x = dataStore.p[solution[0].floor][solution[0].segment].m;
						draw.y = dataStore.p[solution[0].floor][solution[0].segment].n;
						draw.length = 0;
						drawing[0].push(draw);
						draw = {};
						draw.type = 'L';
						draw.floor = solution[0].floor;
						draw.x = dataStore.p[solution[0].floor][solution[0].segment].x;
						draw.y = dataStore.p[solution[0].floor][solution[0].segment].y;
						draw.length = dataStore.p[solution[0].floor][solution[0].segment].l;
						drawing[0].push(draw);
						drawing[0].routeLength = draw.length;
					}

					lastStep = 1;

					// for each floor that we have to deal with
					for (i = 0; i < portalsEntered + 1; i++) {
						for (stepNum = lastStep; stepNum < solution.length; stepNum++) {
							if (solution[stepNum].type === 'pa') {
								ax = dataStore.p[solution[stepNum].floor][solution[stepNum].segment].x;
								ay = dataStore.p[solution[stepNum].floor][solution[stepNum].segment].y;
								bx = dataStore.p[solution[stepNum].floor][solution[stepNum].segment].m;
								by = dataStore.p[solution[stepNum].floor][solution[stepNum].segment].n;

								draw = {};
								draw.floor = solution[stepNum].floor;
								if (drawing[i].slice(-1)[0].x === ax && drawing[i].slice(-1)[0].y === ay) {
									draw.x = bx;
									draw.y = by;
								} else {
									draw.x = ax;
									draw.y = ay;
								}
								draw.length = dataStore.p[solution[stepNum].floor][solution[stepNum].segment].l;
								draw.type = 'L';
								drawing[i].push(draw);
								drawing[i].routeLength += draw.length;
							}
							if (solution[stepNum].type === 'po') {
								drawing[i + 1] = [];
								drawing[i + 1].routeLength = 0;
								// push the first object on
								// check for more than just floor number here....
								pick = '';
								if (dataStore.q[solution[stepNum].segment].g === dataStore.q[solution[stepNum].segment].k) {
									if (dataStore.q[solution[stepNum].segment].x === draw.x && dataStore.q[solution[stepNum].segment].y === draw.y) {
										pick = 'B';
									} else {
										pick = 'A';
									}
								} else {
									if (dataStore.q[solution[stepNum].segment].g === solution[stepNum].floor) {
										pick = 'A';
									} else if (dataStore.q[solution[stepNum].segment].k === solution[stepNum].floor) {
										pick = 'B';
									}
								}
								if (pick === 'A') {
									draw = {};
									draw.floor = solution[stepNum].floor;
									draw.type = 'M';
									draw.x = dataStore.q[solution[stepNum].segment].x;
									draw.y = dataStore.q[solution[stepNum].segment].y;
									draw.length = 0;
									drawing[i + 1].push(draw);
									drawing[i + 1].routeLength = draw.length;
								} else if (pick === 'B') {
									draw = {};
									draw.floor = solution[stepNum].floor;
									draw.type = 'M';
									draw.x = dataStore.q[solution[stepNum].segment].m;
									draw.y = dataStore.q[solution[stepNum].segment].n;
									draw.length = 0;
									drawing[i + 1].push(draw);
									drawing[i + 1].routeLength = draw.length;
								}
								lastStep = stepNum;
								lastStep++;
								stepNum = solution.length;
							}
						}
					}

					//go back through the drawing and insert curves if requested
					//consolidate colinear line segments?
					if (options.path.radius > 0) {
						for (level = 0; level < drawing.length; level++) {
							for (i = 1; i < drawing[level].length - 1; i++) {
								if (drawing[level][i].type === 'L' && drawing[level][i].type === 'L') {
									// check for colinear here and remove first segment, and add its length to second
									aDX = (drawing[level][i - 1].x - drawing[level][i].x);
									aDY = (drawing[level][i - 1].y - drawing[level][i].y);
									bDX = (drawing[level][i].x - drawing[level][i + 1].x);
									bDY = (drawing[level][i].y - drawing[level][i + 1].y);
									// if the change in Y for both is Zero
									if ((aDY === 0 && bDY === 0) || (aDX === 0 && bDX === 0) || ((aDX / aDY) === (bDX / bDY) && !(aDX === 0 && aDY === 0 && bDX === 0 && bDY === 0))) {
										drawing[level][i + 1].length = drawing[level][i].length + drawing[level][i + 1].length;
//                                      drawing[level][i+1].type = "L";
										drawing[level].splice(i, 1);
										i = 1;
									}
								}
							}
							for (i = 1; i < drawing[level].length - 1; i++) {
								// locate possible curves based on both line segments being longer than options.path.radius
								if (drawing[level][i].type === 'L' && drawing[level][i].type === 'L' && drawing[level][i].length > options.path.radius && drawing[level][i + 1].length > options.path.radius) {
									//save old end point
									cx = drawing[level][i].x;
									cy = drawing[level][i].y;
									// change x,y and change length
									px = drawing[level][i - 1].x;
									py = drawing[level][i - 1].y;
									//new=prior + ((center-prior) * ((length-radius)/length))
									drawing[level][i].x = (Number(px) + ((cx - px) * ((drawing[level][i].length - options.path.radius) / drawing[level][i].length)));
									drawing[level][i].y = (Number(py) + ((cy - py) * ((drawing[level][i].length - options.path.radius) / drawing[level][i].length)));
									//shorten current line
									drawing[level][i].length = drawing[level][i].length - options.path.radius;
									curve = {};
									//curve center is old end point
									curve.cx = cx;
									curve.cy = cy;
									//curve end point is based on next line
									nx = drawing[level][i + 1].x;
									ny = drawing[level][i + 1].y;
									curve.x = (Number(cx) + ((nx - cx) * ((options.path.radius) / drawing[level][i + 1].length)));
									curve.y = (Number(cy) + ((ny - cy) * ((options.path.radius) / drawing[level][i + 1].length)));
									//change length of next segment now that it has a new starting point
									drawing[level][i + 1].length = drawing[level][i + 1].length - options.path.radius;
									curve.type = 'Q';
									curve.floor = drawing[level][i].floor;
									// insert curve element
									// splice function on arrays allows insertion
									//   array.splice(start, delete count, value, value)
									// drawing[level].splice(current line, 0, curve element object);

									drawing[level].splice(i + 1, 0, curve);

								} // both possible segments long enough
							} // drawing segment
						} // level
					} // if we are doing curves at all

					$.each(drawing, function (j, map) {
						var path = '',
							newPath;
						$.each(map, function (k, stroke) {
							switch (stroke.type) {
							case 'M':
								path = 'M' + stroke.x + ',' + stroke.y;
								break;
							case 'L':
								path += 'L' + stroke.x + ',' + stroke.y;
								break;
							case 'Q':
								path += 'Q' + stroke.cx + ',' + stroke.cy + ' ' + stroke.x + ',' + stroke.y;
								break;
							}
						});

						newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
						newPath.setAttribute('d', path);
						newPath.style.fill = 'none';

						if (newPath.classList) {
							newPath.classList.add('directionPath' + j);
						} else {
							newPath.setAttribute('class', 'directionPath' + j);
						}


						// Attach the newpath to the startpin or endpin if they exist on this floor
						var attachPointSvg = $('#' + maps[map[0].floor].id + ' svg');
						var startPin = $('.startPin', attachPointSvg);
						var destinationPin = $('.destinationPin', attachPointSvg);

						if (startPin.length) {
							startPin.before(newPath);
						}
						else if (destinationPin.length) {
							destinationPin.before(newPath);
						}
						else {
							attachPointSvg.append(newPath);
						}

						thisPath = $('#' + maps[map[0].floor].id + ' svg .directionPath' + j);

						drawing[j].path = thisPath;

					});

					animatePath(0);

					//on switch which floor is displayed reset path svgStrokeDashOffset to minPath and the reanimate
					//notify animation loop?
				}
			}
		} //RouteTo

		function replaceLoadScreen(el) {
			var displayNum,
				mapNum;

			$('#WayfindingStatus').remove();

			// loop ensures defaultMap is in fact one of the maps
			displayNum = 0;
			for (mapNum = 0; mapNum < maps.length; mapNum++) {
				if (defaultMap === maps[mapNum].id) {
					displayNum = mapNum;
				}
			}

			// highlight starting floor
			$('#' + maps[displayNum].id, el).show();

			$(el).trigger('wayfinding:mapsVisible');

			// if endpoint was specified, route to there.
			if (typeof options.endpoint === 'function') {
				routeTo(options.endpoint(), el);
			} else if (typeof options.endpoint === 'string') {
				routeTo(options.endpoint, el);
			}

			$.event.trigger('wayfinding:ready');
		} //function replaceLoadScreen

		// Initialize the jQuery target object
		function initialize(el, cb) {
			var mapsProcessed = 0;

			$('div:not("#WayfindingStatus")', el).remove();

			// Load SVGs off the network
			$.each(maps, function (i, map) {

				var svgDiv = $('<div id="' + map.id + '"><\/div>');
				id_to_index[map.id] = i;

				//create svg in that div
				svgDiv.load(
					map.path,
					function (svg, status) {
						if (status === 'error') {
							svgDiv.html('<p class="text-center text-danger">Map ' + i + ' Was not found at ' +
								map.path + '<br />Please upload it in the administration section</p>');
							maps[i].el = svgDiv;
						} else {
							maps[i].svgHandle = svg;
							maps[i].el = svgDiv;

							cleanupSVG(maps[i].el);

							activateSVG(el, svgDiv);

							mapsProcessed += 1;
						}

						if(mapsProcessed === maps.length) {
							// All SVGs have finished loading
							establishDataStore(function() {
								// SVGs are loaded, dataStore is set, ready the DOM
								setStartPoint(startpoint, el);
								setOptions(el);
								replaceLoadScreen(el);
								if (typeof cb === 'function') {
									cb();
								}
							});
						}
					}
				);
			});

		} // function initialize

		if (action && typeof (action) === 'object') {
			if (typeof options === 'function') {
				callback = options;
			}
			options = action;
			passed = action;
			action = 'initialize';
		}

		// for each jQuery target object
		this.each(function () {
			// store reference to the currently processing jQuery object
			obj = $(this);

			getOptions(obj); // load the current options

			// Handle actions
			if (action && typeof (action) === 'string') {
				switch (action) {

				/**
				 * @function wayfinding
				 * @memberOf wayfinding
				 * @param {object} settings an object holding the settings to initialize the plugin with
				 * @param {function} [callback] optional callback that gets called once setup is completed.
				 * @example
				 * $('#myMaps').wayfinding({
				 * 	'maps': [
				 * 		{'path': 'test/fixtures/demo_map_1.svg', 'id': 'floor1'},
				 * 		{'path': 'test/fixtures/demo_map_2.svg', 'id': 'floor2'}
				 * 	],
				 * 	'startpoint': function () {
				 * 		return 'lcd.1';
				 * 	},
				 * 	'defaultMap': 'floor1',
				 * }, function(){
				 * 	console.log('callback reached');
				 * });
				 */

				/**
				 * @todo build out the rest of the options in the non maps version of the call
				 */

				case 'initialize':
					if (passed && passed.maps) {
						checkIds(obj);
						initialize(obj, function() { console.log(dataStore); });
					} else {
						if (passed && passed.showLocation !== undefined) {
							options.showLocation = passed.showLocation;
							setStartPoint(options.startpoint, obj);
						}
					}
					break;

				/**
				 * @function routeTo
				 * @name routeTo
				 * @public
				 * @memberOf wayfinding
				 * @example $('target').wayfinding('routeTo', 'doorID');
				 */
				case 'routeTo':
					// call method
					routeTo(passed, obj);
					break;

				/**
				 * @function animatePath
				 * @memberOf wayfinding
				 * @example $('target').wayfinding('animatePath');
				 */
				/**
				 * @todo add callback to animatePath
				 */
				case 'animatePath':
					hidePath(obj);
					animatePath(0);
					break;

				/**
				 * @function startpoint
				 * @memberOf wayfinding
				 * @param {string} newStartPoint a door ID specifying a new starting location
				 * @param {function} [callback]
				 * @example $('target').wayfinding('startpoint', 'R1001');
				 */

				/**
				 * @function startpoint
				 * @memberOf wayfinding
				 * @param {function} newStartPointFunction a door ID specifying a new starting location
				 * @param {function} [callback]
				 * @example $('target').wayfinding('startpoint', startpointFunction);
				 */
				case 'startpoint':
					// change the startpoint or startpoint for the instruction path
					if (passed === undefined) {
						result = startpoint;
					} else {
						setStartPoint(passed, obj);
						establishDataStore(callback);
					}
					break;
				case 'currentMap':
					// return and set
					if (passed === undefined) {
						result = $('div:visible', obj).prop('id');
					} else {
						switchFloor(passed, obj);
					}
					break;
				case 'accessibleRoute':
					// return and set
					if (passed === undefined) {
						result = options.accessibleRoute;
					} else {
						options.accessibleRoute = passed;
						establishDataStore(callback);
					}
					break;

				/**
				 * @function path
				 * @name path
				 * @memberOf wayfinding
				 * @Returns optional path if no param is passed
				 * @example getPath = $('target').wayfinding('path');
				 */

				/**
				 * @function path
				 * @name path
				 * @memberOf wayfinding
				 * @param {pathtype} nameNotSpecified sets options.path
				 * @Returns optional path if no param is passed
				 */

				case 'path':
					// return and set
					if (passed === undefined) {
						result = options.path;
					} else {
						options.path = $.extend(true, {}, options.path, passed);
					}
					break;

				/**
				 * @function getDataStore
				 * @name getDataStore
				 * @memberOf wayfinding
				 * @returns {string} a JSON object representing the current state of the map for a given startpoint and accessibility setting
				 * @example capture = $('target').wayfinding('getDataStore');
				 */

				case 'getDataStore':
					//shows JSON version of dataStore when called from console.
					//To facilitate caching dataStore.
					result = JSON.stringify(dataStore);
					break;
				case 'destroy':
					//remove all traces of wayfinding from the obj
					$(obj).remove();
					break;
				default:
					break;
				}
			}

			setOptions(obj);
		});

		if (result !== undefined) {
			return result;
		}

		return this;
	};
}(jQuery));

//  ]]>
