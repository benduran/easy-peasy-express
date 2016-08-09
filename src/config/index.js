'use strict';

class EasyPeasyConfig {
    constructor(args = {}) {
        this.loginRoutePath = args.loginRoutePath || null;
        this.additionalArgs = args.additionalArgs || null;
        this.authCheckFnc = args.authCheckFnc || null;
        this.authCookieName = args.authCookieName || null;
        this.logFnc = args.logFnc || null;
    }
}

export default new EasyPeasyConfig();
