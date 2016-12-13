'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _engine = require('./engine');

var _engine2 = _interopRequireDefault(_engine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getEngine(args) {
    return new _engine2.default(args);
}

exports.default = getEngine;