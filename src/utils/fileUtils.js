'use strict';

import glob from 'glob';
import fs from 'fs';

export function readFile(filePath, parseJSON = true) {
    try {
        const contents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(contents);
    }
    catch (ex) {
        console.log(ex);
        throw ex;
    }
}

export function readDir(dirPath, filter = '*.*') {
    return glob.sync(`${dirPath}/*${filter}`);
}

export function getFileName(filePath) {
    const lastSlashIndex = filePath.lastIndexOf('/');
    return filePath.substring(lastSlashIndex + 1).replace(/\..+$/, '');
}
