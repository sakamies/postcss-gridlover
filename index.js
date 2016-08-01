'use strict';

var postcss = require('postcss');
var scaleCalculator = require('./scalecalculator.js');
var ruleComputer = require('./rulecomputer.js');

module.exports = postcss.plugin('postcss-gridlover', function (options) {
  return function (css, result) {

    var options = options || {};

    //TODO: pretty inefficient to walk the whole css twice, is there a better way?
    //TODO: this should keep track of base values per block, so if you use new values inside a media query, those values should only be in effect inside that media query, now we just run throuhg the whole file and the last base value that's defined will be the one that gets used.
    var base = {};
    css.walkRules(function (rule) {
      rule.walkDecls(function (decl, i) {
        if (decl.prop === '--base-font-size') {
          if (decl.value.indexOf('px') === -1) {
            throw '--base-font-size must be in px units'
            //TODO: use postcss error method instead of throw, so it'll show the correct line in the console
          }
          base.fontSize = parseInt(decl.value);
        }
        if (decl.prop === '--base-line-height') {
          base.lineHeight = parseFloat(decl.value);
        }
        if (decl.prop === '--base-scale-factor') {
          base.scaleFactor = parseFloat(decl.value);
        }
        if (decl.prop === '--base-units') {
          base.units = decl.value;
        }
      });
    });
    //TODO: check for missing base values and thow error before calculating scale
    var scaleStack = scaleCalculator(base, 0, 12);
    var context = 0;

    /*TODO:
      - Get min & max values for font-size from the css file
      - Is there a way to access rule declarations directly without walking them?
      - If not, I need to first get the base values from the rule, then the font-size property and only after that calculate all other values.
    */

    css.walkRules(function (rule) {
      rule.walkDecls('font-size', function (decl, i) {
        let isScaleUnit = decl.value.match(/\b[0-9]+sx\b/g);
        if (isScaleUnit) {
          context = Math.round(parseInt(decl.value));
        } else {
          context = 0;
        }
      });
      rule.walkDecls(function (decl, i) {
        decl.value = ruleComputer.valueComputer(base, scaleStack, decl.prop, decl.value, context);
      });
    });
  }
});
