'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _utils = require('./utils');

var _routing = require('./routing');

var routing = _interopRequireWildcard(_routing);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(_ref) {
    var pathToRouteConfig = _ref.pathToRouteConfig;
    var pathToControllers = _ref.pathToControllers;
    var server = _ref.server;
    var options = _ref.options;

    pathToRouteConfig = _utils.pathUtils.fixRequirePath(pathToRouteConfig);
    pathToControllers = _utils.pathUtils.fixRequirePath(pathToControllers);
    if (!server) {
        throw new Error('Why did\'nt you give EasyPeasy an Express app?');
    }
    if (!pathToRouteConfig) {
        throw new Error('No path to route config.json provided. Look, the whole point of EasyPeasy was to, well, be easy peasy. I can\'nt do this without a route config!');
    }
    if (!pathToControllers) {
        throw new Error('Sorry, Holmes. You did\'nt tell me about any of your controllers, so how am I supposed to wire these routes up?');
    }
    var allControllers = {};
    var routesConfig = _utils.fileUtils.readFile(pathToRouteConfig);

    var allControllerPaths = _utils.fileUtils.readDir(pathToControllers);
    allControllerPaths.forEach(function (c) {
        var theController = require(c);
        allControllers[_utils.fileUtils.getFileName(c)] = theController;
    });
    console.log(allControllers);
    routing.bindRoutes({
        server: server,
        routesConfig: routesConfig,
        allControllers: allControllers,
        options: options
    });
    return server;
}

exports.default = init;