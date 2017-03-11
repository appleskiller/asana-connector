"use strict";
var Promise = require('bluebird');
var request = require('request');
var _ = require("lodash");
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
            var result = (typeof payload === "string") ? JSON.parse(payload) : payload;
        }
        catch (err) {
            console.log("parse json error!", payload);
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
var _propMap = {
    "columnType": "type",
};
function _getColumnPropForCreate(key) {
    return _propMap[key] ? _propMap[key] : key;
}
function convertColumnToCreat(columns) {
    var results = [], obj;
    _.each(columns, function (column) {
        obj = {};
        for (var key in column) {
            obj[_getColumnPropForCreate(key)] = column[key];
        }
        results.push(obj);
    });
    return results;
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
    DataTableAPI.prototype.findById = function (dtid) {
        return new Promise(function (resolve, reject) {
            doRequest({
                url: "https://" + enterprise + ".shujuguan.cn/openapi/data/" + dtid,
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
        var self = this;
        return new Promise(function (resolve, reject) {
            if (!self._datatable) {
                reject();
            }
            else {
                doRequest({
                    url: "https://" + enterprise + ".shujuguan.cn/openapi/dtbatch/" + self._datatable.id + "/appenddatas",
                    method: "POST",
                    headers: {
                        "Authorization": "OAuth " + token,
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    json: true,
                    body: data
                }, resolve, reject);
            }
        });
    };
    DataTableAPI.prototype.commit = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (!self._datatable) {
                reject();
            }
            else {
                doRequest({
                    url: "https://" + enterprise + ".shujuguan.cn/openapi/dtbatch/" + self._datatable.id + "/commit",
                    method: "GET",
                    headers: {
                        "Authorization": "OAuth " + token,
                        "Content-Type": "application/json; charset=utf-8"
                    }
                }, resolve, reject);
            }
        });
    };
    return DataTableAPI;
}());
var ShujuguanClient = (function () {
    function ShujuguanClient() {
        this.datatables = new DataTableAPI();
    }
    return ShujuguanClient;
}());
exports.ShujuguanClient = ShujuguanClient;
function create() {
    return new ShujuguanClient();
}
exports.create = create;
//# sourceMappingURL=shujuguanclient.js.map