"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var request = require("request");
var _ = require("lodash");
var config = require("../../config/server.json");
var token = config.shujuguan.token;
var enterprise = config.shujuguan.enterprise;
function doRequest(params) {
    return new Promise(function (resolve, reject) {
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
    function DataTableAPI() {
    }
    DataTableAPI.prototype.findAll = function () {
        return doRequest({
            url: "https://" + enterprise + ".shujuguan.cn/openapi/data",
            method: "GET",
            headers: {
                "Authorization": "OAuth " + token,
                "Content-Type": "application/json; charset=utf-8"
            }
        });
    };
    DataTableAPI.prototype.findById = function (dtid) {
        return doRequest({
            url: "https://" + enterprise + ".shujuguan.cn/openapi/data/" + dtid,
            method: "GET",
            headers: {
                "Authorization": "OAuth " + token,
                "Content-Type": "application/json; charset=utf-8"
            }
        });
    };
    DataTableAPI.prototype.create = function (data) {
        var self = this;
        return doRequest({
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
        });
    };
    DataTableAPI.prototype.update = function (dtid, columns, append) {
        if (append === void 0) { append = false; }
        var self = this;
        return doRequest({
            url: "https://" + enterprise + ".shujuguan.cn/openapi/dtbatch/" + dtid + "/updatedatatable",
            method: "POST",
            headers: {
                "Authorization": "OAuth " + token,
                "Content-Type": "application/json; charset=utf-8"
            },
            json: true,
            body: {
                append: append,
                batchDataColumns: columns
            }
        });
    };
    DataTableAPI.prototype.append = function (dtid, data) {
        var self = this;
        return doRequest({
            url: "https://" + enterprise + ".shujuguan.cn/openapi/dtbatch/" + dtid + "/appenddatas",
            method: "POST",
            headers: {
                "Authorization": "OAuth " + token,
                "Content-Type": "application/json; charset=utf-8"
            },
            json: true,
            body: data
        });
    };
    DataTableAPI.prototype.commit = function (dtid) {
        var self = this;
        return doRequest({
            url: "https://" + enterprise + ".shujuguan.cn/openapi/dtbatch/" + dtid + "/commit",
            method: "GET",
            headers: {
                "Authorization": "OAuth " + token,
                "Content-Type": "application/json; charset=utf-8"
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