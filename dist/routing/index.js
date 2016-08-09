'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.bindRoutes = bindRoutes;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('../utils');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findControllerMethod(fncName, allControllers) {
    fncName = fncName || '';
    var controllerName = null,
        requiresControllerName = false;
    if (fncName.indexOf('.') > -1) {
        var sFncName = fncName.split('.');
        controllerName = sFncName[0];
        fncName = sFncName.length > 1 ? sFncName[1] : null;
        requiresControllerName = true;
    }
    if (fncName) {
        for (var cPath in allControllers) {
            var c = allControllers[cPath];
            if (!requiresControllerName || controllerName && controllerName === cPath) {
                for (var cFnc in c) {
                    if (cFnc.toLowerCase() === fncName.toLowerCase()) {
                        return c[cFnc];
                    }
                }
            }
        }
    }
    return null;
}

function wireStaticDir(_ref) {
    var config = _ref.config;
    var verbose = _ref.verbose;
    var url = _ref.url;
    var server = _ref.server;

    // Check if the directory actually exists
    var dirPath = _path2.default.resolve(_path2.default.join(process.cwd(), config.staticDir));
    try {
        var dirStat = _fs2.default.statSync(dirPath);
        if (dirStat.isDirectory()) {
            (function () {
                // Recursively get all filePaths in this dir
                var allowedFiles = _utils.fileUtils.readDir(dirPath, config.allowedExt);
                allowedFiles.forEach(function (fp) {
                    var serveThis = (url + fp.replace(dirPath, '')).replace(/\\/g, '/');
                    if (verbose) {
                        config.logFnc('Will serve static file "' + serveThis + '".');
                    }
                    server.get(serveThis, function (req, res) {
                        try {
                            res.set('Content-Type', _mime2.default.lookup(req.url)).send(_fs2.default.readFileSync(_lodash2.default.find(allowedFiles, function (p) {
                                var matchThis = p.replace(/\\/g, '/').replace(config.staticDir, url);
                                return matchThis.endsWith(req.url);
                            }))).end();
                        } catch (ex) {
                            // If we get here, the file no longer exists!
                            res.send(ex.toString()).end();
                        }
                    });
                });
            })();
        }
    } catch (ex) {
        config.logFnc('Unable to wire static dir "' + dirPath + '".');
        config.logFnc(ex);
    }
}

function checkRequestAuthorized(routeConfig, req, res) {
    return !routeConfig.requiresAuth || _config2.default.authCookieName && req.cookies && req.cookies[_config2.default.authCookieName] || _config2.default.authCheckFnc(req, res);
}

function processRequest(req, res, config, controllerMethod) {
    if (!checkRequestAuthorized(config, req, res)) {
        res.status(401).end();
    } else {
        res.set(config.headers || {});
        controllerMethod(req, res);
    }
}

function bindConfig(_ref2) {
    var server = _ref2.server;
    var localConfig = _ref2.localConfig;
    var url = _ref2.url;
    var allControllers = _ref2.allControllers;

    if (!localConfig) {
        throw new Error('No config object found for route "' + url + '".');
    }

    if (localConfig.staticFiles) {
        wireStaticDir({
            config: localConfig,
            verbose: _config2.default.additionalArgs.verbose,
            url: url,
            server: server
        });
    } else {
        (function () {
            if (!localConfig.actionMethod && !localConfig.redirectTo) {
                throw new Error('No actionMethod name found on the route config for "' + url + '"');
            }
            var controllerMethod = findControllerMethod(localConfig.actionMethod, allControllers);
            if (!controllerMethod && !localConfig.redirectTo) {
                throw new Error('No controller actionMethod found for "' + url + '".');
            }
            if (_config2.default.additionalArgs.verbose) {
                _config2.default.logFnc('Binding "' + url + '" to "' + localConfig.verb.toUpperCase() + '".');
                if (localConfig.headers) {
                    _config2.default.logFnc('Will set additional headers: ');
                    _config2.default.logFnc(JSON.stringify(localConfig.headers));
                }
                if (localConfig.requiresAuth) {
                    _config2.default.logFnc('"' + url + '" requires authorization.');
                }
                if (localConfig.redirectTo) {
                    _config2.default.logFnc('"' + url + '" will redirect to "' + localConfig.redirectTo + '", and the URL will ' + (localConfig.keepOldURL ? 'remain "' + url + '"' : 'will change to "' + localConfig.redirectTo + '"'));
                }
            }

            switch (localConfig.verb.toLowerCase()) {
                case 'post':
                    server.post(url, function (req, res) {
                        if (localConfig.redirectTo) {
                            res.redirect(307, localConfig.redirectTo + _utils.objUtils.objToQueryString(req.query));
                        } else {
                            processRequest(req, res, localConfig, controllerMethod);
                        }
                    });
                    break;
                case 'put':
                    server.put(url, function (req, res) {
                        if (localConfig.redirectTo) {
                            res.redirect(307, localConfig.redirectTo + _utils.objUtils.objToQueryString(req.query));
                        } else {
                            processRequest(req, res, localConfig, controllerMethod);
                        }
                    });
                    break;
                case 'delete':
                    server.delete(url, function (req, res) {
                        if (localConfig.redirectTo) {
                            res.redirect(307, localConfig.redirectTo + _utils.objUtils.objToQueryString(req.query));
                        } else {
                            processRequest(req, res, localConfig, controllerMethod);
                        }
                    });
                    break;
                case 'options':
                    server.options(url, function (req, res) {
                        if (localConfig.redirectTo) {
                            res.redirect(307, localConfig.redirectTo + _utils.objUtils.objToQueryString(req.query));
                        } else {
                            processRequest(req, res, localConfig, controllerMethod);
                        }
                    });
                    break;
                case 'get':
                default:
                    server.get(url, function (req, res) {
                        if (localConfig.redirectTo) {
                            if (localConfig.keepOldURL) {
                                // Will request the page manually here via request library
                                // and pipe it through as if it were coming from this request instance
                                (0, _request2.default)({
                                    uri: req.protocol + '://' + req.hostname + ':' + (localConfig.additionalArgs.serverPort || 80) + localConfig.redirectTo + _utils.objUtils.objToQueryString(req.query),
                                    method: 'GET',
                                    headers: req.headers
                                }, function (err, response) {
                                    res.set(_lodash2.default.assign(localConfig.headers || {}, {
                                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                                        'Pragma': 'no-cache',
                                        'Expires': 0
                                    }));
                                    if (err) {
                                        res.send(err);
                                    } else {
                                        res.send(response.body);
                                    }
                                });
                            } else {
                                res.redirect(localConfig.redirectTo + _utils.objUtils.objToQueryString(req.query));
                            }
                        } else if (!checkRequestAuthorized(localConfig, req, res)) {
                            // The user-provided authCheckFnc returns false, or the authCookie doesn't exist (if cookieParser() middleware is being used)
                            if (localConfig.loginRoutePath) {
                                res.redirect(localConfig.loginRoutePath + _utils.objUtils.objToQueryString(req.query) + 'returnUrl=' + encodeURIComponent(req.url));
                            } else {
                                res.status(401).end();
                            }
                        } else {
                            debugger;
                            res.set(localConfig.headers || {});
                            controllerMethod(req, res);
                        }
                    });
                    break;
            }
        })();
    }
}

function bindRoutes(_ref3) {
    var server = _ref3.server;
    var routesConfig = _ref3.routesConfig;
    var allControllers = _ref3.allControllers;
    var options = _ref3.options;

    _config2.default.additionalArgs = options || {};
    _config2.default.authCheckFnc = _config2.default.additionalArgs.authCheckFnc || function () {
        return true;
    };
    _config2.default.logFnc = options.logFnc || function (msg) {
        console.log(msg);
    };
    _config2.default.authCookieName = _config2.default.additionalArgs.authCookieName || null;
    _config2.default.additionalArgs.verbose = _config2.default.additionalArgs.verbose || false;

    var _loop = function _loop(url) {
        var config = routesConfig[url];
        config = _lodash2.default.isArray(config) ? config : [config]; // lol Javascript
        config.forEach(function (localConfig) {
            if (localConfig.isLogin && !config.loginRoutePath) {
                // You can only have one login route per app. Does it make sense to have more than one? I don't think
                config.loginRoutePath = url;
            }
            bindConfig({ server: server, localConfig: localConfig, url: url, allControllers: allControllers });
        });
    };

    for (var url in routesConfig) {
        _loop(url);
    }
}