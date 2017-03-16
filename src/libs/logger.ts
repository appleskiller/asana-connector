import * as fs from "fs";

const limit = 10;
var history = [];

class Logger {
    private _name: string;
    constructor(name: string) {
        this._name = name;
    }
    log(...msgs): void {
        var msg = `[${(new Date()).toLocaleString()}] [${this._name}] : ${msgs.join(" ")}`;
        console.log(msg);
        history.unshift(msg);
        if (history.length > limit) {
            history.length = limit;
        }
        fs.appendFileSync("./out.log" , msg+"\r\n" , "utf8");
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

export function getHistory(): string[] {
    return history;
}