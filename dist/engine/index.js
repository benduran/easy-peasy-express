'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _yamljs = require('yamljs');

var _yamljs2 = _interopRequireDefault(_yamljs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EasyPeasyEngine = function () {
    function EasyPeasyEngine() {
        var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, EasyPeasyEngine);

        var routesFile = args.routesFile,
            controllersFolder = args.controllersFolder;

        if (!routesFile) {
            throw new Error('A route file must be provided when using easy-peasy-express.');
        }
        if (!controllersFolder) {
            throw new Error('A path to the folder where your express controllers are located must be provided when using easy-peasy-express.');
        }
        this.routesFile = _path2.default.resolve(routesFile);
        this.controllersFolder = this.cwd, _path2.default.resolve(controllersFolder);
        this.routes = {};
        this.controllers = {};
        this.init();
    }

    _createClass(EasyPeasyEngine, [{
        key: 'init',
        value: function init() {
            // Will load your routeFile, parse it, then loader all the controllers in your folder
            if (_fs2.default.existsSync(this.routesFile)) {
                if (this.routesFile.endsWith('yaml') || this.routesFile.endsWith('yml')) {
                    this.routes = _yamljs2.default.parse(_fs2.default.readFileSync(this.routesFile, 'utf8'));
                } else {
                    this.routes = JSON.parse(_fs2.default.readFileSync(this.routesFile, 'utf8'));
                }
            }
        }
    }]);

    return EasyPeasyEngine;
}();

exports.default = EasyPeasyEngine;