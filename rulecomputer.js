'use strict'
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  var G = require('./utils.js');
  ruleComputer.valueComputer = valueComputer;
  module.exports = ruleComputer;
}

/*
  Takes in an arbitrarily nested hierarchy of objects from any json that already kinda looks like css (has only objects & strings)

  Computes (e.g. looks up from the scale stack) all values that Gridlover understands to proper css values that browsers understand.

  TODO: make this into a PostCSS plugin so you can write css.json style css with gridlover grid units and parse it, maybe extract the parser from postcss and use it in gridlover, so a user can edit the css

*/

function ruleComputer (base, scaleStack, inObj, context) {

  let outObj = {};
  context = context || 0;
  if ('font-size' in inObj) {
    let val = inObj['font-size'].match(G.SCALEUNIT_REGEX);
    if (val) {
      context = Math.round(parseInt(val[0]));
    }
  }
  for (let key in inObj) {if(inObj.hasOwnProperty(key)){
    let item = inObj[key];
    if (typeof item === 'string') {
      item = valueComputer(base, scaleStack, key, item, context);
    } else if (typeof item === 'object') {
      //For nested @rules, go deeper
      item = ruleComputer(base, scaleStack, item, context);
    }
    outObj[key] = item;
  }}
  return outObj;
}

function valueComputer (base, scaleStack, property, value, scaleIndex) {
  let computedValue = value;
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
  computedValue = computedValue.replace(G.SCALEUNIT_REGEX, function (len){
    len = len.replace('sx', '');
    len = Math.round(parseInt(len));
    return scaleStack[len].fontSize;
  });
  computedValue = computedValue.replace(G.GRIDROW_REGEX, function (len){
    len = len.replace('gr', '');
    len = Math.round(parseFloat(len));
    return len * parseFloat(scaleStack[scaleIndex].line) + base.units;
  });
  if (property === 'line-height' && (value.trim() === 'auto' || parseInt(value, 10) == '0')) {
    computedValue = scaleStack[scaleIndex].autoLineHeight;
  }
  return computedValue;
}
