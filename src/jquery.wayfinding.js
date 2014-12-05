/*global document*/
/*jslint devel: true, browser: true, windows: true, plusplus: true, maxerr: 50, indent: 4 */

/**
 * @preserve
 * Wayfinding v0.4.0
 * https://github.com/ucdavis/wayfinding
 *
 * Copyright (c) 2010-2014 University of California Regents
 * Licensed under GNU General Public License v2
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Date: 2014-12-02
 *
 */

//  <![CDATA[

(function ($) {
	'use strict';

	var defaults = {
		// Defaults to a local file called floorplan.svg
		'maps': [{'path': 'floorplan.svg', 'id': 'map.1'}],
		// Path formatting
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
		// should dataStoreCache should be used
		// null is cache should not be used
		// string representing url if it should be used
		// object if cache is being passed
		'dataStoreCache': null,
		// if dataStoreCache is string, this is string
		// of url to accessible cache
		'accessibleDataStoreCache': null,
		// place marker for "you are here"
		'showLocation': false,
		//styling for the "you are here pin"
		'locationIndicator': {
			fill: 'red',
			height: 40
		},
		'pinchToZoom': false, // requires jquery.panzoom
		'zoomToRoute': true,
		'zoomPadding': 85,
		// milliseconds to wait during animation when a floor change occurs
		'floorChangeAnimationDelay': 1250
	};

	$.fn.wayfinding = function (action, options, callback) {
		var passed = options,
			obj, // the jQuery object being worked with;
			maps, // the array of maps populated from options each time
			defaultMap, // the floor to show at start propulated from options
			startpoint, // the result of either the options.startpoint value or the value of the function
			portalSegments = [], // used to store portal pieces until the portals are assembled, then this is dumped. This got moved to datastore
			result, // used to return non jQuery results
			drawing;

		//Takes x and y coordinates and makes a location indicating pin for those
		//coordinates. Returns the pin element, not yet attached to the DOM.
		function makePin(x, y, type) {
			var indicator,
			height,
			width,
			symbolPath;

			indicator = document.createElementNS('http://www.w3.org/2000/svg', 'path');

			$(indicator).attr('class', type);

			height = options.locationIndicator.height;
			width = height * 5 / 8;

			//draws map pin
			symbolPath = 'M ' + x + ' ' + y;
			//1st diagonal line
			symbolPath += ' l ' + width / 2 + ' ' + height * (-2) / 3;
			//curve over top
			//rx, ry
			symbolPath += ' a ' + width / 2 + ' ' + height / 3;
			//x-axis-rotation large-arc-flag sweep-flag
			symbolPath += ' 0 0 0 ';
			//dx, dy
			symbolPath += width * (-1) + ' 0 ';
			//close path
			symbolPath += 'Z';
			//finish with circle at center of pin
			symbolPath += ' m ' + height / (-8) + ' ' + height * (-2) / 3;
			symbolPath += ' a ' + height / 8 + ' ' + height / 8;
			symbolPath += ' 0 1 0 ';
			symbolPath += height / 4 + ' 0';
			symbolPath += ' a ' + height / 8 + ' ' + height / 8;
			symbolPath += ' 0 1 0 ';
			//drawing circle, right back where we started.
			symbolPath += height / (-4) + ' 0';

			indicator.setAttribute('d', symbolPath);
			indicator.setAttribute('fill', options.locationIndicator.fill);
			indicator.setAttribute('fill-rule', 'evenodd');
			indicator.setAttribute('stroke', 'black');

			return indicator;
		} //function makePin

		// Set the start point, and put a location indicator
		// in that spot, if feature is enabled.
		function setStartPoint(passed, el) {
			var start, attachPinLocation,
			x, y,
			pin;
			//clears locationIndicators from the maps
			$('path.locationIndicator', el).remove();

			// set startpoint correctly
			if (typeof(passed) === 'function') {
				options.startpoint = passed();
			} else {
				options.startpoint = passed;
			}

			startpoint = options.startpoint;

			if (options.showLocation) {
				start = $('#Doors #' + startpoint, el);

				var startMap = el.children().has($('#' + startpoint));
				attachPinLocation = $('svg', startMap).children().last();

				if (start.length) {
					x = (Number(start.attr('x1')) + Number(start.attr('x2'))) / 2;
					y = (Number(start.attr('y1')) + Number(start.attr('y2'))) / 2;

					pin = makePin(x, y, 'startPin');

					attachPinLocation.after(pin);
				} else {
					return; //startpoint does not exist
				}
			}
		} //function setStartPoint

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
			if (typeof(options.defaultMap) === 'function') {
				defaultMap = options.defaultMap();
			} else {
				defaultMap = options.defaultMap;
			}

			// Set startpoint correctly
			if (typeof(options.startpoint) === 'function') {
				setStartPoint(options.startpoint(), el);
			} else {
				startpoint = options.startpoint;
			}
		} //function getOptions

		function setOptions(el) {
			el.data('wayfinding:options', options);
			el.data('wayfinding:drawing', drawing);
			// need to handle cases where WayfindingDataStore isn't loaded if we are separating these out
			el.data('wayfinding:data', WayfindingDataStore.dataStore);
		}

		// Ensure floor ids are unique.
		function checkIds() {
			var mapNum,
				checkNum,
				reassign = false,
				defaultMapValid = false;

			if (maps.length > 0) {
				for (mapNum = 0; mapNum < maps.length; mapNum++) {
					for (checkNum = mapNum; checkNum < maps.length; checkNum++) {
						if (mapNum !== checkNum && maps[mapNum].id === maps[checkNum].id) {
							reassign = true;
						}
					}
				}

				if (reassign === true) {
					for (mapNum = 0; mapNum < maps.length; mapNum++) {
						maps[mapNum].id = 'map_' + mapNum;
					}
				}
				//check that defaultMap is valid as well

				for (mapNum = 0; mapNum < maps.length; mapNum++) {
					if (maps[mapNum].id === defaultMap) {
						defaultMapValid = true;
					}
				}

				if (defaultMapValid === false) {
					defaultMap = maps[0].id;
				}
			} /* else {
				// raise exception about no maps being found
			} */
		} //function checkIds

		function setEndPoint(passed, el) {
			var end, endpoint, attachPinLocation,
			x, y,
			pin;

			//clears locationIndicators from the maps
			$('path.destinationPin', el).remove();

			// Set endpoint
			endpoint = passed;

			if (options.showLocation) {
				end = $('#Doors #' + endpoint, el);

			attachPinLocation = $('svg').has('#Rooms a[id="' + passed + '"]');
				if (end.length) {
					x = (Number(end.attr('x1')) + Number(end.attr('x2'))) / 2;
					y = (Number(end.attr('y1')) + Number(end.attr('y2'))) / 2;

					pin = makePin(x, y, 'destinationPin');

					attachPinLocation.append(pin);
				} else {
					return; //endpoint does not exist
				}
			}
		} //function setEndPoint

		// Hide SVG div, hide path lines (they're data, not visuals), make rooms clickable
		function activateSVG(obj, svgDiv) {
			// Hide maps until explicitly displayed
			$(svgDiv).hide();

			// Hide route information
			$('#Paths line', svgDiv).attr('stroke-opacity', 0);
			$('#Doors line', svgDiv).attr('stroke-opacity', 0);
			$('#Portals line', svgDiv).attr('stroke-opacity', 0);

			// The following need to use the el variable to scope their calls: el is jquery element

			// Make rooms clickable
			$('#Rooms a', svgDiv).click(function (event) {
				$(obj).trigger('wayfinding:roomClicked', [ { room_id : $(this).attr('id') } ] );
				$(obj).wayfinding('routeTo', $(this).prop('id'));
				event.preventDefault();
			});

			// Disable clicking on every SVG element except rooms
			$(svgDiv).find('*').css("pointer-events", "none");
			$('#Rooms a', svgDiv).find('*').css("pointer-events", "auto");

			$(obj).append(svgDiv);

			// jQuery.panzoom() only works after element is attached to DOM
			if(options.pinchToZoom) initializePanZoom($(svgDiv));
		} //function activateSVG

		function replaceLoadScreen(el) {
			var displayNum,
			mapNum;

			$('#mapLoading').remove();

			// loop ensures defaultMap is in fact one of the maps
			displayNum = 0;
			for (mapNum = 0; mapNum < maps.length; mapNum++) {
				if (defaultMap === maps[mapNum].id) {
					displayNum = mapNum;
				}
			}

			// highlight starting floor
			$('#' + maps[displayNum].id, el).show();

			$(this).trigger('wayfinding:mapsVisible');

			// Ensure SVG w/h are divisble by 2 (to avoid webkit blurriness bug on pan/zoom)
			var elem = $('#' + maps[displayNum].id + '>svg', el)[0];
			$(elem).attr('height', (Math.ceil($(elem).outerHeight() / 2) * 2) + 'px');
			$(elem).attr('width', (Math.ceil($(elem).outerWidth() / 2) * 2) + 'px');

			// if endpoint was specified, route to there.
			if (typeof(options.endpoint) === 'function') {
				routeTo(options.endpoint());
			} else if (typeof(options.endpoint) === 'string') {
				routeTo(options.endpoint);
			}

			$.event.trigger('wayfinding:ready');
		} //function replaceLoadScreen

		// Initialize the jQuery target object
		function initialize(obj, callback) {
			var mapsProcessed = 0;

			// Load SVGs off the network
			$.each(maps, function (i, map) {
				var svgDiv = $('<div id="' + map.id + '"><\/div>');

				//create svg in that div
				svgDiv.load(
					map.path,
					function (svg, status, xhr) {
						if (status === 'error') {
							svgDiv.html("<p class='text-center text-danger'>Map " + i + " Was not found at "
								+ map.path + "<br />Please upload it in the administration section</p>");
							maps[i].el = svgDiv;
						}
						maps[i].svgHandle = svg;
						maps[i].el = svgDiv;

						WayfindingDataStore.cleanupSVG(maps[i].el);

						activateSVG(obj, svgDiv);

						mapsProcessed = mapsProcessed + 1;

						if(mapsProcessed === maps.length) {
							// All SVGs have finished loading
							establishDataStore(options.accessibleRoute, function() {
								// SVGs are loaded, dataStore is set, ready the DOM
								setStartPoint(options.startpoint, obj);
								setOptions(obj);
								replaceLoadScreen(obj);
								if (typeof callback === 'function') {
									callback();
								}
							});
						}
					}
				);
			});
		} // function initialize

		// Ensure a dataStore exists and is set, whether from a cache
		// or by building it.
		function establishDataStore(accessible, onReadyCallback) {
			if(accessible === undefined) {
				accessible = false;
			}

			if (options.dataStoreCache) {
				if (typeof(options.dataStoreCache) === 'object') {
					console.debug('Using passed dataStoreCache object.');

					WayfindingDataStore.dataStore = options.dataStoreCache;

					if(typeof(onReadyCallback) === 'function') {
						onReadyCallback();
					}
				} else if (typeof(options.dataStoreCache) === 'string') {
					console.debug("Attempting to load dataStoreCache from URL ...");
					var cacheUrl = accessible ? options.accessibleDataStoreCache : options.dataStoreCache;

					$.getJSON(cacheUrl, function (result) {
						console.debug('Using dataStoreCache from remote.');

						WayfindingDataStore.dataStore = result;

						if(typeof(onReadyCallback) === 'function') {
							onReadyCallback();
						}
					}).fail(function () {
						console.error('Failed to load dataStore cache from URL. Falling back to client-side dataStore generation.');

						WayfindingDataStore.dataStore = WayfindingDataStore.build(options.startpoint, maps, accessible);

						if(typeof(onReadyCallback) === 'function') {
							onReadyCallback();
						}
					});
				}
			} else {
				console.debug("No dataStore cache set, building with startpoint '" + options.startpoint + "' ...");

				WayfindingDataStore.dataStore = WayfindingDataStore.build(options.startpoint, maps, accessible);

				if(typeof(onReadyCallback) === 'function') {
					onReadyCallback();
				}
			}
		}

		// Called when animatePath() is switching the floor and also when
		function switchFloor(floor, el) {
			$('div', el).hide();

			$('#' + floor, el).show(0, function() {
				$(el).trigger('wayfinding:floorChanged', { map_id: floor });
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
					pathLength =  drawing[level].routeLength;

					// these next three are potentially redundant now
					$(drawing[level].path, el).attr('stroke-dasharray', [pathLength, pathLength]);
					$(drawing[level].path, el).attr('stroke-dashoffset', pathLength);
					$(drawing[level].path, el).attr('pathLength', pathLength);
					$(drawing[level].path, el).attr('stroke-dashoffset', pathLength);

					$(drawing[level].path, el).animate({svgStrokeDashOffset: 0}, pathLength * options.path.speed); //or move minPath to global variable?
				}
			}
		} //function switchFloor

		function hidePath(obj) {
			$('path[class^=directionPath]', obj).css({
				'stroke': 'none'
			});
		}

		// Applies linear interpolation to find the correct value
		// for traveling from value oldValue to newValue taking into account
		// that you are (i / steps) of the way through the process
		function interpolateValue(oldValue, newValue, i, steps) {
			return (((steps - i) / steps) * oldValue) + ((i / steps) * newValue);
		}

		function animatePath(drawing, drawingSegment) {
			var path,
			svg,
			pathRect,
			drawLength,
			oldViewBox,
			animationDuration,
			pad = options.zoomPadding;

			if (1 !== 1 && drawingSegment >= drawing.length) {
				// if repeat is set, then delay and rerun display from first.
				// Don't implement, until we have click to cancel out of this
				setTimeout(function () {
					animatePath(drawing, 0);
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
			if(options.zoomToRoute == false) {
				if(drawingSegment == (drawing.length - 1)) {
					$(path).one("webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend", function(e) {
						$(obj).trigger('wayfinding:animationComplete');
					});
				}
			}

			// Zooming logic...
			var steps = 35;
			var duration = 650; // Zoom animation in milliseconds

			// Store the original SVG viewBox in order to zoom out back to it after path animation
			var oldViewBox = svg.getAttribute('viewBox');
			var oldViewX = parseFloat(oldViewBox.split(/\s+|,/)[0]); // viewBox is [x, y, w, h], x == [0]
			var oldViewY = parseFloat(oldViewBox.split(/\s+|,/)[1]);
			var oldViewW = parseFloat(oldViewBox.split(/\s+|,/)[2]);
			var oldViewH = parseFloat(oldViewBox.split(/\s+|,/)[3]);

			// Calculate single step size from each direction
			var newViewX = pathRect.x - pad;
					newViewX = newViewX > 0 ? newViewX : 0;
			var newViewW = pathRect.width + (2 * pad);
			var newViewY = pathRect.y - pad;
					newViewY = newViewY > 0 ? newViewY : 0;
			var newViewH = pathRect.height + (2 * pad);

			if (options.zoomToRoute) {
				// Loop the specified number of steps to create the zoom in animation
				for (var i = 0; i <= steps; i++) {
					(function(i) {
						setTimeout(function() {
							var zoomInX = interpolateValue(oldViewX, newViewX, i, steps);
							var zoomInY = interpolateValue(oldViewY, newViewY, i, steps);
							var zoomInW = interpolateValue(oldViewW, newViewW, i, steps);
							var zoomInH = interpolateValue(oldViewH, newViewH, i, steps);

							if(options.pinchToZoom) {
								// Use CSS 3-based zooming
								panzoomWithViewBoxCoords($(svg).parent()[0], svg, zoomInX, zoomInY, zoomInW, zoomInH);
							} else {
								// Use SVG viewBox-based zooming
								svg.setAttribute('viewBox', zoomInX + ' ' + zoomInY + ' ' + zoomInW + ' ' + zoomInH);
							}
						}, i * (duration / steps));
					}(i));
				}
			}

			// Call animatePath after 'animationDuration' milliseconds to animate the next segment of the path,
			// if any.
			// Note: This is not tiny path 'segments' which form the lines curving around
			//       hallways but rather the other 'paths' needed on other floors, if any.
			setTimeout(function () {
				animatePath(drawing, ++drawingSegment);

				if (options.zoomToRoute) {
					// Loop the specified number of steps to create the zoom out animation
					// or set i = steps to force the zoom out immediately (used on floors
					// no longer visible to the user due to floor changes)
					var i;

					// Animate zoom out if we're on the last drawing segment, else
					// we can just reset the zoom out (improves performance, user will never notice)
					if((drawing.length == 1) || ((drawing.length > 1) && (drawingSegment == drawing.length))) {
						i = 0; // apply full animation
					} else {
						i = steps; // effectively removes animation and resets the zoom out (only triggered on floors where the user
					}

					for ( ; i <= steps; i++) {
						(function(i) {
							setTimeout(function() {
								var zoomOutX = interpolateValue(newViewX, oldViewX, i, steps);
								var zoomOutY = interpolateValue(newViewY, oldViewY, i, steps);
								var zoomOutW = interpolateValue(newViewW, oldViewW, i, steps);
								var zoomOutH = interpolateValue(newViewH, oldViewH, i, steps);

								if(options.pinchToZoom) {
									// Use CSS 3-based zooming
									panzoomWithViewBoxCoords($(svg).parent()[0], svg, zoomOutX, zoomOutY, zoomOutW, zoomOutH);
								} else {
									svg.setAttribute('viewBox', zoomOutX + ' ' + zoomOutY + ' ' + zoomOutW + ' ' + zoomOutH);
								}

								if(i === steps) {
									if(drawingSegment === drawing.length) {
										$(obj).trigger('wayfinding:animationComplete');
									}
								}
							}, i * (duration / steps));
						}(i));
					}
				}
			}, animationDuration + options.floorChangeAnimationDelay);
		} //function animatePath

		// Ensures '$el' has a valid jQuery.panzoom object
		function initializePanZoom($el) {
			$el.panzoom({
				minScale: 1.0,
				contain: 'invert',
				cursor: 'pointer'
			});

			// Allow clicking on links within the SVG despite $.panZoom()
			$el.find('a').on('mousedown touchstart', function( e ) {
				e.stopImmediatePropagation();
			});
		} //function initializePanZoom

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
			var scale = Math.max(( viewW / w ), ( viewH / h ));

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

		// The combined routing function
		// revise to only interate if startpoint has changed since last time?
		function routeTo(destination) {
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
				drawLength,
				thisPath,
				pick;

			options.endpoint = destination;

			// remove any prior paths from the current map set
			$('path[class^=directionPath]', obj).remove();

			//clear all rooms
			$('#Rooms *.wayfindingRoom', obj).removeAttr('class');

			var solution = [];

			//if startpoint != destination
			if (startpoint !== destination) {
				// get accessibleRoute option -- options.accessibleRoute

				//highlight the destination room
				$('#Rooms a[id="' + destination + '"] g', obj).attr('class', 'wayfindingRoom');
				setEndPoint(options.endpoint);
				solution = WayfindingDataStore.getShortestRoute(maps, destination, startpoint).solution;

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
					if (WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].doorA[0] === startpoint) {
						draw = {};
						draw.floor = solution[0].floor; //[solution[0].floor];
						draw.type = 'M';
						draw.x = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].ax;
						draw.y = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].ay;
						draw.length = 0;
						drawing[0].push(draw);
						draw = {};
						draw.type = 'L';
						draw.floor = solution[0].floor; //[solution[0].floor];
						draw.x = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].bx;
						draw.y = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].by;
						draw.length = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].length;
						drawing[0].push(draw);
						drawing[0].routeLength = draw.length;
					} else if (WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].doorB[0] === startpoint) {
						draw = {};
						draw.type = 'M';
						draw.floor = solution[0].floor; //[solution[0].floor];
						draw.x = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].bx;
						draw.y = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].by;
						draw.length = 0;
						drawing[0].push(draw);
						draw = {};
						draw.type = 'L';
						draw.floor = solution[0].floor; //[solution[0].floor];
						draw.x = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].ax;
						draw.y = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].ay;
						draw.length = WayfindingDataStore.dataStore.paths[solution[0].floor][solution[0].segment].length;
						drawing[0].push(draw);
						drawing[0].routeLength = draw.length;
					}

					lastStep = 1;

					// for each floor that we have to deal with
					for (i = 0; i < portalsEntered + 1; i++) {
						for (stepNum = lastStep; stepNum < solution.length; stepNum++) {
							if (solution[stepNum].type === 'pa') {
								ax = WayfindingDataStore.dataStore.paths[solution[stepNum].floor][solution[stepNum].segment].ax;
								ay = WayfindingDataStore.dataStore.paths[solution[stepNum].floor][solution[stepNum].segment].ay;
								bx = WayfindingDataStore.dataStore.paths[solution[stepNum].floor][solution[stepNum].segment].bx;
								by = WayfindingDataStore.dataStore.paths[solution[stepNum].floor][solution[stepNum].segment].by;

								draw = {};
								draw.floor = solution[stepNum].floor;
								if (drawing[i].slice(-1)[0].x === ax && drawing[i].slice(-1)[0].y === ay) {
									draw.x = bx;
									draw.y = by;
								} else {
									draw.x = ax;
									draw.y = ay;
								}
								draw.length = WayfindingDataStore.dataStore.paths[solution[stepNum].floor][solution[stepNum].segment].length;
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
								if (WayfindingDataStore.dataStore.portals[solution[stepNum].segment].floorANum === WayfindingDataStore.dataStore.portals[solution[stepNum].segment].floorBNum) {
									if (WayfindingDataStore.dataStore.portals[solution[stepNum].segment].xA === draw.x && WayfindingDataStore.dataStore.portals[solution[stepNum].segment].yA === draw.y) {
										pick = 'B';
									} else {
										pick = 'A';
									}
								} else {
									if (WayfindingDataStore.dataStore.portals[solution[stepNum].segment].floorANum === solution[stepNum].floor) {
										pick = 'A';
									} else if (WayfindingDataStore.dataStore.portals[solution[stepNum].segment].floorBNum === solution[stepNum].floor) {
										pick = 'B';
									}
								}
								if (pick === 'A') {
									draw = {};
									draw.floor = solution[stepNum].floor;
									draw.type = 'M';
									draw.x = WayfindingDataStore.dataStore.portals[solution[stepNum].segment].xA;
									draw.y = WayfindingDataStore.dataStore.portals[solution[stepNum].segment].yA;
									draw.length = 0;
									drawing[i + 1].push(draw);
									drawing[i + 1].routeLength = draw.length;
								} else if (pick === 'B') {
									draw = {};
									draw.floor = solution[stepNum].floor;
									draw.type = 'M';
									draw.x = WayfindingDataStore.dataStore.portals[solution[stepNum].segment].xB;
									draw.y = WayfindingDataStore.dataStore.portals[solution[stepNum].segment].yB;
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
									curve =  {};
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

					$.each(drawing, function (i, level) {
						var path = '',
							newPath;
						$.each(level, function (j, stroke) {
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
							newPath.classList.add('directionPath' + i);
						} else {
							newPath.setAttribute('class', 'directionPath' + i);
						}


						// Attach the newpath to the startpin or endpin if they exist on this floor
						var attachPointSvg = $('#' + maps[level[0].floor].id + ' svg');
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

						thisPath = $('#' + maps[level[0].floor].id + ' svg .directionPath' + i);

						drawing[i].path = thisPath;

						drawLength = drawing[i].routeLength;

					});

					animatePath(drawing, 0);

					//on switch which floor is displayed reset path svgStrokeDashOffset to minPath and the reanimate
					//notify animation loop?
				}
			}
		} //RouteTo

		if (WayfindingDataStore == null) {
			console.error('Please include wayfinding.datastore.js before jquery.wayfinding.js.');
		}

		if (action && typeof (action) === 'object') {
			if (typeof options === 'function') {
				callback = options;
			}
			options = action;
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
				case 'initialize':
					checkIds();
					initialize(obj, callback);
					break;
				case 'routeTo':
					// call method
					routeTo(passed);
					break;
				case 'animatePath':
					hidePath(obj);
					animatePath(drawing, 0);
					break;
				case 'startpoint':
					// change the startpoint or startpoint for the instruction path
					if (passed === undefined) {
						result = startpoint;
					} else {
						setStartPoint(passed);
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

						establishDataStore(options.accessibleRoute, callback);
					}
					break;
				case 'path':
					// return and set
					if (passed === undefined) {
						result = options.path;
					} else {
						options.path = $.extend(true, {}, options.path, passed);
					}
					break;
				case 'zoom':
					if (passed === undefined) {
						result = {x: 0, y: 0, z: 0};
					} else {
						if (passed === 'reset') {
							// reset zoom
							alert('reset zoom');
						} else {
							// accept object and set zoom
							alert('zoom to');
						}
					}
					break;
				case 'checkMap':
					//handle exception report.
					//set result to text report listing non-reachable doors
					result = checkMap(obj);
					break;
				case 'getDataStore':
					//shows JSON version of dataStore when called from console.
					//To facilitate caching dataStore.
					result = JSON.stringify(WayfindingDataStore.dataStore);
					$('body').replaceWith(result);
					break;
				case 'getRoutes':
					//gets the length of the shortest route to one or more
					//destinations.
					if (passed === undefined) {
						result = WayfindingDataStore.getShortestRoute(maps, options.endpoint, startpoint);
					} else {
						result = WayfindingDataStore.getShortestRoute(maps, passed, startpoint);
					}
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
