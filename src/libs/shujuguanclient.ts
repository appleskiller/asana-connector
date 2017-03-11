import * as Promise from 'bluebird';
import * as request from 'request';
import * as _ from "lodash";

var config = require("../../config/server.json");
var token = config.shujuguan.token;
var enterprise = config.shujuguan.enterprise;

function doRequest(params) {
    return new Promise(function (resolve , reject) {
        request(params, function (err, res, payload) {
            if (err) {
                return reject(err);
            }
            if (res.statusCode !== 200) {
                return reject(payload);
            }
            try {
                var result = (typeof payload === "string") ? JSON.parse(payload) : payload;
            } catch (err) {
                console.log("parse json error!" , payload);
                return reject(new Error("parse json error!"))
            }
            if (result.error) {
                return reject(new Error(result.error_description));
            } else {
                return resolve(result);
            }
        });
    })
}

var _propMap = {
    "columnType": "type",
}

function _getColumnPropForCreate(key: string): string {
    return _propMap[key] ? _propMap[key] : key;
}

function convertColumnToCreat (columns: Column[]): any[] {
    var results = [] , obj: any;
    _.each(columns , function (column: Column) {
        obj = {};
        for (var key in column) {
            obj[_getColumnPropForCreate(key)] = column[key];
        }
        results.push(obj);
    })
    return results;
}

export type Column = {
    columnType: string;
    dataType: string;
    name: string;
    length?: number;
}
export type DataTable = {
    columns: Column[];
    name: string;
    id?: string;
}

class DataTableAPI {
    findAll(): Promise<DataTable[]> {
        return doRequest({
            url: `https://${enterprise}.shujuguan.cn/openapi/data`,
            method: "GET",
            headers: {
                "Authorization": `OAuth ${token}`,
                "Content-Type": "application/json; charset=utf-8"
            }
        })
    }
    findById(dtid: string): Promise<DataTable> {
        return doRequest({
            url: `https://${enterprise}.shujuguan.cn/openapi/data/${dtid}`,
            method: "GET",
            headers: {
                "Authorization": `OAuth ${token}`,
                "Content-Type": "application/json; charset=utf-8"
            }
        });
    }
    create(data: DataTable): Promise<DataTable> {
        var self = this;
        return doRequest({
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
        });
    }
    update(dtid: string , columns: Column[] , append: boolean = false): Promise<DataTable> {
        var self = this;
        return doRequest({
            url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/${dtid}/updatedatatable`,
            method: "POST",
            headers: {
                "Authorization": `OAuth ${token}`,
                "Content-Type": "application/json; charset=utf-8"
            },
            json: true,
            body: {
                append: append,
                batchDataColumns: columns
            }
        });
    }
    append(dtid: string , data: any[]): Promise<DataTableAPI> {
        var self = this;
        return doRequest({
            url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/${dtid}/appenddatas`,
            method: "POST",
            headers: {
                "Authorization": `OAuth ${token}`,
                "Content-Type": "application/json; charset=utf-8"
            },
            json: true,
            body: data
        });
    }
    commit(dtid: string): Promise<DataTable> {
        var self = this;
        return doRequest({
            url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/${dtid}/commit`,
            method: "GET",
            headers: {
                "Authorization": `OAuth ${token}`,
                "Content-Type": "application/json; charset=utf-8"
            }
        });
    }
}

export class ShujuguanClient {
    datatables: DataTableAPI;
    constructor(){
        this.datatables = new DataTableAPI();
    }
}

export function create(): ShujuguanClient {
    return new ShujuguanClient();
}