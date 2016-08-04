'use strict'
ruleComputer.valueComputer = valueComputer;
module.exports = ruleComputer;

/*
  Takes in an arbitrarily nested hierarchy of objects from any json that already kinda looks like css (has only objects & strings)

  Computes all values that Gridlover understands to proper css values that browsers understand. (by lookin up from the scale stack)
*/

const SCALEUNIT_REGEX = /\b[0-9]+sx\b/g;
const GRIDROW_REGEX = /\b[0-9]+gr\b/g;

function ruleComputer (base, scaleStack, inObj, context) {

  let outObj = {};
  context = context || 0;
  if ('font-size' in inObj) {
    let val = inObj['font-size'].match(SCALEUNIT_REGEX);
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
  computedValue = computedValue.replace(SCALEUNIT_REGEX, function (len){
    len = len.replace('sx', '');
    len = Math.round(parseInt(len));
    return scaleStack[len].fontSize;
  });
  computedValue = computedValue.replace(GRIDROW_REGEX, function (len){
    len = len.replace('gr', '');
    len = Math.round(parseFloat(len));
    return len * parseFloat(scaleStack[scaleIndex].line) + base.units;
  });
  if (property === 'line-height' && (value.trim() === 'auto' || parseInt(value, 10) == '0')) {
    computedValue = scaleStack[scaleIndex].autoLineHeight;
  }
  return computedValue;
}
