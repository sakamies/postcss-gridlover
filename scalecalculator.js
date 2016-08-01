'use strict'
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = scaleCalculator;
}

/*
  Builds a lookup array for font sizes and matching line height related values for each font size. Not sure if it's better to have the array built once or calculated each time a font size is requested. Could be so that the function keeps an array in memory and populates it as font sizes are requested, so subsequent same font sizes would just look values from the array. Changing base values would of course reset the array, just like it does now.
*/

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
