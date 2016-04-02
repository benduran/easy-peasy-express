'use strict';

exports.superAwesomeDelete = function (req, res) {
    res.json({
        msg: 'Deleted user with group "' + req.params.group + '" and id "' + req.params.userId + '"'
    });
    res.end();
};
