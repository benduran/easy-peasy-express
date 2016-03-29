'use strict';

var fs = require('fs');

function fixRequirePath(path) {
    return '/' + path.replace('../', '').replace('./', '').replace('\\..', '').replace('\\.', '');
}

function findControllerMethod(fncName, allControllers) {
    for(let cPath in allControllers) {
        let c = allControllers[cPath];
        for(let cFnc in c) {
            if(cFnc.toLowerCase() == fncName.toLowerCase()) {
                return c[cFnc];
            }
        }
    }
    return null;
}

function bindRoutes(server, routesConfig, allControllers) {
    for(let r in routesConfig)     {
        let fullPath = r;
        let firstSlashIndex = fullPath.indexOf('/');
        let method = fullPath.substring(0, firstSlashIndex);
        let url = fullPath.substring(firstSlashIndex);
        let config = routesConfig[r];
        if(!config) {
            throw new Error('No config object found for route "' + fullPath + '".');
        }
        if(!config.actionMethod) {
            throw new Error('No actionMethod name found on the route config for "' + fullPath + '"');
        }
        let controllerMethod = findControllerMethod(config.actionMethod, allControllers);
        if(!controllerMethod) {
            throw new Error('No controller actionMethod found for "' + fullPath + '".');
        }
        console.log('Binding "' + url + '" to "' + method.toUpperCase() + '".');
        switch(method.toLowerCase()) {
            case 'post':
                server.post(url, (req, res) => {
                    controllerMethod(req, res);
                });
                break;
            case 'put':
                server.put(url, (req, res) => {
                    controllerMethod(req, res);
                });
                break;
            case 'delete':
                server.delete(url, (req, res) => {
                    controllerMethod(req, res);
                });
                break;
            case 'options':
                server.options(url, (req, res) => {
                    controllerMethod(req, res);
                });
                break;
            case 'get':
            default:
                server.get(url, (req, res) => {
                    controllerMethod(req, res);
                });
                break;
        }
    }
}


module.exports = function (server, pathToRouteConfig, pathToControllers) {
    pathToRouteConfig = fixRequirePath(pathToRouteConfig);
    pathToControllers = fixRequirePath(pathToControllers);
    if(!server) {
        throw new Error('Why did\'nt you give EasyPeasy an Express app?');
    }
    if(!pathToRouteConfig) {
        throw new Error('No path to route config.json provided. Look, the whole point of EasyPeasy was to, well, be easy peasy. I can\'nt do this without a route config!');
    }
    if(!pathToControllers) {
        throw new Error('Sorry, Holmes. You did\'nt tell me about any of your controllers, so how am I supposed to wire these routes up?');
    }
    var allControllers = {},
        routesConfig = require(process.cwd() + pathToRouteConfig);

    pathToControllers = process.cwd() + pathToControllers;
    var allControllerPaths = fs.readdirSync(pathToControllers);
    allControllerPaths.forEach((c) => {
        let pathToController = pathToControllers + '/' + c;
        let theController = require(pathToControllers + '/' + c);
        allControllers[pathToController] = theController;
    });
    bindRoutes(server, routesConfig, allControllers);
};
