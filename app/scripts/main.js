'use strict';

var gDadb = {
    dragDiv: '',
    lastX: 0,
    lastY: 0,
    hoveredDivs: {}
};


(function(w, $) {

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
    w.Dadb = function(parentId, userOptions) {
        var _stepLabelDispFormat = function(steps) {
            var hours = Math.floor(Math.abs(steps) / 60);
            return Math.abs(steps) % 60 === 0 ? ((hours < 10 && hours >= 0) ? '0' : '') + hours : '';
        };

        var _options = {
            class: 'KID',
            min: 0,
            max: 1440,
            step: 15,
            stepWidth: 17,
            stepLabelDispFormat: _stepLabelDispFormat,
            toolbarId: 'blocksToolbar',
            attToolbarId: [],
            blocksToolbar: [],
            openBlocks: [],
            readOnly: false
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

            // to have the current position of the mouse
            $(document).unbind('mousemove').mousemove(_startStampDrag);
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

            eSteps.append('<div><span class="DadbTick">' + _options.stepLabelDispFormat(_options.min + (nSteps * _options.step)) + '</span></div>');
            eSteps.width(nSteps * _options.stepWidth);
        }

        function _mergeOptions() {
            if (!userOptions) {
                return _options;
            }
            if (typeof(userOptions) === 'string') {
                userOptions = JSON.parse(userOptions);
            }
            if (typeof(userOptions.blocksToolbar) !== 'undefined') {
                if (typeof(userOptions.blocksToolbar) === 'string') {
                    userOptions.blocksToolbar = JSON.parse(userOptions.blocksToolbar);
                }
            }

            if (typeof(userOptions.openBlocks) !== 'undefined') {
                if (typeof(userOptions.openBlocks) === 'string') {
                    userOptions.openBlocks = JSON.parse(userOptions.openBlocks);
                }
            }

            if (typeof(userOptions.stepLabelDispFormat) !== 'undefined') {
                if (typeof(userOptions.stepLabelDispFormat) === 'string') {
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
            var html = '';

            if (!_options.readOnly) {
                html = '<span> <i class = "DadbHandle"></i></span>';
            }
            for (var i = 0; i < blocksArray.length; i++) {
                var block = $('<div/>', {
                    'id': 'block' + blocksArray[i].code,
                    'class': 'DadbDraggableBlock DadbTemplate',
                    'data-value': blocksArray[i].value,
                    'data-parentId': parentId,
                    'data-toolbarId': _options.toolbarId,
                    'html': html.replace('></i>', '>' + blocksArray[i].label + '</i>')
                }).appendTo(eBlocks);

                var backgroundColor;
                if (_options.class === 'KID') {
                    backgroundColor = '#ff7c34';
                } else {
                    backgroundColor = '#00abe8';
                }
                block.attr('data-color', backgroundColor);
                block.attr('style', 'width:' + (blocksArray[i].value / _options.step) * _options.stepWidth + 'px; background: ' + backgroundColor + ';');
            }
            return;
        }



        function _createBlocksToolbar() {
            // add a toolbar with blocks only if not exitst on page otherwise reuse
            if ($('#' + _options.toolbarId).length === 0) {
                $('#' + parentId).parent().append('<div id="' + _options.toolbarId + '" class="DadbSource"></div>');
            }

            if (_options.blocksToolbar.length > 0) {
                _addBlocksToTolbar('#' + _options.toolbarId, _options.blocksToolbar);
            }

            if (!_options.readOnly) {
                _createStampable();
            }
        }

        function _onOver(event, div) {
            // only if elemet is overed
            if (!div) {
                return;
            }

            // take the properties of the overed element
            var blockDataValue;
            var blockToolbarId;
            var targetDiv;

            try {
                //stamp
                blockDataValue = div.attr('data-value');
                blockToolbarId = div.attr('data-toolbarId');
                targetDiv = $(event.currentTarget);
            } catch (e) {
                return;
            }

            // only blocks
            if (typeof(blockDataValue) === 'undefined') {
                $(div.helper).css('color', 'red');
                return;
            }

            var className;
            //allow the drop only for the blocks from the same instance
            if (blockToolbarId === _options.toolbarId) {
                //
                var nSteps = (blockDataValue / _options.step);
                var oldHoveredDivs = gDadb.hoveredDivs;
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
                        if (i === 0) {
                            hoveredDivs.DadbStep[i].addClass(className + 'start');
                        }
                        hoveredDivs.DadbStep[i].addClass(className);
                        if (i === l - 1) {
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


        //STAMP START
        // Fires on mousemove and updates element position
        function _startStampDrag(e) {
            // Only update last known mouse position if an event object
            // was passed through (mousemove event).
            if (e) {
                gDadb.lastX = e.pageX;
                gDadb.lastY = e.pageY;
            }
            // If an element is being dragged, update the helper's position.
            if (gDadb.dragDiv) {
                gDadb.dragDiv.css({
                    top: gDadb.lastY,
                    left: gDadb.lastX
                });
            }
        }


        function _stopStampDrag() {
            // Remove the helper from the DOM and clear the variable.
            if (gDadb.dragDiv) {
                gDadb.dragDiv.remove();
                gDadb.dragDiv = null;
            }
            //remove class stamp from this range toolbar
            $('div.DadbDraggableBlock').removeClass('Stamp');
            //unbing the click from the block's range
            $('.DadbSteps .DadbStep').unbind('click mouseup');
        }

        //
        function _createStampable() {
            // stop when cancel is clicked
            $(document).unbind('keyup').keyup(function(e) {
                // esc
                if (e.keyCode === 27) {
                    _removeHighlight();
                    _stopStampDrag();
                    // Remove all the "FlyingStamps" from body
                    $('div.DadbDraggableBlock.FlyingStamp').remove();
                }
            });

            // take/switch blocks using the keybord
            $(document).unbind('keydown').keydown(function(e) {
                // <-- 37 39 -->
                // p 80 n 78
                var key = e.keyCode;
                if (key === 80 || key === 78 || (key > 48 && key < 57) ||
                    (key > 96 && key < 105)) {
                    var element, currentBlockId;
                    currentBlockId = $(gDadb.dragDiv).attr('id');
                    if (key === 49 || key === 97) {
                        element = '#blockKID15';
                    } else if (key === 50 || key === 98) {
                        element = '#blockKID30';
                    } else if (key === 51 || key === 99) {
                        element = '#blockKID60';
                    } else if (key === 52 || key === 100) {
                        element = '#blockKID120';
                    } else if (key === 53 || key === 101) {
                        element = '#blockSTAFF15';
                    } else if (key === 54 || key === 102) {
                        element = '#blockSTAFF30';
                    } else if (key === 55 || key === 103) {
                        element = '#blockSTAFF60';
                    } else if (key === 56 || key === 104) {
                        element = '#blockSTAFF120';
                    }

                    if (key === 80 || key === 78) {
                        if (currentBlockId === 'blockKID15') {
                            if (key === 78) {
                                element = '#blockKID30';
                            } else {
                                element = '#blockSTAFF120';
                            }
                        } else if (currentBlockId === 'blockKID30') {
                            if (key === 78) {
                                element = '#blockKID60';
                            } else {
                                element = '#blockKID15';
                            }
                        } else if (currentBlockId === 'blockKID60') {
                            if (key === 78) {
                                element = '#blockKID120';
                            } else {
                                element = '#blockKID30';
                            }
                        } else if (currentBlockId === 'blockKID120') {
                            if (key === 78) {
                                element = '#blockSTAFF15';
                            } else {
                                element = '#blockKID60';
                            }
                        } else if (currentBlockId === 'blockSTAFF15') {
                            if (key === 78) {
                                element = '#blockSTAFF30';
                            } else {
                                element = '#blockKID120';
                            }
                        } else if (currentBlockId === 'blockSTAFF30') {
                            if (key === 78) {
                                element = '#blockSTAFF60';
                            } else {
                                element = '#blockSTAFF15';
                            }
                        } else if (currentBlockId === 'blockSTAFF60') {
                            if (key === 78) {
                                element = '#blockSTAFF120';
                            } else {
                                element = '#blockSTAFF30';
                            }
                        } else if (currentBlockId === 'blockSTAFF120') {
                            if (key === 78) {
                                element = '#blockKID15';
                            } else {
                                element = '#blockSTAFF60';
                            }
                        }
                    }

                    if (element !== undefined) {
                        e.pageX = gDadb.lastX;
                        e.pageY = gDadb.lastY;
                        _takeBlockFromToolbar(e, element);
                    }
                }
            });

            $('#steps_' + parentId + '.DadbSteps .DadbStep').mouseover(function(event) {
                _onOver(event, gDadb.dragDiv);
            });

            // when click on block's toolbar
            $('#' + _options.toolbarId).closest('table').unbind('click').click(function() {
                if (gDadb.dragDiv) {
                    _removeHighlight();
                    _stopStampDrag();
                }
            });

            function _takeBlockFromToolbar(event, element) {
                event.stopPropagation(); //important! see below
                var div = $(element);
                //
                _removeHighlight();
                // set the current mouse possition
                if (event) {
                    gDadb.lastX = event.pageX;
                    gDadb.lastY = event.pageY;
                }

                if (div.hasClass('Stamp')) {
                    // sipmply put the stamp back
                    _stopStampDrag();
                } else {
                    //switch stamps
                    if (gDadb.dragDiv) {
                        _stopStampDrag();
                    }
                    // take new stamplowe the select block as a stamp only if it not selected
                    div.addClass('Stamp');
                    // Start dragging the block
                    //$(document).unbind('mousemove').mousemove(_startStampDrag);
                    gDadb.dragDiv = div.clone().addClass('FlyingStamp').css('position', 'absolute').appendTo('body');
                    // Fire the dragging event to update the helper's position
                    _startStampDrag();

                    // add click on time range
                    $(document).unbind('click mouseup', _addClickOnToPutBlock).click(_addClickOnToPutBlock);
                }
            }

            // when click on block in blocks toolbar - take the block as a stamp
            $('div.DadbDraggableBlock').unbind('click').click(function(e) {
                _takeBlockFromToolbar(e, this);
            });
        }

        function _addClickOnToPutBlock(e) {

            // Only do something is an element is being dragged
            if (gDadb.dragDiv) {
                var x = e.pageX - gDadb.hoveredDivs.lastX;
                var y = e.pageY - gDadb.hoveredDivs.lastY;
                var z = Math.sqrt(x * x + y * y);
                if (z < 15) {
                    // the block should be dropped to the range...
                    var nSteps = (gDadb.dragDiv.attr('data-value') / _options.step);
                    if (gDadb.hoveredDivs.DadbEmpty.length === nSteps) {
                        _addSteps(gDadb.hoveredDivs.DadbEmpty, gDadb.dragDiv.attr('data-value'), gDadb.dragDiv.attr('data-color'), gDadb.hoveredDivs.calback);
                    }
                }
                _removeHighlight();
            }
        }
        //STAMP END

        // to get array with currently hovered divs
        function _getHoveredDivs(firstElement, blockDiv, nSteps, e) {

            var id = firstElement.attr('id');
            gDadb.hoveredDivs = {};
            gDadb.hoveredDivs.DadbStep = [];
            gDadb.hoveredDivs.DadbEmpty = [];
            var step;
            var div;

            for (var i = 0; i < nSteps; i++) {
                step = Number(id.replace('step_' + parentId + '_', '')) + Number(i);
                div = $('#step_' + parentId + '_' + step);
                if (div.hasClass('DadbStep')) {
                    gDadb.hoveredDivs.DadbStep.push(div);
                }
                if (div.hasClass('DadbEmpty')) {
                    gDadb.hoveredDivs.DadbEmpty.push(div);
                }
            }
            if (e) {
                gDadb.hoveredDivs.lastX = e.pageX;
                gDadb.hoveredDivs.lastY = e.pageY;
                gDadb.hoveredDivs.calback = _onAddBlock;
            }
            return gDadb.hoveredDivs;
        }

        function _removeHighlight() {
            $('div.DadbStep').removeClass('DadbHighlightNOK').removeClass('DadbHighlightOK').removeClass('DadbHighlightOKstart').removeClass('DadbHighlightOKend').removeClass('DadbHighlightNOKstart').removeClass('DadbHighlightNOKend');
        }

        function _addSteps(bSteps, value, color, calback) {
            //
            // this steps were already planned
            if (bSteps[0].hasClass('DadbPlannedBlockBody')) {
                return;
            }
            var firstStep;
            for (var i = 0; i < bSteps.length; i++) {
                bSteps[i].removeClass('DadbEmpty');
                bSteps[i].addClass('DadbPlannedBlockBody');
                bSteps[i].attr('data-block-selector', 'DadbPlannedBlock_' + bSteps[0].attr('id'));
                bSteps[i].attr('data-color', color);
                bSteps[i].css('background', color);

                if (i === 0) {
                    bSteps[i].addClass('DadbPlannedBlockStart');
                    bSteps[i].attr('data-value', value);
                    firstStep = bSteps[i];
                }

                if (i === bSteps.length - 1) {
                    bSteps[i].addClass('DadbPlannedBlockEnd');
                }
            }
            // add option to remove the block from timeline
            if (!_options.readOnly) {
                firstStep.find('div').prepend('<span class="DadbCloser"><i class="DadbHandle fa fa-times"></i></span>').on('click', function(event) {
                    event.stopPropagation();
                    _removeBlock(this, calback);
                });
            }

            if (typeof(calback) === 'function') {
                calback();
            }
        }

        // to remove the blocks from slider
        function _removeBlock(e, calback, all) {
            var id, selector, blocks;
            if (!all) {
                id = $(e).closest('div').parent().attr('id');
                selector = 'DadbPlannedBlock_' + id;
                blocks = $('[data-block-selector=' + selector + ']');

            } else {
                id = parentId;
                selector = '#steps_' + parentId + '.DadbSteps .DadbStep';
                blocks = $('#' + parentId + ' div.DadbPlannedBlockBody');
            }

            blocks.removeClass('DadbPlannedBlockBody').removeClass('DadbPlannedBlockStart').removeClass('DadbPlannedBlockEnd').addClass('DadbEmpty');
            blocks.css('background-color', '');
            blocks.removeAttr('data-value');
            blocks.removeAttr('data-block-selector');
            blocks.removeAttr('data-color');
            $('#' + id + ' div.DadbStepContent').empty();
            $('#' + id + ' div.DadbStepContent').unbind('click');
            _removeHighlight();

            if (typeof(calback) === 'function') {
                calback();
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
            _options.openBlocks.forEach(function(block) {
                var b = (_getStepssInRange(block[0], block[1]));
                for (var i = 0; i < b.length; i++) {
                    b[i].addClass('DadbEmpty');
                    b[i].attr('data-range-id', block[2]);
                }
            });
        }


        /**
         * Adds multiple blocks to the block's scale
         * @param {Object} ArrayOfBlocksObjects example: Array([{"start": 990, "value": 60, "planned": 0, "col_planned": "#dff0d8"},...])
         * @return {Object} self instance of DadB class
         */
        this.addBlocks = function(ArrayOfBlocksObjects) {
            var backgroundColor;
            if (_options.class === 'KID') {
                backgroundColor = '#ff7c34';
            } else {
                backgroundColor = '#00abe8';
            }
            if (typeof(ArrayOfBlocksObjects) === 'string') {
                ArrayOfBlocksObjects = JSON.parse(ArrayOfBlocksObjects);
            }
            var stepsToAdd = [];
            for (var i = 0; i < ArrayOfBlocksObjects.length; i++) {
                stepsToAdd = _getStepssInRange(ArrayOfBlocksObjects[i].start, ArrayOfBlocksObjects[i].value);
                _addSteps(stepsToAdd, ArrayOfBlocksObjects[i].value, backgroundColor, _onAddBlock);
            }
            return this;
        };

        this.removeBlocks = function() {
            _removeBlock(null, _onDeleteBlock, true);
            return this;
        };


        /**
         * Gets all blocks for this Dadb instance
         * @return {Array} of blocks
         */
        this.getBlocks = function() {
            var blocks = [];
            var _blocks = $('div#' + parentId + ' .DadbPlannedBlockStart');
            if (_blocks.length > 0) {
                _blocks.each(function(i, e) {
                    var block = {};
                    block.start = e.getAttribute('data-start');
                    block.value = e.getAttribute('data-value');
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
        this.setOnChangeCallback = function(callbackFunction) {
            if (typeof(callbackFunction) === 'function') {
                _onAddBlock = callbackFunction;
                _onDeleteBlock = callbackFunction;
            }
            return this;
        };

        this.getOnChangeCallback = function() {
            return _onAddBlock;
        };

        /**
         * Change the step value
         * @param {Number} step example: 30
         * @return {Object} self instance of Dadb class
         */
        this.changeStep = function(step) {
            _options.step = step;
            _build();
            _openBlocks();
            return this;
        };

        /**
         * Return the info about dragging mode
         */
        this.isStamp = function() {
            return gDadb.dragDiv;
        };

        _init();
    };

})(window, jQuery);
