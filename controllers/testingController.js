'use strict';

exports.test = function (req, res) {
    res.json({
        hello: 'FROM THE OTHER SIDE!!!'
    });
    res.end();
};
