(function ($) {
    var Formats = Object.freeze({
        DAY: 'd',
        HOUR: 'h',
        MINUTE: 'i',
        SECOND: 's'
    });

    function IntervalInput(type, size, value) {
        this.type = type;
        this.size = size;
        this.value = value || 0;
        this.text = null;

        this.addText = function (text) {
            this.text = text;
        };

        this.getHtml = function () {
            var input = '<input type="text" style="width: ' + this.size + 'em;" value="' + this.value + '" class="interval-input" data-type="' + this.type + '">';
            if (this.text) {
                var placeholder = new Placeholder(this.text);
                input += placeholder.getHtml();
            }
            return input;
        };
    }

    function Placeholder(placeholder) {
        this.placeholder = placeholder;

        this.getHtml = function () {
            return '<span style="margin-left: 2px;margin-right: 2px;">' + this.placeholder + '</span>';
        };
    }

    function IntervalInputsFactory() {
    }

    IntervalInputsFactory.fromFormat = function (format, inputValues, translations) {
        var intervalInputs = [];
        var formatsMap = format.split("");
        for (var i in formatsMap) {
            var formatName = formatsMap[i];
            var intervalInput = null;
            var inputValue = inputValues[formatName];
            if (formatName === Formats.DAY) {
                intervalInput = new IntervalInput(formatName, 3, inputValue);
                intervalInput.addText(translations[formatName]);
                intervalInputs.push(intervalInput);
            } else if (formatName === Formats.HOUR || formatName === Formats.MINUTE || formatName === Formats.SECOND) {
                intervalInput = new IntervalInput(formatName, 3, inputValue);
                intervalInputs.push(intervalInput);
            } else if (formatName === ' ' || formatName === ':') {
                var placeholder = new Placeholder(formatName);
                intervalInputs.push(placeholder);
            } else {
                throw new Error('Unknown format option [' + formatName + ']');
            }
        }
        return intervalInputs;
    };

    $.widget("custom.intervalInput", {
        options: {
            translations: {
                d: 'days'
            },
            format: 'd h:i:s',
            onChange: function (seconds) {
            }
        },
        _create: function () {
            var wrapperSelector = this.eventNamespace;
            var inputValues = this._getInputValues();
            this.element.hide();
            this.element.after('<div class="' + wrapperSelector.replace('.', '') + '"></div>');

            var intervalInputs = IntervalInputsFactory.fromFormat(this.options.format, inputValues, this.options.translations);
            for (var i in intervalInputs) {
                $(wrapperSelector).append(intervalInputs[i].getHtml());
            }
            this._addHandlers();
            if (this.element.is(":disabled")) {
                this.setEnabled(false);
            }
        },
        _getInputValues: function () {
            var result = {};
            var value = parseInt(this.element.val());
            var formatsMap = this.options.format.split("");
            var tmp = 0;
            var numberOf = null;
            for (var i in formatsMap) {
                var formatName = formatsMap[i];
                if (formatName === Formats.DAY) {
                    var daysSeconds = 3600 * 24;
                    tmp = value % daysSeconds;
                    numberOf = (value - tmp) / daysSeconds;
                } else if (formatName === Formats.HOUR) {
                    var hoursSeconds = 3600;
                    tmp = value % hoursSeconds;
                    numberOf = (value - tmp) / hoursSeconds;
                } else if (formatName === Formats.MINUTE) {
                    var minuteSeconds = 60;
                    tmp = value % minuteSeconds;
                    numberOf = (value - tmp) / minuteSeconds;
                } else if (formatName === Formats.SECOND) {
                    numberOf = value;
                }
                if (numberOf !== null) {
                    result[formatName] = numberOf || 0;
                }
                value = tmp;
                numberOf = null;
            }
            return result;
        },
        _addHandlers: function () {
            var self = this;
            var wrapperSelector = this.eventNamespace;
            var inputSelector = wrapperSelector + ' .interval-input';
            $(document).on('focus', inputSelector, function () {
                if ($(this).val() == 0) {
                    $(this).val('');
                }
            });
            $(document).on('blur', inputSelector, function () {
                if ($(this).val() == '') {
                    $(this).val(0);
                }
            });
            $(document).on('keyup', inputSelector, function () {
                var resultSeconds = 0;
                var formatsMap = self.options.format.split("");
                for (var i in formatsMap) {
                    var formatName = formatsMap[i];
                    if (formatName === Formats.DAY) {
                        var days = $(wrapperSelector + ' .interval-input[data-type=' + Formats.DAY + ']').val() || 0;
                        resultSeconds += (3600 * 24) * parseInt(days);
                    } else if (formatName === Formats.HOUR) {
                        var hours = $(wrapperSelector + ' .interval-input[data-type=' + Formats.HOUR + ']').val() || 0;
                        resultSeconds += 3600 * parseInt(hours);
                    } else if (formatName === Formats.MINUTE) {
                        var minutes = $(wrapperSelector + ' .interval-input[data-type=' + Formats.MINUTE + ']').val() || 0;
                        resultSeconds += 60 * parseInt(minutes);
                    } else if (formatName === Formats.SECOND) {
                        var seconds = $(wrapperSelector + ' .interval-input[data-type=' + Formats.SECOND + ']').val() || 0;
                        resultSeconds += parseInt(seconds);
                    }
                }
                $('input[name="' + self.element.attr('name') + '"]').val(resultSeconds);
                self.options.onChange(resultSeconds);
            });
            $(document).on('keydown', inputSelector, function (e) {
                if ($.inArray(e.keyCode, [8, 9, 13, 27, 46, 116, 127]) !== -1 ||
                    (e.keyCode == 65 && ( e.ctrlKey === true || e.metaKey === true ) ) ||
                    (e.keyCode >= 35 && e.keyCode <= 40)) {
                    return;
                }
                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                    e.preventDefault();
                }
            });
        },
        setEnabled: function (enable) {
            var wrapperSelector = this.eventNamespace;
            var inputs = $(wrapperSelector + ' input');
            if (enable) {
                inputs.removeAttr('disabled');
                $('input[name="' + this.element.attr('name') + '"]').removeAttr('disabled');
            } else {
                inputs.attr('disabled', 'disabled');
                $('input[name="' + this.element.attr('name') + '"]').attr('disabled', 'disabled');
            }
        },
        refresh: function () {
            var wrapperSelector = this.eventNamespace;
            var inputValues = this._getInputValues();
            $.each(inputValues, function (key, value) {
                $(wrapperSelector + ' .interval-input[data-type=' + key + ']').val(value);
            });
        }
    });
})(jQuery);
