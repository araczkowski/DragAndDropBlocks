DragAndDropBlocks (Dadb)
===================

Oracle APEX plugin/widget with blocks drag & drop interaction.
Live example at jsFiddle http://jsfiddle.net/araczkowski/t3vj8wjr/embedded/result/


![alt tag](https://raw.githubusercontent.com/araczkowski/MultiRangeSlider/master/app/images/dadb.png)


TODO
===========================

develop the plugin


How To Start (to develop the plugin)
===========================

**NPM**
```javascript
npm install
```

**Bower**
```javascript
bower install
```

**Grunt**
```javascript
grunt serve
```


Dadb class constructor
===========================
**Dadb**
```javascript
/**
* @class Dadb
*
* @constructor
* @param {String} elementId, this id will be used to create jQuery selector
* @param {Object} userOptions (optional) Custom options object that overrides default
* {
*      @property {Number} userOptions.min Block minimum value
*      @property {Number} userOptions.max Block maximum value
*      @property {Number} userOptions.step Block step
*      @property {Object} userOptions.stepLabelDispFormat Dadb step Label format default hh24
*      @property {Array} userOptions.blocksToolbar  blocks definition for blocks toolbar blocksArray example: Array([{value: 30}, {value: 60}, {value: 120}...])
* }
*/

myCustomId.Dadb = function(elementId, userOptions) {}
```


Dadb class interface
=========================


**addBlocks**
```javascript
/**
 * Adds multiple block to the slider scale
 * @param {Array} blocksArray example: Array([[660, 30],[990, 60]...])
 * @return {Object} self instance of Dadb class
 */

Dadb.addBlocks = function(blocksArray) {}
```

=
**getBlocks**
```javascript
/**
 * Gets all blocks for this Dadb instance
 * @return {Array} of each block.toPublic() object
 */

Dadb.getBlocks = function() {}
```
=========================




