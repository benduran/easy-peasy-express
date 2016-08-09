'use strict';

const
    path = require('path');

const
    express = require('express');

const
    easyPeasy = require('../dist/easy-peasy-express');

const server = module.exports = express();
server.use(require('body-parser').json());

easyPeasy.default({
    server,
    pathToRouteConfig: path.join(__dirname, '/routes.json'),
    pathToControllers: path.join(__dirname, '/controllers'),
    options: {
        serverPort: 8084,
        verbose: true,
        authCheckFnc: function authCheckFnc(req, res) {
            return false;
        }
    }
});

server.listen(8084, function () {
    console.log('Express is now listening for connections on port ' + this.address().port);
});
