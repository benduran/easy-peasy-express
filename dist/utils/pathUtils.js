'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fixRequirePath = fixRequirePath;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fixRequirePath(p) {
    var normalized = _path2.default.normalize(p);
    return _path2.default.resolve(normalized);
}