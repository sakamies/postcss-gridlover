'use strict';

var postcss = require('postcss');
var scaleCalculator = require('./scalecalculator.js');
var ruleComputer = require('./rulecomputer.js');

module.exports = postcss.plugin('postcss-gridlover', function () {
  return function (css, result) {

    //TODO: pretty inefficient to walk the whole css twice, is there a better way?
    //TODO: this should keep track of base values per block, so if you use new values inside a media query, those values should only be in effect inside that media query, now we just run throuhg the whole file and the last base value that's defined will be the one that gets used.
    var base = {};
    var scaleStack;
    css.walkRules(function (rule) {
      var context = 0;
      var baseChanged = false;

      rule.walkDecls(function (decl, i) {

        if (decl.prop === '--base-font-size') {
          if (decl.value.indexOf('px') === -1) {
            throw '--base-font-size must be in px units'
            //TODO: use postcss error method instead of throw, so it'll show the correct line in the console
          }
          base.fontSize = parseInt(decl.value);
          baseChanged = true;
        }
        else if (decl.prop === '--base-line-height') {
          base.lineHeight = parseFloat(decl.value);
          baseChanged = true;
        }
        else if (decl.prop === '--base-scale-factor') {
          base.scaleFactor = parseFloat(decl.value);
          baseChanged = true;
        }
        else if (decl.prop === '--base-units') {
          base.units = decl.value;
          baseChanged = true;
        }
      });

      if (baseChanged) {
        //TODO: check for missing base values and thow error before calculating scale. Should the error be checked for as early as possible or at the deepest level?
        //TODO: Find scaleCalculator max value for font-size from the css file
        scaleStack = scaleCalculator(base, 0, 12);
      }

      rule.walkDecls('font-size', function (decl, i) {
        let isScaleUnit = decl.value.match(/\b[0-9]+sx\b/g);
        if (isScaleUnit) {
          context = Math.round(parseInt(decl.value));
        }
      });

      rule.walkDecls(function (decl, i) {
        decl.value = ruleComputer.valueComputer(base, scaleStack, decl.prop, decl.value, context);
      });

    });
  }
});
