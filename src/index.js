'use strict';

import Engine from './engine';

function getEngine(args) {
    return new Engine(args);
}

export default getEngine;
