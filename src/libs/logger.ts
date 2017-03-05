class Logger {
    private _name: string;
    constructor(name: string) {
        this._name = name;
    }
    log(...msgs): void {
        console.log(`[${(new Date()).toLocaleString()}] [${this._name}] : ${msgs.join(" ")}`);
    }
}
var loggers: {[name:string]: Logger} = {};
export function getLogger(name: string): Logger {
    name = name || "console";
    if (!loggers[name]) {
        loggers[name] = new Logger(name);
    }
    return loggers[name];
}