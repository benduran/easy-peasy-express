'use strict';

import path from 'path';
import fs from 'fs';

import request from 'request';
import mime from 'mime';
import _ from 'lodash';

import {fileUtils, objUtils} from '../utils';
import config from '../config';

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
    if (fncName) {
        for (let cPath in allControllers) {
            let c = allControllers[cPath];
            if (!requiresControllerName || (controllerName && controllerName === cPath)) {
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

function wireStaticDir({config, verbose, url, server}) {
    // Check if the directory actually exists
    const dirPath = path.resolve(path.join(process.cwd(), config.staticDir));
    try {
        const dirStat = fs.statSync(dirPath);
        if (dirStat.isDirectory()) {
            // Recursively get all filePaths in this dir
            const allowedFiles = fileUtils.readDir(dirPath, config.allowedExt);
            allowedFiles.forEach((fp) => {
                const serveThis = (url + fp.replace(dirPath, '')).replace(/\\/g, '/');
                if (verbose) {
                    config.logFnc('Will serve static file "' + serveThis + '".');
                }
                server.get(serveThis, function (req, res) {
                    try {
                        res.set('Content-Type', mime.lookup(req.url))
                            .send(fs.readFileSync(_.find(allowedFiles, (p) => {
                                const matchThis = p.replace(/\\/g, '/').replace(config.staticDir, url);
                                return matchThis.endsWith(req.url);
                            })))
                            .end();
                    }
                    catch (ex) {
                        // If we get here, the file no longer exists!
                        res.send(ex.toString()).end();
                    }
                });
            });
        }
    }
    catch (ex) {
        config.logFnc('Unable to wire static dir "' + dirPath + '".');
        config.logFnc(ex);
    }
}

function checkRequestAuthorized(routeConfig, req, res) {
    return !routeConfig.requiresAuth ||
        (config.authCookieName && req.cookies && req.cookies[config.authCookieName]) ||
        config.authCheckFnc(req, res);
}

function processRequest(req, res, config, controllerMethod) {
    if (!checkRequestAuthorized(config, req, res)) {
        res.status(401).end();
    }
    else {
        res.set(config.headers || {});
        controllerMethod(req, res);
    }
}

function bindConfig({server, localConfig, url, allControllers}) {
    if (!localConfig) {
        throw new Error('No config object found for route "' + url + '".');
    }

    if (localConfig.staticFiles) {
        wireStaticDir({
            config: localConfig,
            verbose: config.additionalArgs.verbose,
            url,
            server
        });
    }
    else {
        if (!localConfig.actionMethod && !localConfig.redirectTo) {
            throw new Error('No actionMethod name found on the route config for "' + url + '"');
        }
        let controllerMethod = findControllerMethod(localConfig.actionMethod, allControllers);
        if (!controllerMethod && !localConfig.redirectTo) {
            throw new Error('No controller actionMethod found for "' + url + '".');
        }
        if (config.additionalArgs.verbose) {
            config.logFnc('Binding "' + url + '" to "' + localConfig.verb.toUpperCase() + '".');
            if (localConfig.headers) {
                config.logFnc('Will set additional headers: ');
                config.logFnc(JSON.stringify(localConfig.headers));
            }
            if (localConfig.requiresAuth) {
                config.logFnc('"' + url + '" requires authorization.');
            }
            if (localConfig.redirectTo) {
                config.logFnc('"' + url + '" will redirect to "' + localConfig.redirectTo + '", and the URL will ' + (localConfig.keepOldURL ? ('remain "' + url + '"') : ('will change to "' + localConfig.redirectTo + '"')));
            }
        }

        switch (localConfig.verb.toLowerCase()) {
            case 'post':
                server.post(url, function (req, res) {
                    if (localConfig.redirectTo) {
                        res.redirect(307, localConfig.redirectTo + objUtils.objToQueryString(req.query));
                    }
                    else {
                        processRequest(req, res, localConfig, controllerMethod);
                    }
                });
                break;
            case 'put':
                server.put(url, function (req, res) {
                    if (localConfig.redirectTo) {
                        res.redirect(307, localConfig.redirectTo + objUtils.objToQueryString(req.query));
                    }
                    else {
                        processRequest(req, res, localConfig, controllerMethod);
                    }
                });
                break;
            case 'delete':
                server.delete(url, function (req, res) {
                    if (localConfig.redirectTo) {
                        res.redirect(307, localConfig.redirectTo + objUtils.objToQueryString(req.query));
                    }
                    else {
                        processRequest(req, res, localConfig, controllerMethod);
                    }
                });
                break;
            case 'options':
                server.options(url, function (req, res) {
                    if (localConfig.redirectTo) {
                        res.redirect(307, localConfig.redirectTo + objUtils.objToQueryString(req.query));
                    }
                    else {
                        processRequest(req, res, localConfig, controllerMethod);
                    }
                });
                break;
            case 'get':
            default:
                server.get(url, (req, res) => {
                    if (localConfig.redirectTo) {
                        if (localConfig.keepOldURL) {
                            // Will request the page manually here via request library
                            // and pipe it through as if it were coming from this request instance
                            request({
                                uri: req.protocol + '://' + req.hostname + ':' + (localConfig.additionalArgs.serverPort || 80) + localConfig.redirectTo + objUtils.objToQueryString(req.query),
                                method: 'GET',
                                headers: req.headers
                            }, (err, response) => {
                                res.set(_.assign(localConfig.headers || {}, {
                                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                                    'Pragma': 'no-cache',
                                    'Expires': 0
                                }));
                                if (err) {
                                    res.send(err);
                                }
                                else {
                                    res.send(response.body);
                                }
                            });
                        }
                        else {
                            res.redirect(localConfig.redirectTo + objUtils.objToQueryString(req.query));
                        }
                    }
                    else if (!checkRequestAuthorized(localConfig, req, res)) {
                        // The user-provided authCheckFnc returns false, or the authCookie doesn't exist (if cookieParser() middleware is being used)
                        if (localConfig.loginRoutePath) {
                            res.redirect(localConfig.loginRoutePath + objUtils.objToQueryString(req.query) + 'returnUrl=' + encodeURIComponent(req.url));
                        }
                        else {
                            res.status(401).end();
                        }
                    }
                    else {
                        res.set(localConfig.headers || {});
                        controllerMethod(req, res);
                    }
                });
                break;
        }
    }
}

export function bindRoutes({server, routesConfig, allControllers, options}) {
    config.additionalArgs = options || {};
    config.authCheckFnc = config.additionalArgs.authCheckFnc || function () {
        return true;
    };
    config.logFnc = options.logFnc || function (msg) {
        console.log(msg);
    };
    config.authCookieName = config.additionalArgs.authCookieName || null;
    config.additionalArgs.verbose = config.additionalArgs.verbose || false;
    for (let url in routesConfig) {
        let config = routesConfig[url];
        config = _.isArray(config) ? config : [config]; // lol Javascript
        config.forEach((localConfig) => {
            if (localConfig.isLogin && !config.loginRoutePath) {
                // You can only have one login route per app. Does it make sense to have more than one? I don't think
                config.loginRoutePath = url;
            }
            bindConfig({server, localConfig, url, allControllers});
        });
    }
}
