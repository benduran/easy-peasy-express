
var express = require('express'),
    easyPeasy = require('./easy-peasy-express');

var server = express();
server.use(require('body-parser').json());
easyPeasy(server, './routes.json', './controllers');

var httpListener = server.listen(80, function () {
    console.log('Express is now listening for connections on port ' + httpListener.address().port);
});
