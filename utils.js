'use strict'

//DOM utils (check that the environment is a browser)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.$ = (x) => document.querySelector(x);
  window.$$ = (x) => document.querySelectorAll(x);
  window.cloneObj = (obj) => Object.assign({}, obj);
}

//Constants
const G = {};

//Make interoperable as a node module for postcss-gridlover
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = G;
}

G.PATH_SEPARATOR = '💟';
G.DECIMAL_REGEX = /(?:\d*\.)?\d+/;
G.INTEGER_REGEX = /(?:\d*\.)?\d+/;
G.SCALEUNIT_REGEX = /\b[0-9]+sx\b/g;
G.GRIDROW_REGEX = /\b[0-9]+gr\b/g;
G.SELF_CLOSING_TAGS = ['area','base','br','col','command','embed','hr','img','input','keygen','link','meta','param','source','track','wbr'];
G.SYNTAX_CSS = {
  'blockPrefix':'',
  'blockStart':' {\n',
  'blockEnd':'}\n',
  'start':'',
  'assign':': ',
  'end':';\n',
  'lastEnd':';', //for languages that can't handle the last row ending with end char when the block ends
}
G.SYNTAX_SCSS = {
  'blockPrefix':'$scale',
  'blockStart':': (\n',
  'blockEnd':');\n',
  'start':'',
  'assign':': ',
  'end':',\n',
  'lastEnd':'\n',
}
