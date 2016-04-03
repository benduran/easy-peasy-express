
var express = require('express'),
    easyPeasy = require('../easy-peasy-express');

var server = express();
server.use(require('body-parser').json());
easyPeasy(server, './routes.json', './controllers', {
    serverPort: 8084,
    verbose: true,
    authCheckFnc: function (req, res) {
        return false;
    }
});

var httpListener = server.listen(8084, function () {
    console.log('Express is now listening for connections on port ' + httpListener.address().port);
});
