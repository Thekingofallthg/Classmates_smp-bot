const config = require('./config');

class Logger {
    constructor() {
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        this.currentLevel = this.levels[config.LOG_LEVEL] || this.levels.info;
    }

    formatMessage(level, ...args) {
        const timestamp = new Date().toISOString();
        const levelStr = level.toUpperCase().padEnd(5);
        const message = args.join(' ');
        return `[${timestamp}] ${levelStr} ${message}`;
    }

    debug(...args) {
        if (this.currentLevel <= this.levels.debug) {
            console.log(this.formatMessage('debug', ...args));
        }
    }

    info(...args) {
        if (this.currentLevel <= this.levels.info) {
            console.log(this.formatMessage('info', ...args));
        }
    }

    warn(...args) {
        if (this.currentLevel <= this.levels.warn) {
            console.warn(this.formatMessage('warn', ...args));
        }
    }

    error(...args) {
        if (this.currentLevel <= this.levels.error) {
            console.error(this.formatMessage('error', ...args));
        }
    }
}

module.exports = new Logger();
