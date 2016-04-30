# easy-peasy-express

[npm-image]: https://img.shields.io/npm/v/easy-peasy-express.svg?style=flat
[npm-url]: https://www.npmjs.com/package/easy-peasy-express
[downloads-image]: https://img.shields.io/npm/dm/easy-peasy-express.svg?style=flat
[downloads-url]: https://www.npmjs.com/package/easy-peasy-express

[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][downloads-url]

A super simple way to configure URL routes in your express app. It's all about dat config, yo!

# Install
``npm install easy-peasy-express --save``

# Usage
easy-peasy-express requires two lines of code when you create your Express.js server instance. Everything else is 100% config-driven.

### The Javascript

```javascript
// Obviously, we'll need to require express and easy-peasy-express.
var express = require('express'),
easyPeasy = require('easy-peasy-express');

var server = express();

/* Include your middleware, as desired. */
server.use(require('body-parser').json());

/* Tell easy-peasy-express about your server setup. */
/* Provide it the Express instance, relative path to your routes.json config, relative path to your controllers folder, and a JSON object with options. */
easyPeasy(server, './routes.json', './controllers', { ...options });

var httpListener = server.listen(8084, function () {
    console.log('Express is now listening for connections on port ' + httpListener.address().port);
});

```

### Options

**verbose**

Determines whether to log the binding of routes and rules to the node console. Defaults to ``false``.

**serverPort**

Required to be set if you set the **redirectTo** and **keepOldURL** to ``true`` (see ``routeConfig`` below), as it's needed to maintain the same-origin policy when requesting content from the **redirectTo** url and keeping the old URL. Defaults to ``80``

**authCookieName**

Provide the cookie name that is being used to house your authentication cookie. If this is set, the presence of a cookie that matches this cookie name will assume the user is authenticated. **NOTE:** This assumes there will be a ``req.cookies`` property available to read on the Express ``res`` object, which is typically provided via a middleware like ``cookie-parser``.


**authCheckFnc**

Custom ``function`` that accepts Express's **req** and **res** arguments. Use this when you want to specify custom logic to determine if your requests are authenticated for routes that have their **requiresAuth** options set to ``true``. Defaults to ``function () { return true; }``.

**logFnc**

If you'd like to log any messages to a custom location / logging implementation that are resulting from settings the ``verbose`` flag to ``true``, provide a function here. Function will take a single argument, which is the message trying to be logged. Defaults to ``function (msg) { console.log(msg); }``

### Route Config
As mentioned before, easy-peasy-express tries to remove the programmatic setting / wiring of server routes by abstracting that away so that your routes are all based on a config file.

Your route config file should be in a valid JSON format, though it can be of any file extension type, so long as the file's content is valid ``utf8`` text.

#### Sample Route Config
```javascript
{
   "/test":{
      "verb":"get",
      "actionMethod":"test",
      "requiresAuth":true
   },
   "/login":[
      {
         "verb":"get",
         "actionMethod":"loginPage",
         "isLogin":true,
         "headers":{
            "Content-Type":"text/html; charset=utf8",
            "X-Suck-It-Trebek":"Okay!"
         }
      },
      {
         "verb":"post",
         "actionMethod":"loginPage",
         "isLogin":true,
         "headers":{
            "Content-Type":"text/html; charset=utf8",
            "X-Suck-It-Trebek":"Okay!"
         }
      }
   ],
   "/redirectPlease":{
      "verb":"get",
      "redirectTo":"/login",
      "keepOldURL":true,
      "headers":{
         "Content-Type":"text/html; charset=utf8"
      }
   },
   "/deeper/still":{
      "verb":"post",
      "actionMethod":"testPost"
   },
   "/big/fat/put/:someRandomId":{
      "verb":"put",
      "actionMethod":"testPutOnSameController"
   },
   "/user/:group/:userId":{
      "verb":"delete",
      "actionMethod":"superAwesomeDelete"
   }
}

```

You'll notice that each route is structured in a ``/{url}/{stuff}/{here}: { ...options }`` format. The object's key becomes the URL itself. The options can come in the form of a single option, or multiple options via array syntax. This would allow you to specify multiple verbs per a given URL route. An options object can consist of the following:

**actionMethod**

The function name that this URL route will be bound to. Anytime this URL is requested, this function will be called and provided Express's ``req`` and ``res`` arguments. This function **definitely** needs to exist on one of the controllers in your controllers directory you specified when you initialized ``easy-peasy-express``. You can be vague and simply specify a function name that exists on one of your controllers, or you can be more specific and name space the action method to a specific controller in the ``{controllerName}.{functionName}`` format. **NOTE:** this option does *not* need to be provided if you've set the ``redirectTo`` property.

**requiresAuth**

``true``  or ``false`` for whether or not this URL route should only be accessible to a logged-in / authenticated user. Defaults to ``undefined``.

**isLogin**

When used in conjuction with ``requiresAuth: true``, this is the URL Route that a request will be redirected to if the user's request is not authenticated. Defaults to ``undefined``.

**redirectTo**

When set, will cause the current URL route to be redirected to the URL specified in this property. Defaults to ``undefined``.

**keepOldURL**

This is typically used in-conjunction with the ``redirectTo`` property. Very useful for a common single-page-application architecture where multiple URL routes need to redirect to the same View / Page.
Behind the scenes, this is using the ``request`` library to perform a ``GET`` request on the ``redirectTo`` property, with all of the original request's headers intact. **NOTE:** Only ``GET`` requests are supported at the moment.

**headers**

JSON object with any headers you would like to be set for a given request. Useful for changing from Express's default ``Content-Type``, setting custom headers, etc.

# Issues
I really want this package to be super simple to use and useful for the majority of all of your routing needs. Please feel free to report any issues via Github issues. If you want to make any improvements, please issue a pull request and I will review your changes ASAP!


# License
[MIT](https://github.com/expressjs/express/blob/master/LICENSE)
