'use strict';

var fs = require('fs'),
	request = require('request'),
	path = require('path'),
	_ = require('lodash'),
	loginRoutePath = null,
	additionalArgs = null,
	authCheckFnc = null,
	authCookieName = null;

function objToQueryString(obj) {
	var query = '?';
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
	var controllerName = null,
		requiresControllerName = false;
	if(fncName.indexOf('.') > -1) {
		let sFncName = fncName.split('.');
		controllerName = sFncName[0];
		fncName = sFncName.length > 1 ? sFncName[1] : null;
		requiresControllerName = true;
	}
	controllerName = controllerName ? new RegExp(controllerName + '\.[a-zA-Z][a-zA-Z0-9]+$', 'i') : null;
	if (fncName) {
		for (let cPath in allControllers) {
			let c = allControllers[cPath];
			if(!requiresControllerName || (controllerName && controllerName.test(cPath))) {
				for (let cFnc in c) {
					if (cFnc.toLowerCase() == fncName.toLowerCase()) {
						return c[cFnc];
					}
				}
			}
		}
	}
	return null;
}

function checkRequestAuthorized(routeConfig, req, res) {
	// If an authCookie name was provided, only use that as the method for authCookie
	if(routeConfig.requiresAuth) {
		if(authCookieName) {
			return req.cookies && req.cookies[authCookieName];
		}
		return authCheckFnc(req, res);
	}
	return true;
}

function processRequest(req, res, config, controllerMethod) {
	if (!checkRequestAuthorized(config, req, res)) {
		res.status(401).end();
	} else {
		res.set(config.headers || {});
		controllerMethod(req, res);
	}
}

function bindConfig(server, config, url, allControllers) {
	if (!config) {
		throw new Error('No config object found for route "' + url + '".');
	}
	if (!config.actionMethod && !config.redirectTo) {
		throw new Error('No actionMethod name found on the route config for "' + url + '"');
	}
	let controllerMethod = findControllerMethod(config.actionMethod, allControllers);
	if (!controllerMethod && !config.redirectTo) {
		throw new Error('No controller actionMethod found for "' + url + '".');
	}
	if (additionalArgs.verbose) {
		console.log('Binding "' + url + '" to "' + config.verb.toUpperCase() + '".');
		if (config.headers) {
			console.log('Will set additional headers: ');
			console.log(JSON.stringify(config.headers));
		}
		if (config.requiresAuth) {
			console.log('"' + url + '" requires authorization.');
		}
		if (config.redirectTo) {
			console.log('"' + url + '" will redirect to "' + config.redirectTo + '", and the URL will ' + (config.keepOldURL ? ('remain "' + url + '"') : ('will change to "' + config.redirectTo + '"')));
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
							res.set(config.headers || {});
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


function bindRoutes(server, routesConfig, allControllers, args) {
	additionalArgs = args || {};
	authCheckFnc = additionalArgs.authCheckFnc || function() {
		return true;
	};
	authCookieName = additionalArgs.authCookieName || null;
	additionalArgs.verbose = additionalArgs.verbose || false;
	for (var url in routesConfig) {
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


module.exports = function(server, pathToRouteConfig, pathToControllers, args) {
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
	var allControllers = {},
		routesConfig = require(pathToRouteConfig);

	var allControllerPaths = fs.readdirSync(pathToControllers);
	allControllerPaths.forEach((c) => {
		let pathToController = pathToControllers + '/' + c;
		let theController = require(pathToControllers + '/' + c);
		allControllers[pathToController] = theController;
	});
	bindRoutes(server, routesConfig, allControllers, args);
    return server;
};
