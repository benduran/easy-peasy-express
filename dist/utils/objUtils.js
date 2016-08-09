'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.objToQueryString = objToQueryString;
function objToQueryString(obj) {
    var query = '?';
    for (var prop in obj) {
        query += prop + '=' + obj[prop].toString() + '&';
    }
    return query;
}