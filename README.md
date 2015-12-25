# intervalInput()
jQuery plugin which allow make interval from the input. Returns _number of seconds_ calculated from the interval.

## Usage

__Base:__
```js
$('#selector').intervalInput();
```

__Changed format:__
```js
$('#selector').intervalInput({
    format: 'h[-]i[-]s'
});
```

__Event listener:__
```js
$('#selector').intervalInput();
$('#selector').on('intervalinputchange', function(e, data) {
    // do something on change event
});
```

See all [examples](http://github.softol.pl/examples/interval-input/index.html).

## API

Description of the API provided by the plugin.

### Options

#### `translations`

Input tooltips texts.

Default:
```
{
    d: 'days',
    h: 'hours',
    i: 'minutes',
    s: 'seconds'
}
```

#### `format`

Format used to generate the inputs for interval.

Available options:
* `d` - days
* `h` - hours
* `i` - minutes
* `s` - seconds

Plugin allows to pass constant between options using braces (`[`, `]`).

Syntax:

`d[days]h[:]s`

This example generate following structure: `<input>days<input>:<input>`

Default:
```
d[days]h[:]i[:]s
```

### Methods

#### `setEnabled`

Set enabled or disabled plugin inputs.

#### `refresh`

Recalcualte interval values.

### Events

#### `intervalinputchange`

Event triggered on change value in the any input.
