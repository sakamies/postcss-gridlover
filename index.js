'use strict';

var postcss = require('postcss');

//TODO: how to share scaleCalculator & valueComputer code in sync between gridlover and postcss-gridlover?

function scaleCalculator (base, min, max) {
  let baseFontSize = parseInt(base.fontSize, 10); //Should be always in pixels
  let baseLineHeight = Math.round(base.lineHeight * baseFontSize); //Convert base line height to pixels for calculation
  let scaleFactor = base.scaleFactor;

  //Calculate whole stack in pixels and integers first
  let stack = {}; // I had some reason to change 'stack' to be an object instead of an array, can't remember why. Array would make more sense initially.
  for (let stackPos = min; stackPos <= max; stackPos++) {
    stack[stackPos] = {};

    //TODO: would be really easy to support linear scale in addition to exponential, if base contained scaleType: <linear|exponential>, just put an if here and calculate font size differently.
    var computedFontSize = Math.round(baseFontSize * Math.pow(scaleFactor, stackPos));
    var autoLineCount = Math.ceil(computedFontSize / baseLineHeight);
    var autoLineHeight = (baseLineHeight * autoLineCount);

    stack[stackPos].fontSize = computedFontSize;
    stack[stackPos].line = baseLineHeight;
    stack[stackPos].autoLineCount = autoLineCount;
    stack[stackPos].autoLineHeight = autoLineHeight;
  }

  //Convert values to rems by finding factors which will result in the exact pixel values calculated above
  if (base.units == 'rem') {
    //Assumes document root font-size is set to 'base.fontSize' in the output css, so rem values will always be based on that context. If html does not have this font-size, calculations will be off.
    let rootFontSize = base.fontSize;
    let convertedBaseFontSize = baseFontSize / rootFontSize;
    for (let stackPos = min; stackPos <= max; stackPos++) {

      let localFontSize = stack[stackPos].fontSize;
      let localLine = stack[stackPos].line;
      let localLineHeight = stack[stackPos].autoLineHeight;
      let localAutoLineCount = stack[stackPos].autoLineCount;

      let convertedFontSize = localFontSize / rootFontSize;
      let convertedLine = baseLineHeight / baseFontSize * convertedBaseFontSize;
      let convertedLineHeight = convertedLine * localAutoLineCount;

      stack[stackPos].fontSize = Math.round(convertedFontSize * 10000000) / 10000000;
      stack[stackPos].line = Math.round(convertedLine * 10000000) / 10000000;
      stack[stackPos].autoLineHeight = Math.round(convertedLineHeight * 10000000) / 10000000;
    }
  }

  //Convert values to ems by finding factors which will result in the exact pixel values calculated above
  if (base.units == 'em') {
    //Assumes document root font-size is set to 'base.fontSize' in the output css, so em values will always be based on that context. If html does not have this font-size, calculations will be off.
    let rootFontSize = base.fontSize;
    let convertedBaseFontSize = baseFontSize / rootFontSize;
    for (let stackPos = min; stackPos <= max; stackPos++) {
      let localFontSize = stack[stackPos].fontSize;
      let localLine = stack[stackPos].line;
      let localLineHeight = stack[stackPos].autoLineHeight;
      let localAutoLineCount = stack[stackPos].autoLineCount;

      if (stackPos == 0) {
        var convertedFontSize = localFontSize / rootFontSize;
        var convertedLine = baseLineHeight / baseFontSize;
        var convertedLineHeight = convertedLine * localAutoLineCount;
      }
      else {
        //With ems, when em value is other than 1 (e.g. stackPos==0), we need to negate the context font size so the value will be correct. Body font size always uses stack position 0 (1em) so that we don't need to negate body font size from h1, h2 etc, only negate root font size.
        var convertedFontSize = localFontSize / convertedBaseFontSize / rootFontSize;
        var convertedLine = baseLineHeight / baseFontSize / convertedFontSize;
        var convertedLineHeight = convertedLine * localAutoLineCount;
      }

      stack[stackPos].fontSize = Math.round(convertedFontSize * 100000000) / 100000000;
      stack[stackPos].line = Math.round(convertedLine * 100000000) / 100000000;
      stack[stackPos].autoLineHeight = Math.round(convertedLineHeight * 100000000) / 100000000;
    }
  }

  //Add units
  for (let stackPos in stack) {
    stack[stackPos].fontSize = stack[stackPos].fontSize + base.units;
    stack[stackPos].line = stack[stackPos].line + base.units;
    stack[stackPos].autoLineHeight = stack[stackPos].autoLineHeight + base.units;
  }

  return stack;
}

function valueComputer (base, scaleStack, property, value, scaleIndex) {
  let computedValue = value;

  if (property === 'line-height' && (value.trim() === 'auto' || parseInt(value.match(/\b[0-9]+gr\b/g), 10) === 0)) {
    return scaleStack[scaleIndex].autoLineHeight;
  }
  computedValue = computedValue.replace(/\[base(FontSize|LineHeightPx|LineHeight|ScaleFactor|ScaleType|Units|Format)\]/g, function (match, key){
    key = key && key[0].toLowerCase() + key.slice(1); //Use first group match. (Dismiss 'base' from the match) Lowercase the first letter, so we get fontSize, not FontSize.
    if (key === 'fontSize' || key === 'lineHeightPx') {
      return base[key] + 'px';
    }
    return base[key];
  });
  computedValue = computedValue.replace(/\[(scaleExponent|fontSize|line|autoLineCount|autoLineHeight)\]/g, function (match, key){
    if (key === 'scaleExponent') {
      return scaleIndex;
    } else{
      return scaleStack[scaleIndex][key];
    }
  });
  computedValue = computedValue.replace(/\b[0-9]+sx\b/g, function (len){
    len = len.replace('sx', '');
    len = Math.round(parseInt(len));
    return scaleStack[len].fontSize;
  });
  computedValue = computedValue.replace(/\b[0-9]+gr\b/g, function (len){
    len = len.replace('gr', '');
    len = Math.round(parseFloat(len));
    return len * parseFloat(scaleStack[scaleIndex].line) + base.units;
  });
  return computedValue;
}


module.exports = postcss.plugin('postcss-gridlover', function (options) {
  return function (css, result) {

    var options = options || {};

    //TODO: pretty inefficient to walk the whole css twice, is there a better way?
    //TODO: this should keep track of base values per block, so if you use new values inside a media query, those values should only be in effect inside that media query, now we just run throuhg the whole file and the last base value that's defined will be the one that gets used.
    var base = {};
    css.walkRules(function (rule) {
      rule.walkDecls(function (decl, i) {
        if (decl.prop === '--base-font-size') {
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
        //should probably use replaceValues here for speed
        console.log('');
        //console.log(decl.value);
        decl.value = valueComputer(base, scaleStack, decl.prop, decl.value, context);
        //console.log(decl.value);
      });
    });
  }
});
