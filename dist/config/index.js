'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EasyPeasyConfig = function EasyPeasyConfig() {
    var args = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, EasyPeasyConfig);

    this.loginRoutePath = args.loginRoutePath || null;
    this.additionalArgs = args.additionalArgs || null;
    this.authCheckFnc = args.authCheckFnc || null;
    this.authCookieName = args.authCookieName || null;
    this.logFnc = args.logFnc || null;
};

exports.default = new EasyPeasyConfig();