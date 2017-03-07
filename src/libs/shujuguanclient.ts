import * as Promise from 'bluebird';
import * as request from 'request';

var config = require("../../config/server.json");
var token = config.shujuguan.token;
var enterprise = config.shujuguan.enterprise;

export type DataTable = {

}

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

class ShujuguanClient {
    private _token: string;
    constructor(token: string) {
        this._token = token;
    }
    datatables(): Promise<DataTable[]> {
        var token = this._token;
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
                    "attrs": {
                        "path": "dVSXWG"
                    },
                    "dataConnectorTable": {
                        "columns": [
                            {
                                "dataType": "Integer",
                                "name": "序号",
                                "type": "ID"
                            },
                            {
                                "dataType": "STRING",
                                "name": "浏览器",
                                "type": "TEXT"
                            }
                        ],
                        "name": "通讯录"
                    }
                }
            }, resolve, reject);
        });
    }
}

export function create(): ShujuguanClient {
    return new ShujuguanClient(token);
}