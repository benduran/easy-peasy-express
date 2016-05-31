'use strict';

exports.somewhereElsePost = function (req, res) {
    // We should absolutely not get here on a post
    console.log('Request is coming through');
    res.json({
        bad: 'Should not have gotten here'
    }).end();
};

exports.redirectionPost = function (req, res) {
    console.log('Redirect success!');
    res.json({
        postRedirect: 'success!'
    }).end();
};

exports.somewhereElsePut = function (req, res) {
    res.json(Object.assign({
        bad: 'Should not have gotten into this PUT'
    }, req.body)).end();
};

exports.redirectPut = function (req, res) {
    res.json(Object.assign({
        putRedirect: 'Awesome!'
    }, req.body)).end();
};
