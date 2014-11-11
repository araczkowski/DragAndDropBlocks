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
            'value': 30,
            'colort': 'rgba(235, 247, 71, 0.63)',
            'colorp': 'rgba(232, 249, 8, 1)'
        }, {
            'value': 60,
            'colort': 'rgba(235, 247, 71, 0.63)',
            'colorp': 'rgba(232, 249, 8, 1)'
        }, {
            'value': 120,
            'colort': 'rgba(235, 247, 71, 0.63)',
            'colorp': 'rgba(232, 249, 8, 1)'
        }];

        var _options = {
            min: 0,
            max: 1440,
            step: 30,
            stepLabelDispFormat: _stepLabelDispFormat,
            toolbarId: 'blocksToolbar',
            blocksToolbar: _blocksToolbar,
            openBlocks: [[30, 60], [600, 90]]
        };


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
            var stepWidth = 96 / nSteps;
            for (var i = 0; nSteps > i; i++) {
                var stepValue = _options.min + (i * _options.step);
                $('<div/>', {
                    'id': 'step_' + parentId + '_' + (Number(i) + 1),
                    'class': 'DadbStep',
                    'style': 'width:' + stepWidth + '%',
                    'data-start': stepValue,
                    'html': '<span class="DadbTick">' + _options.stepLabelDispFormat(stepValue) + '</span><div class="DadbStepContent"></div></div>'
                }).appendTo(eSteps);
            }
            //
            $('#steps_' + parentId).width(nSteps * stepWidth + '%');
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
            var allSteps = (_options.max - _options.min) / _options.step;
            var stepWidth = 96 / allSteps;
            var multi = $('#steps_' + parentId).width() / eBlocks.width();
            for (var i = 0; i < blocksArray.length; i++) {
                $('<div/>', {
                    'id': 'block' + blocksArray[i].value,
                    'class': 'DadbDraggableBlock DadbTemplate',
                    'data-id': blocksArray[i].id,
                    'data-code': blocksArray[i].code,
                    'data-name': blocksArray[i].name,
                    'data-value': blocksArray[i].value,
                    'data-colorp': blocksArray[i].colorp,
                    'data-colort': blocksArray[i].colort,
                    'data-coloru': blocksArray[i].coloru,
                    'html': '<span> <i class = "DadbHandle" >+</i></span>',
                    'style': 'width:' + (blocksArray[i].value / _options.step) * stepWidth * multi + '%; background: ' + blocksArray[i].colort,
                }).appendTo(eBlocks);
            }
            return;
        }

        function _createBlocksToolbar() {
            if ($('#' + _options.toolbarId).length === 0) {

                $('#' + parentId).parent().append('<div id="' + _options.toolbarId + '" class="DadbSource"></div>');
            }

            _addBlocksToTolbar('#' + _options.toolbarId, _options.blocksToolbar);

            _createDroppable();
            _createDraggable();
        }

        function _createDroppable() {
            // Droppabe
            $('.DadbSteps .DadbStep').droppable({
                tolerance: 'pointer',
                revert: true,
                //hoverClass: 'highlight',
                over: function (event, div) {
                    var className;
                    //
                    $('div.DadbStep').removeClass('DadbHighlightNOK');
                    $('div.DadbStep').removeClass('DadbHighlightOK');


                    var nSteps = (div.draggable.attr('data-value') / _options.step);
                    var list = _getHoveredDivs($(this), div, 'DadbStep', nSteps);
                    var list2 = _getHoveredDivs($(this), div, 'DadbEmpty', nSteps);

                    if (nSteps !== list2.length) {
                        className = 'DadbHighlightNOK';
                    } else {
                        className = 'DadbHighlightOK';
                    }

                    list.forEach(function (entry) {
                        entry.addClass(className);
                    });
                },
                drop: function (ev, div) {
                    $('div.DadbStep').removeClass('DadbHighlightNOK');
                    $('div.DadbStep').removeClass('DadbHighlightOK');
                    var nSteps = (div.draggable.attr('data-value') / _options.step);
                    var bSteps = _getHoveredDivs($(this), div, 'DadbEmpty', nSteps);
                    if (bSteps.length !== nSteps) {
                        div.draggable.effect('shake', {}, 300);
                        return;
                    }
                    _addSteps(bSteps, div.draggable.attr('data-value'), div.draggable.attr('data-colorp'), div.draggable.attr('data-id'));
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
                handle: 'span i.handle',
                greedy: true,
                reverting: function () {
                    $('div.DadbStep').removeClass('DadbHighlightNOK');
                    $('div.DadbStep').removeClass('DadbHighlightOK');
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



        // to get array with currently hovered divs
        function _getHoveredDivs(firstElement, blockDiv, className, nSteps) {
            var hoveredDivs = [];
            var id = firstElement.attr('id');
            id = id.substring(id.indexOf('_') + 1);
            id = id.substring(0, id.indexOf('_'));

            for (var i = 0; i < nSteps; i++) {
                var step = Number(firstElement.attr('id').replace('step_' + id + '_', '')) + Number(i);
                if ($('#step_' + id + '_' + step).hasClass(className)) {
                    hoveredDivs.push($('#step_' + id + '_' + step));
                }
            }
            return hoveredDivs;
        }


        function _addSteps(bSteps, value, color, blockId) {

            for (var i = 0; i < bSteps.length; i++) {
                bSteps[i].removeClass('DadbEmpty');
                bSteps[i].addClass('DadbPlannedBlockBody');
                bSteps[i].addClass('DadbPlannedBlock_' + bSteps[0].attr('id'));
                bSteps[i].attr('data-id', blockId);
                bSteps[i].attr('data-color', color);
                bSteps[i].css('background', color);

                if (i === 0) {
                    bSteps[i].addClass('DadbPlannedBlockStart');

                    bSteps[i].find('div').prepend('<span class="DadbCloser"><i class="DadbHandle">x</i></span>').on('click', function () {
                        _removeBlock(this);
                    });
                    bSteps[i].attr('data-value', value);
                }

                if (i === bSteps.length - 1) {
                    bSteps[i].addClass('DadbPlannedBlockEnd');
                }
            }

        }

        // to remove the blocks from slider
        function _removeBlock(e) {
            var selector = '.DadbPlannedBlock_' + $(e).closest('div').parent().attr('id');
            $(selector).removeClass('DadbPlannedBlockBody').removeClass('DadbPlannedBlockStart').removeClass('DadbPlannedBlockEnd').addClass('DadbEmpty');
            $(selector).css('background-color', '');
            $(selector).find($('.DadbCloser')).remove();
            $(selector).attr('data-value', '');
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
                }
            });
        }



        /**
         * Adds multiple blocks to the block's scale
         * @param {Object} ArrayOfBlocksObjects example: Array([{"start": 990, "value": 60, "planned": 0, "colorp": "#dff0d8", "coloru": "#FFFFFF"},...])
         * @return {Object} self instance of DadB class
         */
        this.addBlocks = function (ArrayOfBlocksObjects) {
            if (typeof (ArrayOfBlocksObjects) === 'string') {
                ArrayOfBlocksObjects = JSON.parse(ArrayOfBlocksObjects);
            }
            var stepsToAdd = [];
            for (var i = 0; i < ArrayOfBlocksObjects.length; i++) {
                stepsToAdd = _getStepssInRange(ArrayOfBlocksObjects[i].start, ArrayOfBlocksObjects[i].value);
                _addSteps(stepsToAdd, ArrayOfBlocksObjects[i].value, ArrayOfBlocksObjects[i].colorp, ArrayOfBlocksObjects[i].id);
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
                    block.id = e.getAttribute('data-id');
                    block.start = e.getAttribute('data-start');
                    block.value = e.getAttribute('data-value');
                    block.colorp = e.getAttribute('data-color');
                    blocks.push(block);
                });
            }
            return blocks;
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
});
