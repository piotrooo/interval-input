(function ($) {
    var Formats = Object.freeze({
        DAY: 'd',
        HOUR: 'h',
        MINUTE: 'i',
        SECOND: 's'
    });

    function IntervalInput(type, size, value, tooltip) {
        this.type = type;
        this.size = size;
        this.value = value || 0;
        this.tooltip = tooltip || '';

        this.getHtml = function () {
            return '<input type="text" ' +
                'style="width: ' + this.size + 'em;" ' +
                'value="' + this.value + '" ' +
                'class="interval-input" ' +
                'data-type="' + this.type + '" ' +
                'title="' + this.tooltip + '"' +
                '>';
        };
    }

    function Placeholder(placeholder) {
        this.placeholder = placeholder;

        this.getHtml = function () {
            return '<span class="interval-input-placeholder" style="margin-left: 2px;margin-right: 2px;">' + this.placeholder + '</span>';
        };
    }

    function IntervalInputsFactory() {
    }

    IntervalInputsFactory.fromFormat = function (format, inputValues, translations) {
        var intervalInputs = [];
        var formatParser = FormatParser.parse(format);
        var formatsMap = formatParser.getFormats();
        var placeholdersMap = formatParser.getPlaceholders();

        for (var i in formatsMap) {
            var intervalInput = null;
            var formatName = formatsMap[i];
            var placeholder = placeholdersMap[i];
            var inputValue = inputValues[formatName];
            if ($.inArray(formatName, [Formats.DAY, Formats.HOUR, Formats.MINUTE, Formats.SECOND]) != -1) {
                var tooltip = translations[formatName];
                intervalInput = new IntervalInput(formatName, 3, inputValue, tooltip);
                intervalInputs.push(intervalInput);
            } else {
                throw new Error('Unknown format option [' + formatName + ']');
            }

            if (typeof placeholder != 'undefined') {
                intervalInputs.push(new Placeholder(placeholder));
            }
        }
        return intervalInputs;
    };

    function FormatParser(formats, placeholders) {
        this.formats = formats;
        this.placeholders = placeholders;

        this.getFormats = function () {
            return this.formats;
        };

        this.getPlaceholders = function () {
            return this.placeholders;
        };
    }

    FormatParser.parse = function (format) {
        var regExp = /\[(.*?)\]/g;
        var formatsMap = format.replace(regExp, ',').split(',');
        var placeholdersMap = [];
        var tmp;
        while ((tmp = regExp.exec(format)) !== null) {
            if (tmp.index === regExp.lastIndex) {
                regExp.lastIndex++;
            }
            placeholdersMap.push(tmp[1]);
        }
        return new FormatParser(formatsMap, placeholdersMap);
    };

    $.widget("custom.intervalInput", {
        options: {
            translations: {
                d: 'days',
                h: 'hours',
                i: 'minutes',
                s: 'seconds'
            },
            format: 'd[days]h[:]i[:]s'
        },
        _create: function () {
            var wrapperSelector = this.eventNamespace;
            var inputValues = this._getInputValues();
            this.element.hide();
            this.element.after('<div class="interval-input-wrapper ' + wrapperSelector.replace('.', '') + '"></div>');

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
            var formatParser = FormatParser.parse(this.options.format);
            var formatsMap = formatParser.getFormats();
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
            $(document).on('keyup', inputSelector, function (e) {
                var resultSeconds = 0;
                var formatParser = FormatParser.parse(self.options.format);
                var formatsMap = formatParser.getFormats();
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
                self._trigger('change', null, {seconds: resultSeconds});
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
