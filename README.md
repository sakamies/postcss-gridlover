# postcss-gridlover

Enables using [Gridlover](http://gridlover.net) sx and gr units in your CSS

## Gridlover

Gridlover gives you a [modular scale](http://alistapart.com/article/more-meaningful-typography) & [vertical rhythm](https://24ways.org/2006/compose-to-a-vertical-rhythm) to work with. You can use values from the scale with sx units and grid row values with gr units. Play around with [Gridlover](http://gridlover.net/try) to get a feel for how the units work.

Using this ```input.css```:
```css
html, .root {
  --base-font-size: 14px; /* Must be in pixels */
  --base-line-height: 1.3; /* Must be a decimal number */
  --base-scale-factor: 1.618; /* Must be a decimal number */
  --base-units: px; /* px, rem, em */
  font-size: var(--base-font-size); /* html/root font-size must be defined as the base font size when using em or rem, or the grid won't be pixel perfect */
}
body, .article {
  font-size: 0sx; /* Must be an integer */
  line-height: auto;
}
h1, .h1 {
  font-size: 3sx; /* Must be an integer */
  line-height: 4gr;
  margin: 2gr 0;
}
```

Will produce
```css
html, .root {
  --base-font-size: 14px;
  --base-line-height: 1.3;
  --base-scale-factor: 1.618;
  --base-units: px;
  font-size: var(--base-font-size);
}
body, .article {
  font-size: 14px;
  line-height: 18px;
}
h1, .h1 {
  font-size: 59px;
  line-height: 72px;
  margin: 36px 0;
}
```

Take a look at `test/input.css` for the css file the Gridlover app uses.

- An sx value must be an integer.
- Values in gr units don't need to be integers, but if you want to maintain a vertical rhythm, you should keep them integers or make sure adding them up (like 1.5 + 0.5) becomes an integer.

## Installation

```
npm install postcss-gridlover
```

## Usage

```
var fs = require('fs');
var postcss = require('postcss');
var gridlover = require('postcss-gridlover');

var css = fs.readFileSync('input.css', 'utf8');

var output = postcss()
  .use(gridlover)
  .process(css)
  .css;

fs.writeFile("output.css", output);
```

If you have any questions, tweet to @gridlover or @sakamies.
