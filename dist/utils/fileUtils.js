'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.readFile = readFile;
exports.readDir = readDir;
exports.getFileName = getFileName;

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function readFile(filePath) {
    var parseJSON = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

    try {
        var contents = _fs2.default.readFileSync(filePath, 'utf8');
        return JSON.parse(contents);
    } catch (ex) {
        console.log(ex);
        throw ex;
    }
}

function readDir(dirPath) {
    var filter = arguments.length <= 1 || arguments[1] === undefined ? '*.*' : arguments[1];

    return _glob2.default.sync(dirPath + '/*' + filter);
}

function getFileName(filePath) {
    var lastSlashIndex = filePath.lastIndexOf('/');
    return filePath.substring(lastSlashIndex + 1).replace(/\..+$/, '');
}