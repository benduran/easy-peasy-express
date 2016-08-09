'use strict';

export function objToQueryString(obj) {
    let query = '?';
    for (let prop in obj) {
        query += prop + '=' + obj[prop].toString() + '&';
    }
    return query;
}
