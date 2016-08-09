'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.objUtils = exports.fileUtils = exports.pathUtils = undefined;

var _pathUtils = require('./pathUtils');

var pathUtilities = _interopRequireWildcard(_pathUtils);

var _fileUtils = require('./fileUtils');

var fileUtilities = _interopRequireWildcard(_fileUtils);

var _objUtils = require('./objUtils');

var objectUtilities = _interopRequireWildcard(_objUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var pathUtils = exports.pathUtils = pathUtilities;
var fileUtils = exports.fileUtils = fileUtilities;
var objUtils = exports.objUtils = objectUtilities;