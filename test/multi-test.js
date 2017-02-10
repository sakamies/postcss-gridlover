var fs = require('fs');
var postcss = require('../node_modules/postcss');
var gridlover = require('../');

var css = fs.readFileSync('multi-input.css', 'utf8');

var output = postcss()
  .use(gridlover)
  .process(css)
  .css;

fs.writeFile("multi-output.css", output);
