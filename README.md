Wayfinding
==========

jQuery plugin for interactive SVG maps. Wayfinding provides the shortest route through a series of one or more svg maps. It supports client side map processing or pretraversal of the maps with the server holding the cached traversals. It is useful for kiosks and interactive digital signage, but can also be used to share mobile maps.

---
### Steps we followed for Install & Setup
1. First, you need to have Emscripten installed. The Makefile uses **em++**.
2. Make sure npm is up to date. `npm install npm -g`
3. `npm install` in base directory to install all dependencies listed in
package.json
4. `bower install` in base directory to install all front-end library dependcies
(such as jQuery). If the command *bower* does not exist, install it with `npm
install bower -g`.
5. `grunt` in base directory to run all tasks such as validation, testing,
benchmarking, etc. If the command *grunt* does not exist, install it with `npm
install grunt`. Also might need to do `npm install grunt-cli -g`.
6. To generate documentation, `grunt jsdoc`. If it can't find conf file, go
to **node\_modules/grunt-jsdoc** and run `npm install ink-docstrap`
7. To get unit testing working, go to
**node\_modules/karma-phantomjs-loader** and run `npm install`. 
8. To see a list of all possible grunt tasks, `grunt --help`

---
### Issues we encountered
* **grunt** did not exist after doing `npm install`, so we added it to
  *package.json* using `npm install grunt --save-dev`
* **grunt jsdoc** was not working after doing `npm install` because ink-docstrap
  was missing inside **node\_modules/grunt-jsdoc**, so we had to manually run `npm
  install ink-docstrap` in that directory to get JSdoc working.
* Unit testing with Karma was not working after doing `npm install` with the
  error: 
  `
  Assertion failed: JS engine does not provide full typed array support' error
  again?
  `
  
  After searching online, this was a bug fixed in PhantomJS v2. The exisiting
  version of **karma-phantomjs-loader** was not using PhantomJS v2. We need at
  least v1 of karma-phantomjs-loader, so we upated the package.json
  devDependency for that module. 
  
  However, the dependencies of karma-phantomjs-loader are not automatically
  install by doing `npm install` in the root directory. We have to manually go
  to **node\_modules/karma-phantomjs-loader** and run `npm install` to get unit
  testing working.
* **grunt open:coverage** is broken with the warning:
  `
  Warning: Cannot read property 'toString' of undefined Use --force to continue.
  `
  
  We have commented it out on *line 56* so that `grunt benchmark` still works.
* **grunt datastore** does not work. When we try to run it, we get the error:
  `
  phantomjs-node: You don't have 'phantomjs' installed
  `
  
  Trying `npm install phantomjs --save-dev` does not fix the error.

___
![SVG File](http://i.imgur.com/Em7Lb5Z.jpg)
An example screenshot from a svg file

![Resulting Map with Route](http://i.imgur.com/EcwTNr4.jpg)
A screenshot showing the same region of the map with a route displayed

Developed at the UCD School of Law: [https://law.ucdavis.edu/information-technology/projects/wayfinding.html](https://law.ucdavis.edu/information-technology/projects/wayfinding.html)

Additional contributions from UCD Division of Social Science IT: [https://it.dss.ucdavis.edu/](https://it.dss.ucdavis.edu/)

Demo will be placed at : [http://ucdavis.github.io/wayfinding/](http://ucdavis.github.io/wayfinding/) -- demo to be incorporated into this project and revamped to be part of tests
