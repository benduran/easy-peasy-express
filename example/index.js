'use strict';

const
    path = require('path');

const
    express = require('express');

const
    easyPeasy = require('../easy-peasy-express');

const server = module.exports = express();
server.use(require('body-parser').json());
easyPeasy(server, path.join(__dirname, '/routes.json'), path.join(__dirname, '/controllers'), {
    serverPort: 8084,
    verbose: true,
    authCheckFnc: function authCheckFnc(req, res) {
        return false;
    }
});

var httpListener = server.listen(8084, function () {
    console.log('Express is now listening for connections on port ' + httpListener.address().port);
});
