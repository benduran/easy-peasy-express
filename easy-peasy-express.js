'use strict';

const
    fs = require('fs'),
    path = require('path');

const
    mime = require('mime'),
    request = require('request'),
    _ = require('lodash');

let
    loginRoutePath = null,
    additionalArgs = null,
    authCheckFnc = null,
    authCookieName = null,
    logFnc = null;

function objToQueryString(obj) {
    let query = '?';
    for (let prop in obj) {
        query += prop + '=' + obj[prop].toString() + '&';
    }
    return query;
}

function fixRequirePath(p) {
    p = path.normalize(p);
    return path.resolve(p);
}

function findControllerMethod(fncName, allControllers) {
    fncName = fncName || '';
    let controllerName = null,
        requiresControllerName = false;
    if (fncName.indexOf('.') > -1) {
        let sFncName = fncName.split('.');
        controllerName = sFncName[0];
        fncName = sFncName.length > 1 ? sFncName[1] : null;
        requiresControllerName = true;
    }
    controllerName = controllerName ? new RegExp(controllerName + '\.[a-zA-Z][a-zA-Z0-9]+$', 'i') : null;
    if (fncName) {
        for (let cPath in allControllers) {
            let c = allControllers[cPath];
            if (!requiresControllerName || (controllerName && controllerName.test(cPath))) {
                for (let cFnc in c) {
                    if (cFnc.toLowerCase() === fncName.toLowerCase()) {
                        return c[cFnc];
                    }
                }
            }
        }
    }
    return null;
}

function checkRequestAuthorized(routeConfig, req, res) {
    return !routeConfig.requiresAuth ||
        (authCookieName && req.cookies && req.cookies[authCookieName]) ||
        authCheckFnc(req, res);
}

function processRequest(req, res, config, controllerMethod) {
    if (!checkRequestAuthorized(config, req, res)) {
        res.status(401).end();
    } else {
        res.set(config.headers || {});
        controllerMethod(req, res);
    }
}

function recurseGetAllFiles(dirPath, exts, allFiles) {
    allFiles = allFiles || [];
    const allPathsAndFilesInDir = fs.readdirSync(dirPath);
    allPathsAndFilesInDir.forEach((fp) => {
        try {
            const fPath = path.join(dirPath, fp);
            const dirPathStat = fs.statSync(fPath);
            if (dirPathStat.isDirectory()) {
                allFiles = recurseGetAllFiles(fPath, exts, allFiles);
            } else {
                for (let i = 0; i < exts.length; i++) {
                    if (fPath.endsWith(exts[i])) {
                        allFiles.push(path.resolve(fPath));
                        break;
                    }
                }
            }
        } catch (ex) {
            throw ex;
        }
    });
    return allFiles;
}

function wireStaticDir(config, verbose, url, server) {
    // Check if the directory actually exists
    const dirPath = path.resolve(path.join(process.cwd(), config.staticDir));
    try {
        const dirStat = fs.statSync(dirPath);
        if (dirStat.isDirectory()) {
            // Recursively get all filePaths in this dir
            const allowedFiles = recurseGetAllFiles(dirPath, config.allowedExt);
            allowedFiles.forEach((fp) => {
                const serveThis = (url + fp.replace(dirPath, '')).replace(/\\/g, '/');
                if (verbose) {
                    logFnc('Will serve static file "' + serveThis + '".');
                }
                server.get(serveThis, function (req, res) {
                    try {
                        res.set('Content-Type', mime.lookup(req.url))
                            .send(fs.readFileSync(_.find(allowedFiles, (p) => {
                                const matchThis = p.replace(/\\/g, '/').replace(config.staticDir, url);
                                return matchThis.endsWith(req.url);
                            })))
                            .end();
                    } catch (ex) {
                        // If we get here, the file no longer exists!
                        res.send(ex.toString()).end();
                    }
                });
            });
        }
    } catch (ex) {
        logFnc('Unable to wire static dir "' + dirPath + '".');
        logFnc(ex);
    }
}

function bindConfig(server, config, url, allControllers) {
    if (!config) {
        throw new Error('No config object found for route "' + url + '".');
    }

    if (config.staticFiles) {
        wireStaticDir(config, additionalArgs.verbose, url, server);
    } else {
        if (!config.actionMethod && !config.redirectTo) {
            throw new Error('No actionMethod name found on the route config for "' + url + '"');
        }
        let controllerMethod = findControllerMethod(config.actionMethod, allControllers);
        if (!controllerMethod && !config.redirectTo) {
            throw new Error('No controller actionMethod found for "' + url + '".');
        }
        if (additionalArgs.verbose) {
            logFnc('Binding "' + url + '" to "' + config.verb.toUpperCase() + '".');
            if (config.headers) {
                logFnc('Will set additional headers: ');
                logFnc(JSON.stringify(config.headers));
            }
            if (config.requiresAuth) {
                logFnc('"' + url + '" requires authorization.');
            }
            if (config.redirectTo) {
                logFnc('"' + url + '" will redirect to "' + config.redirectTo + '", and the URL will ' + (config.keepOldURL ? ('remain "' + url + '"') : ('will change to "' + config.redirectTo + '"')));
            }
        }

        switch (config.verb.toLowerCase()) {
        case 'post':
            server.post(url, function (req, res) {
                processRequest(req, res, config, controllerMethod);
            });
            break;
        case 'put':
            server.put(url, function (req, res) {
                processRequest(req, res, config, controllerMethod);
            });
            break;
        case 'delete':
            server.delete(url, function (req, res) {
                processRequest(req, res, config, controllerMethod);
            });
            break;
        case 'options':
            server.options(url, function (req, res) {
                processRequest(req, res, config, controllerMethod);
            });
            break;
        case 'get':
        default:
            server.get(url, (req, res) => {
                if (config.redirectTo) {
                    if (config.keepOldURL) {
                        // Will request the page manually here via request library
                        // and pipe it through as if it were coming from this request instance
                        request({
                            uri: req.protocol + '://' + req.hostname + ':' + (additionalArgs.serverPort || 80) + config.redirectTo + objToQueryString(req.query),
                            method: 'GET',
                            headers: req.headers
                        }, (err, response) => {
                            res.set(_.assign(config.headers || {}, {
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
                        res.redirect(config.redirectTo + objToQueryString(req.query));
                    }
                } else if (!checkRequestAuthorized(config, req, res)) {
                    // The user-provided authCheckFnc returns false, or the authCookie doesn't exist (if cookieParser() middleware is being used)
                    if (loginRoutePath) {
                        res.redirect(loginRoutePath + objToQueryString(req.query) + 'returnUrl=' + encodeURIComponent(req.url));
                    } else {
                        res.status(401).end();
                    }
                } else {
                    res.set(config.headers || {});
                    controllerMethod(req, res);
                }
            });
            break;
        }
    }
}

function bindRoutes(server, routesConfig, allControllers, args) {
    additionalArgs = args || {};
    authCheckFnc = additionalArgs.authCheckFnc || function () {
        return true;
    };
    logFnc = args.logFnc || function (msg) {
        console.log(msg);
    };
    authCookieName = additionalArgs.authCookieName || null;
    additionalArgs.verbose = additionalArgs.verbose || false;
    for (let url in routesConfig) {
        let config = routesConfig[url];
        config = _.isArray(config) ? config : [config]; // lol Javascript
        config.forEach((localConfig) => {
            if (localConfig.isLogin && !loginRoutePath) {
                // You can only have one login route per app. Does it make sense to have more than one? I don't think
                loginRoutePath = url;
            }
            bindConfig(server, localConfig, url, allControllers);
        });
    }
}

module.exports = function (server, pathToRouteConfig, pathToControllers, args) {
    pathToRouteConfig = fixRequirePath(pathToRouteConfig);
    pathToControllers = fixRequirePath(pathToControllers);
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
    const routesConfig = require(pathToRouteConfig);

    const allControllerPaths = fs.readdirSync(pathToControllers);
    allControllerPaths.forEach((c) => {
        let pathToController = pathToControllers + '/' + c;
        let theController = require(pathToControllers + '/' + c);
        allControllers[pathToController] = theController;
    });
    bindRoutes(server, routesConfig, allControllers, args);
    return server;
};
