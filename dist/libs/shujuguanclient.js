"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var request = require("request");
var _ = require("lodash");
var Logger = require("./logger");
var log = Logger.getLogger("shujuguanclient");
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
                log.log("parse json error!", payload);
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
var DATATABLEAPI_VERSION = 1.0;
var DATATABLEAPI_LANGUAGE = "node";
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
    DataTableAPI.prototype._getColumnPropForCreate = function (key) {
        return _propMap[key] ? _propMap[key] : key;
    };
    DataTableAPI.prototype._attachDataConfigAttrs = function (data) {
        var attrs = (data && data.dataConfig && data.dataConfig.attrs) ? data.dataConfig.attrs : {};
        var result = {};
        for (var key in attrs) {
            result[key] = attrs[key];
            result["_api_version_"] = DATATABLEAPI_VERSION;
            result["_api_language_"] = DATATABLEAPI_LANGUAGE;
        }
        return result;
    };
    DataTableAPI.prototype._convertTableToUpdate = function (datatable, rowdata) {
        var result = {};
        for (var key in datatable) {
            result[key] = datatable[key];
        }
        result.rows = [];
        var row;
        for (var i = 0; i < rowdata.length; i++) {
            var element = rowdata[i];
            row = { cells: [] };
            for (var j = 0; j < element.length; j++) {
                row.cells.push({ value: element[j] });
            }
            result.rows.push(row);
        }
        return result;
    };
    DataTableAPI.prototype._convertColumnToCreat = function (columns) {
        var results = [], obj, self = this;
        _.each(columns, function (column) {
            obj = {};
            for (var key in column) {
                obj[self._getColumnPropForCreate(key)] = column[key];
            }
            results.push(obj);
        });
        return results;
    };
    DataTableAPI.prototype.create = function (data) {
        var self = this;
        return doRequest({
            url: "https://" + enterprise + ".shujuguan.cn/openapi/data/create",
            method: "POST",
            headers: {
                "Authorization": "OAuth " + token,
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
    };
    DataTableAPI.prototype.update = function (data, rowdata, append) {
        if (append === void 0) { append = false; }
        var self = this;
        return doRequest({
            url: "https://" + enterprise + ".shujuguan.cn/openapi/data/update?dataId=" + data.id,
            method: "POST",
            headers: {
                "Authorization": "OAuth " + token,
                "Content-Type": "application/json; charset=utf-8"
            },
            json: true,
            body: {
                append: append,
                attrs: this._attachDataConfigAttrs(data),
                "dataConnectorTable": this._convertTableToUpdate(data, rowdata)
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