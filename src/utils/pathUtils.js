'use strict';

import path from 'path';

export function fixRequirePath(p) {
    const normalized = path.normalize(p);
    return path.resolve(normalized);
}
