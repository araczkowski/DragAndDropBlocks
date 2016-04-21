'use strict';

(function (w, $) {

	/**
	 * @class Dadb
	 *
	 * @constructor
	 * @param {String} parentId, this id will be used to create jQuery selector and apped a module code to this id
	 * @param {Object} userOptions (optional) Custom options object that overrides default
	 * {
	 *      @property {Number} userOptions.min Slider minimum value
	 *      @property {Number} userOptions.max Slider maximum value
	 *      @property {Number} userOptions.step Slider sliding step
	 *      @property {Object} userOptions.stepLabelDispFormat mrs step Label format default hh24
	 *      @property {Object} userOptions.toolbarId element ID when the toolbar shoud by created
	 *      @property {Object} userOptions.blocksToolbar array of objects with blocks description
	 *      @property {Object} userOptions.openBlocks array of array with open blocks data
	 * }
	 */
	w.Dadb = function (parentId, userOptions) {
		var _stepLabelDispFormat = function (steps) {
			var hours = Math.floor(Math.abs(steps) / 60);
			return Math.abs(steps) % 60 === 0 ? ((hours < 10 && hours >= 0) ? '0' : '') + hours : '';
		};
		var _blocksToolbar = [{
			'code': 'K30',
			'value': 30,
			'blockId': 2,
			'class': 'Kids',
			'attributes': [{
				'COL_Toolbar': '#ff7c34'
			}]
		}, {
			'code': 'K60',
			'value': 60,
			'blockId': 3,
			'class': 'Kids',
			'attributes': [{
				'COL_Toolbar': '#ff7c34'
			}]
		}, {
			'code': 'K120',
			'value': 120,
			'blockId': 4,
			'class': 'Kids',
			'attributes': [{
				'COL_Toolbar': '#ff7c34'
			}]
		}];

		var _options = {
			min: 0,
			max: 1440,
			step: 15,
			stepWidth: 17,
			stepLabelDispFormat: _stepLabelDispFormat,
			toolbarId: 'blocksToolbar',
			attToolbarId: '',
			blocksToolbar: _blocksToolbar,
			openBlocks: [],
			dragDiv: '',
			lastX: 0,
			lastY: 0,
			hoveredDivs: {}
		};

		var _onAddBlock = null,
			_onDeleteBlock = null;


		function _init() {
			_mergeOptions();
			if ((_options.max - _options.min) % _options.step !== 0) {
				throw 'Blocks length should be multiple to step';
			}
			_build();
			_createBlocksToolbar();
			_openBlocks();
		}


		function _build() {
			$('#steps_' + parentId).remove();
			$('#' + parentId).append('<div id="steps_' + parentId + '" class="DadbSteps"></div>');
			var eSteps = $('#steps_' + parentId);
			var nSteps = (_options.max - _options.min) / _options.step;
			var clickStep = 0;
			var contentClass = '';
			var stepClass = '';
			for (var i = 0; nSteps > i; i++) {
				clickStep = (i * _options.step) % 60;
				if (clickStep === 0) {
					contentClass = 'DadbStepContentFullHour';
					stepClass = 'DadbStepFullHour';
				} else if (clickStep === 30) {
					contentClass = 'DadbStepContentHalfHour';
					stepClass = 'DadbStepHalfHour';
				} else {
					contentClass = 'DadbStepContentQuarter';
					stepClass = 'DadbStepQuarter';
				}
				if (i === 0) {
					contentClass = contentClass + ' DadbStepContentStart';
					stepClass = stepClass + ' DadbStepStart';
				}
				if (i === nSteps - 1) {
					contentClass = contentClass + ' DadbStepContentEnd';
					stepClass = stepClass + ' DadbStepEnd';
				}
				var stepValue = _options.min + (i * _options.step);
				$('<div/>', {
					'id': 'step_' + parentId + '_' + (Number(i) + 1),
					'class': stepClass + ' DadbStep',
					'style': 'width:' + _options.stepWidth + 'px',
					'data-start': stepValue,
					'html': '<span class="DadbTick">' + _options.stepLabelDispFormat(stepValue) + '</span><div class="DadbStepContent ' + contentClass + '"></div></div>'
				}).appendTo(eSteps);
			}

			$('#steps_' + parentId).append('<div><span class="DadbTick">' + _options.stepLabelDispFormat(_options.min + (nSteps * _options.step)) + '</span></div>');

			//
			$('#steps_' + parentId).width(nSteps * _options.stepWidth) + 'px';
		}

		function _mergeOptions() {
			if (!userOptions) {
				return _options;
			}
			if (typeof (userOptions) === 'string') {
				userOptions = JSON.parse(userOptions);
			}

			if (typeof (userOptions.blocksToolbar) !== 'undefined') {
				if (typeof (userOptions.blocksToolbar) === 'string') {
					userOptions.blocksToolbar = JSON.parse(userOptions.blocksToolbar);
				}
			}

			if (typeof (userOptions.openBlocks) !== 'undefined') {
				if (typeof (userOptions.openBlocks) === 'string') {
					userOptions.openBlocks = JSON.parse(userOptions.openBlocks);
				}
			}

			if (typeof (userOptions.stepLabelDispFormat) !== 'undefined') {
				if (typeof (userOptions.stepLabelDispFormat) === 'string') {
					/* jshint ignore:start */
					var fn;
					eval('fn = ' + userOptions.stepLabelDispFormat);
					userOptions.stepLabelDispFormat = fn;
					/* jshint ignore:end */
				}
			}
			for (var optionKey in _options) {
				if (optionKey in userOptions) {
					switch (typeof _options[optionKey]) {
					case 'boolean':
						_options[optionKey] = !!userOptions[optionKey];
						break;
					case 'number':
						_options[optionKey] = Math.abs(userOptions[optionKey]);
						break;
					case 'string':
						_options[optionKey] = '' + userOptions[optionKey];
						break;
					default:
						_options[optionKey] = userOptions[optionKey];
					}
				}
			}
			return _options;
		}

		function _addBlocksToTolbar(selector, blocksArray) {
			var eBlocks = $(selector);
			for (var i = 0; i < blocksArray.length; i++) {
				var block = $('<div/>', {
					'id': 'block' + blocksArray[i].value,
					'class': 'DadbDraggableBlock DadbTemplate ' + blocksArray[i].class, //class,
					'data-block-id': blocksArray[i].blockId,
					'data-code': blocksArray[i].code,
					'data-name': blocksArray[i].name,
					'data-value': blocksArray[i].value,
					'data-parentId': parentId,
					'html': '<span> <i class = "DadbHandle fa fa-arrows"></i></span>',
				}).appendTo(eBlocks);

				//attributes
				for (var n = 0; n < blocksArray[i].attributes.length; n++) {
					var obj = blocksArray[i].attributes[n];
					var k = '';
					var v = '';
					for (var key in obj) {
						k = key;
						v = obj[key];
					}
					block.attr('data-' + k, v);
				}
				var backgr = block.data('col_toolbar');
				block.attr('data-color', backgr);
				block.attr('style', 'width:' + (blocksArray[i].value / _options.step) * _options.stepWidth + 'px; background: ' + backgr + ';');
			}
			return;
		}



		function _createBlocksToolbar() {
			// add a toolbar with blocks only if not exitst on page otherwise reuse
			if ($('#' + _options.toolbarId).length === 0) {
				$('#' + parentId).parent().append('<div id="' + _options.toolbarId + '" class="DadbSource"></div>');
			}
			_addBlocksToTolbar('#' + _options.toolbarId, _options.blocksToolbar);
			_createDroppable();
			_createDraggable();
			_createStampable();
		}

		function _onOver(event, div) {
			// only if elemet is overed
			if (!div) {
				return;
			}

			// take the properties of the overed element
			var blockDataValue;
			var blockParentId;
			var targetDiv;

			try {
				//stamp
				blockDataValue = div.attr('data-value');
				blockParentId = div.attr('data-parentId');
				targetDiv = $(event.currentTarget);
				//$(event.toElement).closest('div.DadbStep');
			} catch (e) {
				try {
					// drag and drop
					blockDataValue = div.draggable.attr('data-value');
					blockParentId = div.draggable.attr('data-parentId');
					targetDiv = $(this);
				} catch (e) {
					return;
				}
			}

			// only blocks
			if (typeof (blockDataValue) === 'undefined') {
				$(div.helper).css('color', 'red');
				return;
			}

			var className;
			//allow the drop only for the blocks from the same instance
			if (blockParentId === parentId) {
				//
				var nSteps = (blockDataValue / _options.step);
				var oldHoveredDivs = _options.hoveredDivs;
				var hoveredDivs = _getHoveredDivs(targetDiv, div, nSteps, event);
				if (hoveredDivs !== oldHoveredDivs) {
					if (nSteps !== hoveredDivs.DadbEmpty.length) {
						className = 'DadbHighlightNOK';
					} else {
						className = 'DadbHighlightOK';
					}

					//
					_removeHighlight();

					// add a visual efect
					var l = hoveredDivs.DadbStep.length;


					for (var i = 0; i < l; i++) {
						if (i == 0) {
							hoveredDivs.DadbStep[i].addClass(className + 'start');
						}
						hoveredDivs.DadbStep[i].addClass(className);
						if (i == l - 1) {
							hoveredDivs.DadbStep[i].addClass(className + 'end');
						}
					}
				}

			} else {
				//
				_removeHighlight();
				$('#' + parentId + ' .DadbStep').addClass('DadbHighlightNOK');
			}
		}

		function _createDroppable(el) {
			// Droppabe
			$(el || '#steps_' + parentId + '.DadbSteps .DadbStep').droppable({
				tolerance: 'pointer',
				revert: true,
				over: _onOver,
				drop: function (ev, div) {
					_removeHighlight();

					//allow the drop only for the blocks from the same instance
					var blockParentId = div.draggable.attr('data-parentId');
					if (blockParentId === parentId) {
						var nSteps = (div.draggable.attr('data-value') / _options.step);
						var hoveredSteps = _getHoveredDivs($(this), div, nSteps);
						if (hoveredSteps.DadbEmpty.length !== nSteps) {
							div.draggable.effect('shake', {
								distance: 10,
								times: 3
							}, 300);
							return;
						}
						_addSteps(hoveredSteps.DadbEmpty, div.draggable.attr('data-value'), div.draggable.attr('data-color'), div.draggable.attr('data-block-id'), div.draggable.attr('data-att-id'), div.draggable.attr('data-att-class'));

					}
				}
			});
		}

		function _createDraggable() {
			// Draggable
			$('div.DadbDraggableBlock').draggable({
				appendTo: 'body',
				helper: 'clone',
				revert: 'invalid',
				//snap: '.DadbSteps .DadbStep',
				handle: 'span i.DadbHandle',
				greedy: true,
				reverting: function () {
					_removeHighlight();
				},
				start: function (ev, div) {
					div.helper.width($(this).width());
				},
				stop: function (ev, div) {
					div.helper.width($(this).width());
				}
			});

			//
			$('div.draggable, .DadbSteps .DadbStep').disableSelection();
		}

		//STAMP START
		// Fires on mousemove and updates element position
		function _startStampDrag(e) {
			// Only update last known mouse position if an event object
			// was passed through (mousemove event).
			if (e) {
				_options.lastX = e.pageX;
				_options.lastY = e.pageY;
			}

			// If an element is being dragged, update the helper's position.
			if (_options.dragDiv) {
				_options.dragDiv.css({
					top: _options.lastY,
					left: _options.lastX
				});
			}
		}

		function _stopStampDrag() {
			// Remove the helper from the DOM and clear the variable.
			if (_options.dragDiv) {
				_options.dragDiv.remove();
				_options.dragDiv = null;
			}
			//remove class stamp from this range toolbar
			$('div.DadbDraggableBlock[data-parentid="' + parentId + '"]').removeClass('Stamp');
			//unbing the click from the block's range
			$('#steps_' + parentId + '.DadbSteps .DadbStep').unbind('click');
		}

		//
		function _createStampable() {
			// stop when cancel is clicked
			$(document).keyup(function (e) {
				// esc
				if (e.keyCode === 27) {
					_removeHighlight();
					_stopStampDrag();
					// Remove all the "FlyingStamps" from body
					$('div.DadbDraggableBlock.FlyingStamp').remove();
				}
			});

			// hover efect
			$('#steps_' + parentId + '.DadbSteps .DadbStep').mouseover(function (event) {
				_onOver(event, _options.dragDiv);
			});

			// when click on block in blocks toolbar - take the block as a stamp
			$('div.DadbDraggableBlock[data-parentid="' + parentId + '"]').unbind('click').click(function (e) {
				//e.stopPropagation();
				_removeHighlight();
				// set the current mouse possition
				if (e) {
					_options.lastX = e.pageX;
					_options.lastY = e.pageY;
				}

				if ($(this).hasClass('Stamp')) {
					// sipmply put the stamp back
					_stopStampDrag();
				} else {
					//switch stamps
					if (_options.dragDiv) {
						_stopStampDrag();
					}
					// take new stamplowe the select block as a stamp only if it not selected
					$(this).addClass('Stamp');
					// Start dragging this block
					$(document).mousemove(_startStampDrag);
					_options.dragDiv = $(this).clone().addClass('FlyingStamp').css('position', 'absolute').appendTo('body');
					// Fire the dragging event to update the helper's position
					_startStampDrag();

					// add click on time range
					$(document).unbind('click', _addClickOnToPutBlock).click(_addClickOnToPutBlock);
				}
			});
		}

		function _addClickOnToPutBlock(e) {
			// Only do something is an element is being dragged
			if (_options.dragDiv) {
				var x = e.pageX - _options.hoveredDivs.lastX;
				var y = e.pageY - _options.hoveredDivs.lastY;
				var z = Math.sqrt(x * x + y * y);
				if (z < 15) {
					// the block should be dropped to the range...
					_removeHighlight();
					var nSteps = (_options.dragDiv.attr('data-value') / _options.step);
					if (_options.hoveredDivs.DadbEmpty.length !== nSteps) {
						_options.dragDiv.effect('shake', {
							distance: 6,
							times: 3
						}, 200);
						return;
					}
					_addSteps(_options.hoveredDivs.DadbEmpty, _options.dragDiv.attr('data-value'), _options.dragDiv.attr('data-color'), _options.dragDiv.attr('data-block-id'), _options.dragDiv.attr('data-att-id'), _options.dragDiv.attr('data-att-class'));
				}
				_removeHighlight();
			}
		}
		//STAMP END

		// to get array with currently hovered divs
		function _getHoveredDivs(firstElement, blockDiv, nSteps, e) {

			var id = firstElement.attr('id');
			_options.hoveredDivs = {};
			_options.hoveredDivs.DadbStep = [];
			_options.hoveredDivs.DadbEmpty = [];
			var step;
			var div;

			for (var i = 0; i < nSteps; i++) {
				step = Number(id.replace('step_' + parentId + '_', '')) + Number(i);
				div = $('#step_' + parentId + '_' + step);
				if (div.hasClass('DadbStep')) {
					_options.hoveredDivs.DadbStep.push(div);
				}
				if (div.hasClass('DadbEmpty')) {
					_options.hoveredDivs.DadbEmpty.push(div);
				}
			}
			if (e) {
				_options.hoveredDivs.lastX = e.pageX;
				_options.hoveredDivs.lastY = e.pageY;
			}
			return _options.hoveredDivs;
		}

		function _removeHighlight() {
			$('div.DadbStep').removeClass('DadbHighlightNOK').removeClass('DadbHighlightOK').removeClass('DadbHighlightOKstart').removeClass('DadbHighlightOKend').removeClass('DadbHighlightNOKstart').removeClass('DadbHighlightNOKend');
		}

		function _addStepAtt(bStep, attId, attClass) {
			$('<i/>', {
				'class': attClass + ' fa',
				'data-att-id': attId,
				'data-att-class': attClass
			}).appendTo(bStep);
		}


		function _addSteps(bSteps, value, color, blockId, attId, attClass) {
			//
			// this steps were already planned
			if (bSteps[0].hasClass('DadbPlannedBlockBody')) {
				return;
			}

			var guid = _getGuid();

			for (var i = 0; i < bSteps.length; i++) {
				bSteps[i].removeClass('DadbEmpty');
				bSteps[i].addClass('DadbPlannedBlockBody');
				//bSteps[i].addClass('DadbPlannedBlock_' + bSteps[0].attr('id'));
				bSteps[i].attr('data-block-id', blockId || guid);
				bSteps[i].attr('data-block-selector', 'DadbPlannedBlock_' + bSteps[0].attr('id'));
				bSteps[i].attr('data-color', color);
				bSteps[i].css({
					'background-clip': 'border-box ',
					'background': color
				});
				//background-clip -IE11 renders white lines when border-radius is applied 

				if (i === 0) {
					bSteps[i].addClass('DadbPlannedBlockStart');
					bSteps[i].find('div').prepend('<span class="DadbCloser"><i class="DadbHandle fa fa-times"></i></span>').on('click', function (event) {
						event.stopPropagation();
						_removeBlock(this);
					});
					bSteps[i].attr('data-value', value);
				}

				if (i === bSteps.length - 1) {
					bSteps[i].addClass('DadbPlannedBlockEnd');
					if (typeof (attId) !== 'undefined') {
						if (attId.length) {
							//meal is hardcoded
							_addStepAtt(bSteps[i], attId, attClass);
						}
					}
				}
			}

			if (typeof (_onAddBlock) === 'function') {
				_onAddBlock();
			}
		}

		// to remove the blocks from slider
		function _removeBlock(e) {
			var id = $(e).closest('div').parent().attr('id');
			var selector = 'DadbPlannedBlock_' + id;
			var blocks = $('[data-block-selector=' + selector + ']');
			blocks.removeClass('DadbPlannedBlockBody').removeClass('DadbPlannedBlockStart').removeClass('DadbPlannedBlockEnd').addClass('DadbEmpty');
			blocks.css('background-color', '');
			//$(selector + ' span.DadbCloser').remove();
      blocks.removeAttr('data-value');
      blocks.removeAttr('data-block-id');
      blocks.removeAttr('data-block-selector');
      blocks.removeAttr('data-color');
			$('#' + id + '> div.DadbStepContent').empty();
			$('#' + id + '>' + ' div.DadbStepContent').unbind('click');
			_createDroppable($(selector));

			if (typeof (_onDeleteBlock) === 'function') {
				_onDeleteBlock();
			}
		}

		function _getStepssInRange(start, value) {
			var steps = [];
			var startId = Number(start / _options.step) - Number(_options.min / _options.step) + 1;
			var stepsNo = value / _options.step;

			for (var n = 0; n < stepsNo; n++) {
				var step = (Number(startId) + n);
				steps.push($('#step_' + parentId + '_' + step));
			}
			return steps;
		}

		function _openBlocks() {
			_options.openBlocks.forEach(function (block) {
				var b = (_getStepssInRange(block[0], block[1]));
				for (var i = 0; i < b.length; i++) {
					b[i].addClass('DadbEmpty');
					b[i].attr('data-range-id', block[2]);
				}
			});
		}

		function _getGuid() {
			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000)
					.toString(16)
					.substring(1);
			}
			return function () {
				return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
					s4() + '-' + s4() + s4() + s4();
			};
		}


		/**
		 * Adds multiple blocks to the block's scale
		 * @param {Object} ArrayOfBlocksObjects example: Array([{"start": 990, "value": 60, "planned": 0, "col_planned": "#dff0d8"},...])
		 * @return {Object} self instance of DadB class
		 */
		this.addBlocks = function (ArrayOfBlocksObjects) {
			if (typeof (ArrayOfBlocksObjects) === 'string') {
				ArrayOfBlocksObjects = JSON.parse(ArrayOfBlocksObjects);
			}
			var stepsToAdd = [];
			for (var i = 0; i < ArrayOfBlocksObjects.length; i++) {
				stepsToAdd = _getStepssInRange(ArrayOfBlocksObjects[i].start, ArrayOfBlocksObjects[i].value);
				_addSteps(stepsToAdd, ArrayOfBlocksObjects[i].value, ArrayOfBlocksObjects[i].backgroundColor, ArrayOfBlocksObjects[i].blockId, ArrayOfBlocksObjects[i].attId, ArrayOfBlocksObjects[i].attClass);
			}
			return this;
		};


		/**
		 * Gets all blocks for this Dadb instance
		 * @return {Array} of blocks
		 */
		this.getBlocks = function () {
			var blocks = [];
			var _blocks = $('div#' + parentId + ' .DadbPlannedBlockStart');
			if (_blocks.length > 0) {
				_blocks.each(function (i, e) {
					var block = {};
					block.blockId = e.getAttribute('data-block-id');
					block.start = e.getAttribute('data-start');
					block.value = e.getAttribute('data-value');
					block.rangeId = e.getAttribute('data-range-id');
					block.backgroundColor = e.getAttribute('data-color');
					blocks.push(block);
				});
			}
			return JSON.stringify(blocks);
		};

		/**
		 * Sets callback function that can be used when the plugin value will change
		 *
		 * @param {Function} callbackFunction
		 *      stores a callback function
		 *
		 * @example
		 *      mrs.setOnChangeCallback(function(callback));
		 * @return {Object} self instance of Mrs class
		 */
		this.setOnChangeCallback = function (callbackFunction) {
			if (typeof (callbackFunction) === 'function') {
				_onAddBlock = callbackFunction;
				_onDeleteBlock = callbackFunction;
			}
			return this;
		};

		/**
		 * Change the step value
		 * @param {Number} step example: 30
		 * @return {Object} self instance of Dadb class
		 */
		this.changeStep = function (step) {
			_options.step = step;
			_build();
			_openBlocks();
			_createDroppable();
			return this;
		};

		/**
		 * Return the info about dragging mode
		 */
		this.isStamp = function () {
			return _options.dragDiv;
		};

		_init();
	};

})(window, jQuery);


// special functionality for IE8
$(function () {
	// to have indexOf working on an array in IE8
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function (obj, start) {
			for (var i = (start || 0), j = this.length; i < j; i++) {
				if (this[i] === obj) {
					return i;
				}
			}
			return -1;
		};
	}

	// to have jQuery forEach in IE8
	if (typeof Array.prototype.forEach !== 'function') {
		Array.prototype.forEach = function (callback) {
			for (var i = 0; i < this.length; i++) {
				callback.apply(this, [this[i], i, this]);
			}
		};
	}

	// to have info/status on revert
	// http://stackoverflow.com/questions/1853230/jquery-ui-draggable-event-status-on-revert
	$.ui.draggable.prototype._mouseStop = function (event) {
		//If we are using droppables, inform the manager about the drop
		var dropped = false;
		if ($.ui.ddmanager && !this.options.dropBehaviour) {
			dropped = $.ui.ddmanager.drop(this, event);
		}

		//if a drop comes from outside (a sortable)
		if (this.dropped) {
			dropped = this.dropped;
			this.dropped = false;
		}

		if ((this.options.revert === 'invalid' && !dropped) ||
			(this.options.revert === 'valid' && dropped) || this.options.revert === true ||
			($.isFunction(this.options.revert) && this.options.revert.call(this.element, dropped))) {
			var self = this;
			self._trigger('reverting', event);
			$(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function () {
				event.reverted = true;
				self._trigger('stop', event);
				self._clear();
			});
		} else {
			this._trigger('stop', event);
			this._clear();
		}

		return false;
	};
  //version
  $(document.body).append('<div id="version">v Alfa2</div>');
  $('#version').css({'bottom':'0','right':'0','position':'fixed'});
});
