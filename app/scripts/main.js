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
            'code': 'K15',
            'value': 15,
            'blockId': 1,
            'attributes': [{
                'COL_Toolbar': '#ff7c34'
            }, {
                'COL_Planned': '#ff7c34'
            }, {
                'COL_Unplanned': 'white'
            }, {
                'COL_Real': '#7bce5b'
            }, {
                'COL_Unreal': 'white'
            }, {
                'COL_Added': '#3c8a27'
            }, {
                'COL_Deleted': '#ff3d25'
            }]
        }, {
            'code': 'K30',
            'value': 30,
            'blockId': 2,
            'attributes': [{
                'COL_Toolbar': '#ff7c34'
            }, {
                'COL_Planned': '#ff7c34'
            }, {
                'COL_Unplanned': 'white'
            }, {
                'COL_Real': '#7bce5b'
            }, {
                'COL_Unreal': 'white'
            }, {
                'COL_Added': '#3c8a27'
            }, {
                'COL_Deleted': '#ff3d25'
            }]
        }, {
            'code': 'K60',
            'value': 60,
            'blockId': 3,
            'attributes': [{
                'COL_Toolbar': '#ff7c34'
            }, {
                'COL_Planned': '#ff7c34'
            }, {
                'COL_Unplanned': 'white'
            }, {
                'COL_Real': '#7bce5b'
            }, {
                'COL_Unreal': 'white'
            }, {
                'COL_Added': '#3c8a27'
            }, {
                'COL_Deleted': '#ff3d25'
            }]
        }, {
            'code': 'K120',
            'value': 120,
            'blockId': 4,
            'attributes': [{
                'COL_Toolbar': '#ff7c34'
            }, {
                'COL_Planned': '#ff7c34'
            }, {
                'COL_Unplanned': 'white'
            }, {
                'COL_Real': '#7bce5b'
            }, {
                'COL_Unreal': 'white'
            }, {
                'COL_Added': '#3c8a27'
            }, {
                'COL_Deleted': '#ff3d25'
            }]
        }];
        var _attributesToolbar = [];

        var _options = {
            min: 0,
            max: 1440,
            step: 15,
            stepWidth: 20,
            stepLabelDispFormat: _stepLabelDispFormat,
            toolbarId: 'blocksToolbar',
            attToolbarId: '',
            blocksToolbar: _blocksToolbar,
            attributesToolbar: _attributesToolbar,
            openBlocks: [[30, 60], [600, 90]]
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
            _createAdditionalAttributesForBlocksToolbar();
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
                    'class': stepClass +' DadbStep',
                    'style': 'width:' + _options.stepWidth + 'px',
                    'data-start': stepValue,
                    'html': '<span class="DadbTick">' + _options.stepLabelDispFormat(stepValue) + '</span><div class="DadbStepContent '+contentClass+'"></div></div>'
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

            if (typeof (userOptions.attributesToolbar) !== 'undefined') {
                if (typeof (userOptions.attributesToolbar) === 'string') {
                    userOptions.attributesToolbar = JSON.parse(userOptions.attributesToolbar);
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
                    'class': 'DadbDraggableBlock DadbTemplate',
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


        function _addBlocksAttrToTolbar(selector, attArray) {
            var eBlocks = $(selector);
            for (var i = 0; i < attArray.length; i++) {
                $('<i/>', {
                    'class': 'fa fa-2x ' + attArray[i].attClass,
                    'data-att-id': attArray[i].attId,
                    'data-att-class': attArray[i].attClass,
                    'data-parentId': parentId,
                    'html': '<span></span>' // &nbsp; + attArray[i].attCode
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

        function _createAdditionalAttributesForBlocksToolbar() {

            if (_options.attToolbarId.length > 0) {

                if ($('#' + _options.attToolbarId).length === 0) {
                    $('#' + parentId).parent().append('<div id="' + _options.attToolbarId + '" class="DadbDraggableBlocksAttributes"></div>');
                } else {
                    $('#' + _options.attToolbarId).addClass('DadbDraggableBlocksAttributes');
                }

                _addBlocksAttrToTolbar('#' + _options.attToolbarId, _options.attributesToolbar);

                _createDraggableAtt();
                _createDroppableAtt();
            }
        }

        function _createDraggableAtt() {
            $('div.DadbDraggableBlocksAttributes i').draggable({
                appendTo: 'body',
                helper: 'clone',
                revert: 'invalid',
                handle: 'i',
                greedy: true
            });
        }

        function _createDroppableAtt(el) {
            $(el || '#steps_' + parentId + ' div.DadbPlannedBlockBody').droppable({
                tolerance: 'pointer',
                revert: true,
                over: function (event, div) {

                    // only attr
                    if (typeof (div.draggable.attr('data-att-id')) === 'undefined') {
                        return;
                    }

                    $(div.helper).css('color', 'black');
                    var blockSelector = '.' + $(this).attr('data-block-selector');
                    var attId = div.draggable.attr('data-att-id');

                    //allow the drop only for the blocks from the same instance
                    var blockParentId = div.draggable.attr('data-parentId');
                    if (blockParentId === parentId) {
                        if ($(blockSelector).last().length) {
                            if ($(blockSelector).parent().find('i[data-att-id="' + attId + '"]').length) {
                                //only one atribute per blocks range
                                $(div.helper).css('color', 'red');
                            } else {
                                $(div.helper).css('color', 'green');
                            }
                        }
                    } else {
                        $(div.helper).css('color', 'red');
                    }

                },
                drop: function (ev, div) {
                    var blockSelector = '.' + $(this).attr('data-block-selector');
                    var attId = div.draggable.attr('data-att-id');

                    //allow the drop only for the blocks from the same instance
                    var blockParentId = div.draggable.attr('data-parentId');
                    if (blockParentId === parentId) {
                        //only one atribute per blocks range
                        if (!$(blockSelector).parent().find('i[data-att-id="' + attId + '"]').length) {

                            //var el = div.draggable.clone();
                            //$(blockSelector).last().append(el);
                            var attClass = div.draggable.attr('data-att-class');
                            _addStepAtt($(blockSelector).last(), attId, attClass);
                        }
                    }
                }
            });


        }

        function _createDroppable(el) {
            // Droppabe
            $(el || '#steps_' + parentId + '.DadbSteps .DadbStep').droppable({
                tolerance: 'pointer',
                revert: true,
                over: function (event, div) {

                    // only blocks
                    if (typeof (div.draggable.attr('data-value')) === 'undefined') {
                        $(div.helper).css('color', 'red');
                        return;
                    }

                    var className;
                    //
                    $('div.DadbStep').removeClass('DadbHighlightNOK');
                    $('div.DadbStep').removeClass('DadbHighlightOK');



                    //allow the drop only for the blocks from the same instance
                    var blockParentId = div.draggable.attr('data-parentId');
                    if (blockParentId === parentId) {
                        //
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
                    } else {
                        $('#' + parentId + ' .DadbStep').addClass('DadbHighlightNOK');
                    }
                },
                drop: function (ev, div) {
                    $('div.DadbStep').removeClass('DadbHighlightNOK');
                    $('div.DadbStep').removeClass('DadbHighlightOK');

                    //allow the drop only for the blocks from the same instance
                    var blockParentId = div.draggable.attr('data-parentId');
                    if (blockParentId === parentId) {
                        var nSteps = (div.draggable.attr('data-value') / _options.step);
                        var bSteps = _getHoveredDivs($(this), div, 'DadbEmpty', nSteps);
                        if (bSteps.length !== nSteps) {
                            div.draggable.effect('shake', {}, 300);
                            return;
                        }
                        _addSteps(bSteps, div.draggable.attr('data-value'), div.draggable.attr('data-color'), div.draggable.attr('data-block-id'), div.draggable.attr('data-att-id'), div.draggable.attr('data-att-class'));

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

        function _addStepAtt(bStep, attId, attClass) {
            $('<i/>', {
                'class': attClass + ' fa',
                'data-att-id': attId,
                'data-att-class': attClass
            }).appendTo(bStep);
        }


        function _addSteps(bSteps, value, color, blockId, attId, attClass) {

            var guid = _getGuid();

            for (var i = 0; i < bSteps.length; i++) {
                bSteps[i].removeClass('DadbEmpty');
                bSteps[i].addClass('DadbPlannedBlockBody');
                bSteps[i].addClass('DadbPlannedBlock_' + bSteps[0].attr('id'));
                bSteps[i].attr('data-block-id', blockId || guid);
                bSteps[i].attr('data-block-selector', 'DadbPlannedBlock_' + bSteps[0].attr('id'));
                bSteps[i].attr('data-color', color);
                bSteps[i].css('background', color);

                if (i === 0) {
                    bSteps[i].addClass('DadbPlannedBlockStart');

                    bSteps[i].find('div').prepend('<span class="DadbCloser"><i class="DadbHandle fa fa-times"></i></span>').on('click', function () {
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
                _createDroppableAtt(bSteps[i]);
            }

            if (typeof (_onAddBlock) === 'function') {
                _onAddBlock();
            }
        }

        // to remove the blocks from slider
        function _removeBlock(e) {
            var selector = '.DadbPlannedBlock_' + $(e).closest('div').parent().attr('id');
            $(selector).removeClass('DadbPlannedBlockBody').removeClass('DadbPlannedBlockStart').removeClass('DadbPlannedBlockEnd').addClass('DadbEmpty');
            $(selector).css('background-color', '');
            $(selector).find($('.DadbCloser')).remove();
            $(selector).attr('data-value', '');
            $(selector + ' i').remove();

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
                //attributes
                /*                var backgroundColor = '';
                for (var n = 0; n < ArrayOfBlocksObjects[i].attributes.length; n++) {
                    var obj = ArrayOfBlocksObjects[i].attributes[n];
                    for (var key in obj) {
                        if (key == 'COL_Toolbar') {
                            backgroundColor = obj[key];
                        }
                    }
                }*/

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
                    //var blockSelector = e.getAttribute('data-block-selector');
                    //block.attId = $('.' + blockSelector).last().find('i').attr('data-att-id');
                    //block.attClass = $('.' + blockSelector).last().find('i').attr('data-att-class');
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
