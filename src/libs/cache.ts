class Cache {
    private _name: string;
    private _doc: any;
    constructor(name: string){
        this._name = name;
        this._doc = {};
    }
    get(key: string): any {
        return this._doc[key];
    }
    set(key: string , value: any): void {
        this._doc[key] = value;
    }
    del(key: string): void {
        delete this._doc[key];
    }
    exist(key: string): boolean {
        return key in this._doc;
    }
}

var pool: {[type: string]: Cache} = {};
export function createInstance(name: string): Cache {
    if (!pool[name]) {
        pool[name] = new Cache(name);
    }
    return pool[name]
}