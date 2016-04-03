'use strict';

exports.testPost = function (req, res) {
    res.json({
        args: req.body || {},
        success: 'definitely'
    });
    res.end();
};

exports.testPutOnSameController = function (req, res) {
    res.json({
        args: req.body || {},
        uriFragments: req.params || {},
        success: 'YES YES!'
    });
    res.end();
};
