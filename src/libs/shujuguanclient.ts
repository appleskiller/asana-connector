import * as Promise from 'bluebird';
import * as request from 'request';
import * as _ from "lodash";
import * as Logger from "./logger";

var log = Logger.getLogger("shujuguanclient");
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
                log.log("parse json error!" , payload);
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
    // attrs?: {[key: string]: any};
    dataConfig?:{
        attrs: any
    }
}

const DATATABLEAPI_VERSION: number = 1.0;
const DATATABLEAPI_LANGUAGE: string = "node";

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
    // batchCreate(data: DataTable): Promise<DataTable> {
    //     var self = this;
    //     // 流式数据接口
    //     return doRequest({
    //         url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/createdatatable`,
    //         method: "POST",
    //         headers: {
    //             "Authorization": `OAuth ${token}`,
    //             "Content-Type": "application/json; charset=utf-8"
    //         },
    //         json: true,
    //         body: {
    //             "batchDataColumns": convertColumnToCreat(data.columns),
    //             "dataName": data.name
    //         }
    //     });
    // }
    
    // batchUpdate(dtid: string , columns: Column[] , append: boolean = false): Promise<DataTable> {
    //     var self = this;
    //     return doRequest({
    //         url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/${dtid}/updatedatatable`,
    //         method: "POST",
    //         headers: {
    //             "Authorization": `OAuth ${token}`,
    //             "Content-Type": "application/json; charset=utf-8"
    //         },
    //         json: true,
    //         body: {
    //             append: append,
    //             batchDataColumns: columns
    //         }
    //     });
    // }
    // batchAppend(dtid: string , data: any[]): Promise<DataTableAPI> {
    //     var self = this;
    //     return doRequest({
    //         url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/${dtid}/appenddatas`,
    //         method: "POST",
    //         headers: {
    //             "Authorization": `OAuth ${token}`,
    //             "Content-Type": "application/json; charset=utf-8"
    //         },
    //         json: true,
    //         body: data
    //     });
    // }
    // batchCommit(dtid: string): Promise<DataTable> {
    //     var self = this;
    //     return doRequest({
    //         url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/${dtid}/commit`,
    //         method: "GET",
    //         headers: {
    //             "Authorization": `OAuth ${token}`,
    //             "Content-Type": "application/json; charset=utf-8"
    //         }
    //     });
    // }
    protected _getColumnPropForCreate(key: string): string {
        return _propMap[key] ? _propMap[key] : key;
    }
    protected _attachDataConfigAttrs(data: DataTable): any {
        var attrs = (data && data.dataConfig && data.dataConfig.attrs) ? data.dataConfig.attrs : {};
        var result = {};
        for (var key in attrs) {
            result[key] = attrs[key];
            result["_api_version_"] = DATATABLEAPI_VERSION;
            result["_api_language_"] = DATATABLEAPI_LANGUAGE;
        }
        return result;
    }
    protected _convertTableToUpdate(datatable: DataTable , rowdata: any[][]): DataTable {
        var result = <any>{};
        for (var key in datatable) {
            result[key] = datatable[key];
        }
        result.rows = [];
        var row;
        for (var i = 0; i < rowdata.length; i++) {
            var element = rowdata[i];
            row = {cells: []};
            for (var j = 0; j < element.length; j++) {
                row.cells.push({value: element[j]});
            }
            result.rows.push(row);
        }
        return result;
    }
    protected _convertColumnToCreat (columns: Column[]): any[] {
        var results = [] , obj: any , self = this;
        _.each(columns , function (column: Column) {
            obj = {};
            for (var key in column) {
                obj[self._getColumnPropForCreate(key)] = column[key];
            }
            results.push(obj);
        })
        return results;
    }
    create(data: DataTable): Promise<DataTable> {
        var self = this;
        return doRequest({
            url: `https://${enterprise}.shujuguan.cn/openapi/data/create`,
            method: "POST",
            headers: {
                "Authorization": `OAuth ${token}`,
                "Content-Type": "application/json; charset=utf-8"
            },
            json: true,
            body: {
                attrs: this._attachDataConfigAttrs(data),
                "dataConnectorTable": {
                    "columns": this._convertColumnToCreat(data.columns),
                    "name": data.name
                },
            }
        });
    }
    update(data: DataTable , rowdata: any[][], append: boolean = false) {
        var self = this;
        return doRequest({
            url: `https://${enterprise}.shujuguan.cn/openapi/data/update?dataId=${data.id}`,
            method: "POST",
            headers: {
                "Authorization": `OAuth ${token}`,
                "Content-Type": "application/json; charset=utf-8"
            },
            json: true,
            body: {
                append: append ,
                attrs: this._attachDataConfigAttrs(data),
                "dataConnectorTable": this._convertTableToUpdate(data , rowdata)
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