import * as Promise from 'bluebird';
import * as request from 'request';

var config = require("../../config/server.json");
var token = config.shujuguan.token;
var enterprise = config.shujuguan.enterprise;

function doRequest(params, resolve, reject) {
    request(params, function (err, res, payload) {
        if (err) {
            return reject(err);
        }
        if (res.statusCode !== 200) {
            return reject(payload);
        }
        try {
            var result = JSON.parse(payload);
        } catch (err) {
            return reject(new Error("parse json error!"))
        }
        if (result.error) {
            return reject(new Error(result.error_description));
        } else {
            return resolve(result);
        }
    });
}

function convertColumnToCreat (columns: Column[]): any[] {
    // {
    //     "dataType": "STRING",
    //     "length": -1,
    //     "name": "a",
    //     "type": "TEXT"
    // }
    return [];
}

type Column = {
    columnType: string;
    dataType: string;
    name: string;
    length?: number;
}
type DataTable = {
    columns: Column[];
    name: string;
}
type RowData = {
    [name: string]: any
}
class DataTableAPI {
    private _datatable: DataTable;
    constructor (datatable?: DataTable) {
        datatable && (this._datatable = datatable);
    }
    me():DataTable {
        return this._datatable;
    }
    instance(datatable: DataTable): DataTableAPI {
        return new DataTableAPI(datatable);
    }
    findAll(): Promise<DataTable[]> {
        return new Promise(function (resolve, reject) {
            doRequest({
                url: `https://${enterprise}.shujuguan.cn/openapi/data`,
                method: "GET",
                headers: {
                    "Authorization": `OAuth ${token}`,
                    "Content-Type": "application/json; charset=utf-8"
                }
            }, resolve, reject);
        });
    }
    create(data: DataTable): Promise<DataTableAPI> {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (self._datatable) {
                return resolve(self._datatable);
            }
            doRequest({
                url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/createdatatable`,
                method: "POST",
                headers: {
                    "Authorization": `OAuth ${token}`,
                    "Content-Type": "application/json; charset=utf-8"
                },
                json: true,
                body: {
                    "batchDataColumns": convertColumnToCreat(data.columns),
                    "dataName": data.name
                }
            }, function (result: DataTable) {
                self._datatable = result;
                resolve(self);
            }, reject);
        });
    }
    append(data: RowData[]): Promise<DataTableAPI> {

    }
    commit(): Promise<DataTableAPI> {

    }
}

class ShujuguanClient {
    datatables(): Promise<DataTable[]> {
        return new Promise(function (resolve, reject) {
            doRequest({
                url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/createdatatable`,
                method: "POST",
                headers: {
                    "Authorization": `OAuth ${token}`,
                    "Content-Type": "application/json; charset=utf-8"
                },
                json: true,
                body: {
                    "batchDataColumns": [
                        {
                            "dataType": "STRING",
                            "length": -1,
                            "name": "a",
                            "type": "TEXT"
                        },
                        {
                            "dataType": "INTEGER",
                            "length": -1,
                            "name": "b",
                            "type": "INTEGER"
                        },
                        {
                            "dataType": "DATE",
                            "length": -1,
                            "name": "c",
                            "type": "DATE"
                        },
                        {
                            "dataType": "DOUBLE",
                            "length": -1,
                            "name": "d",
                            "type": "DECIMAL"
                        }
                    ],
                    "dataName": "数据集api创建"
                }
            }, resolve, reject);
        });
    }
}

export function create(): ShujuguanClient {
    return new ShujuguanClient();
}