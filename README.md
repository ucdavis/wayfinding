Wayfinding
==========

jQuery plugin for interactive SVG maps. Wayfinding provides the shortest route through a series of one or more svg maps. It supports client side map processing or pretraversal of the maps with the server holding the cached traversals. It is useful for kiosks and interactive digital signage, but can also be used to share mobile maps.

---
### Install & Setup
0. First, make sure npm is up to date. `npm install npm -g`
1. `npm install` in base directory to install all dependencies listed in
package.json
2. `bower install` in base directory to install all front-end library dependcies
(such as jQuery). If the command *bower* does not exist, install it with `npm
install bower -g`.
3. `grunt` in base directory to run all tasks such as validation, testing,
benchmarking, etc. If the command *grunt* does not exist, install it with `npm
install grunt`. Also might need to do `npm install grunt-cli -g`.
4. To generate documentation, `grunt jsdoc`. If it can't find conf file, go
to **node\_modules/grunt-jsdoc** and run `npm install ink-docstrap`
5. To get unit testing working, go to
**node\_modules/karma-phantomjs-loader** and run `npm install`. 
6. To see a list of all possible grunt tasks, `grunt --help`

---

![SVG File](http://i.imgur.com/Em7Lb5Z.jpg)
An example screenshot from a svg file

![Resulting Map with Route](http://i.imgur.com/EcwTNr4.jpg)
A screenshot showing the same region of the map with a route displayed

Developed at the UCD School of Law: [https://law.ucdavis.edu/information-technology/projects/wayfinding.html](https://law.ucdavis.edu/information-technology/projects/wayfinding.html)

Additional contributions from UCD Division of Social Science IT: [https://it.dss.ucdavis.edu/](https://it.dss.ucdavis.edu/)

Demo will be placed at : [http://ucdavis.github.io/wayfinding/](http://ucdavis.github.io/wayfinding/) -- demo to be incorporated into this project and revamped to be part of tests
