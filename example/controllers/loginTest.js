'use strict';

var fs = require('fs');

exports.loginPage = function (req, res) {
    res.send(fs.readFileSync(process.cwd() + '/login.html', 'utf8'));
    res.end();
};
