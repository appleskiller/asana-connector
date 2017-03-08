"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var request = require("request");
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
        }
        catch (err) {
            return reject(new Error("parse json error!"));
        }
        if (result.error) {
            return reject(new Error(result.error_description));
        }
        else {
            return resolve(result);
        }
    });
}
function convertColumnToCreat(columns) {
    return [];
}
var DataTableAPI = (function () {
    function DataTableAPI(datatable) {
        datatable && (this._datatable = datatable);
    }
    DataTableAPI.prototype.me = function () {
        return this._datatable;
    };
    DataTableAPI.prototype.instance = function (datatable) {
        return new DataTableAPI(datatable);
    };
    DataTableAPI.prototype.findAll = function () {
        return new Promise(function (resolve, reject) {
            doRequest({
                url: "https://" + enterprise + ".shujuguan.cn/openapi/data",
                method: "GET",
                headers: {
                    "Authorization": "OAuth " + token,
                    "Content-Type": "application/json; charset=utf-8"
                }
            }, resolve, reject);
        });
    };
    DataTableAPI.prototype.create = function (data) {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (self._datatable) {
                return resolve(self._datatable);
            }
            doRequest({
                url: "https://" + enterprise + ".shujuguan.cn/openapi/dtbatch/createdatatable",
                method: "POST",
                headers: {
                    "Authorization": "OAuth " + token,
                    "Content-Type": "application/json; charset=utf-8"
                },
                json: true,
                body: {
                    "batchDataColumns": convertColumnToCreat(data.columns),
                    "dataName": data.name
                }
            }, function (result) {
                self._datatable = result;
                resolve(self);
            }, reject);
        });
    };
    DataTableAPI.prototype.append = function (data) {
    };
    DataTableAPI.prototype.commit = function () {
    };
    return DataTableAPI;
}());
var ShujuguanClient = (function () {
    function ShujuguanClient() {
    }
    ShujuguanClient.prototype.datatables = function () {
        return new Promise(function (resolve, reject) {
            doRequest({
                url: "https://" + enterprise + ".shujuguan.cn/openapi/dtbatch/createdatatable",
                method: "POST",
                headers: {
                    "Authorization": "OAuth " + token,
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
    };
    return ShujuguanClient;
}());
function create() {
    return new ShujuguanClient();
}
exports.create = create;
//# sourceMappingURL=shujuguanclient.js.map