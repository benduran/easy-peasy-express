'use strict';

import {pathUtils, fileUtils} from './utils';
import * as routing from './routing';

function init({pathToRouteConfig, pathToControllers, server, options}) {
    pathToRouteConfig = pathUtils.fixRequirePath(pathToRouteConfig);
    pathToControllers = pathUtils.fixRequirePath(pathToControllers);
    if (!server) {
        throw new Error('Why did\'nt you give EasyPeasy an Express app?');
    }
    if (!pathToRouteConfig) {
        throw new Error('No path to route config.json provided. Look, the whole point of EasyPeasy was to, well, be easy peasy. I can\'nt do this without a route config!');
    }
    if (!pathToControllers) {
        throw new Error('Sorry, Holmes. You did\'nt tell me about any of your controllers, so how am I supposed to wire these routes up?');
    }
    let allControllers = {};
    const routesConfig = fileUtils.readFile(pathToRouteConfig);

    const allControllerPaths = fileUtils.readDir(pathToControllers);
    allControllerPaths.forEach((c) => {
        let theController = require(c);
        allControllers[fileUtils.getFileName(c)] = theController;
    });
    console.log(allControllers);
    routing.bindRoutes({
        server,
        routesConfig,
        allControllers,
        options
    });
    return server;
}

export default init;
