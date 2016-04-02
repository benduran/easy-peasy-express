'use strict';

var fs = require('fs'),
request = require('request'),
_ = require('lodash'),
loginRoutePath = null,
additionalArgs = null,
authCheckFnc = null,
authCookieName = null;

function objToQueryString(obj) {
  var query = '?';
  for(let prop in obj) {
    query += prop + '=' + obj[prop].toString() + '&';
  }
  return query;
}

function fixRequirePath(path) {
  return '/' + path.replace('../', '').replace('./', '').replace('\\..', '').replace('\\.', '');
}

function findControllerMethod(fncName, allControllers) {
  if(fncName) {
    for(let cPath in allControllers) {
      let c = allControllers[cPath];
      for(let cFnc in c) {
        if(cFnc.toLowerCase() == fncName.toLowerCase()) {
          return c[cFnc];
        }
      }
    }
  }
  return null;
}

function bindConfig(server,config, url,  loginRoutePath, allControllers){
  if(!config) {
    throw new Error('No config object found for route "' + fullPath + '".');
  }
  if(!config.actionMethod && !config.redirectTo) {
    throw new Error('No actionMethod name found on the route config for "' + fullPath + '"');
  }
  let controllerMethod = findControllerMethod(config.actionMethod, allControllers);
  if(!controllerMethod && !config.redirectTo) {
    throw new Error('No controller actionMethod found for "' + fullPath + '".');
  }
  if(additionalArgs.verbose) {
    console.log('Binding "' + url + '" to "' + config.verb.toUpperCase() + '".');
    if(config.headers) {
      console.log('Will set additional headers: ');
      console.log(JSON.stringify(config.headers));
    }
    if(config.requiresAuth) {
      console.log('"' + url + '" requires authorization.');
    }
    if(config.redirectTo) {
      console.log('"' + url + '" will redirect to "' + config.redirectTo + '", and the URL will ' + (config.keepOldURL ? ('remain "' + url + '"') : ('will change to "' + config.redirectTo + '"')));
    }
  }

  switch(config.verb.toLowerCase()) {
    case 'post':
    server.post(url, (req, res) => {
      if(config.requiresAuth && ((authCookieName && req.cookies && !req.cookies[authCookieName])) || !authCheckFnc(req, res)) {
        res.status(401).end();
      }
      else {
        res.set(config.headers || {});
        controllerMethod(req, res);
      }
    });
    break;
    case 'put':
    server.put(url, (req, res) => {
      if(config.requiresAuth && ((authCookieName && req.cookies && !req.cookies[authCookieName])) || !authCheckFnc(req, res)) {
        res.status(401).end();
      }
      else {
        res.set(config.headers || {});
        controllerMethod(req, res);
      }
    });
    break;
    case 'delete':
    server.delete(url, (req, res) => {
      if(config.requiresAuth && ((authCookieName && req.cookies && !req.cookies[authCookieName])) || !authCheckFnc(req, res)) {
        res.status(401).end();
      }
      else {
        res.set(config.headers || {});
        controllerMethod(req, res);
      }
    });
    break;
    case 'options':
    server.options(url, (req, res) => {
      if(config.requiresAuth && ((authCookieName && req.cookies && !req.cookies[authCookieName])) || !authCheckFnc(req, res)) {
        res.status(401).end();
      }
      else {
        res.set(config.headers || {});
        controllerMethod(req, res);
      }
    });
    break;
    case 'get':
    default:
    server.get(url, (req, res) => {
      if(config.redirectTo) {
        if(config.keepOldURL) {
          // Will request the page manually here via request library
          // and pipe it through as if it were coming from this request instance
          request({
            uri: req.protocol + '://' + req.hostname + ':' + (additionalArgs.serverPort || 80) + config.redirectTo + objToQueryString(req.query),
            method: 'GET',
            headers: req.headers
          }, (err, response) => {
            res.set(config.headers || {});
            if(err) {
              res.send(err);
            }
            else {
              res.send(response.body);
            }
          });
        }
        else {
          res.redirect(config.redirectTo + objToQueryString(req.query));
        }
      }
      else if(config.requiresAuth && (!authCheckFnc(req, res) || (authCookieName && req.cookies && !req.cookies[authCookieName]))) {
        // The user-provided authCheckFnc returns false, or the authCookie doesn't exist (if cookieParser() middleware is being used)
        if(loginRoutePath) {
          res.redirect(loginRoutePath + objToQueryString(req.query) + 'returnUrl=' + encodeURIComponent(req.url));
        }
        else {
          res.status(401).end();
        }
      }
      else {
        res.set(config.headers || {});
        controllerMethod(req, res);
      }
    });
    break;
  }
}


function bindRoutes(server, routesConfig, allControllers, args) {
  additionalArgs = args || {};
  authCheckFnc = additionalArgs.authCheckFnc || function () { return true; };
  authCookieName = additionalArgs.authCookieName || null;
  var loginRoutePath =null
  additionalArgs.verbose = additionalArgs.verbose || false;
  for(let r in routesConfig)     {
    let url = r;
    let config = routesConfig[r];
    if(_.isArray(config)){
      for (let c of config) {
        if(config.isLogin && !loginRoutePath) {
          // You can only have one login route per app. Does it make sense to have more than one? I don't think
          loginRoutePath = url;
        }
        bindConfig(server,c, url, loginRoutePath, allControllers)
        }
      }else{
        if(config.isLogin && !loginRoutePath) {
          // You can only have one login route per app. Does it make sense to have more than one? I don't think
          loginRoutePath = url;
        }
        bindConfig(server,config, url,loginRoutePath, allControllers)
      }

    }
  }


  module.exports = function (server, pathToRouteConfig, pathToControllers, args) {
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
    bindRoutes(server, routesConfig, allControllers, args);
  };
