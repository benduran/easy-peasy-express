'use strict';

import path from 'path';
import fs from 'fs';

import YAML from 'yamljs';

class EasyPeasyEngine {
    constructor(args = {}) {
        const {
            routesFile,
            controllersFolder
        } = args;
        if (!routesFile) {
            throw new Error('A route file must be provided when using easy-peasy-express.');
        }
        if (!controllersFolder) {
            throw new Error('A path to the folder where your express controllers are located must be provided when using easy-peasy-express.');
        }
        this.routesFile = path.resolve(routesFile);
        this.controllersFolder = this.cwd, path.resolve(controllersFolder);
        this.routes = {};
        this.controllers = {};
        this.init();
    }
    init() {
        // Will load your routeFile, parse it, then loader all the controllers in your folder
        if (fs.existsSync(this.routesFile)) {
            if (this.routesFile.endsWith('yaml') || this.routesFile.endsWith('yml')) {
                this.routes = YAML.parse(fs.readFileSync(this.routesFile, 'utf8'));
            }
            else {
                this.routes = JSON.parse(fs.readFileSync(this.routesFile, 'utf8'));
            }
        }
    }
}

export default EasyPeasyEngine;
