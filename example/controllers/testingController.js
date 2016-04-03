'use strict';

exports.test = function (req, res) {
    res.json({
        hello: 'FROM THE OTHER SIDE!!!'
    });
    res.end();
};

exports.namespacedGET = function (req, res) {
    res.send('Congrats, this is a namespaced actionMethod!');
    res.end();
};
