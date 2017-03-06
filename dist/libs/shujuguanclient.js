"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var token = "93eb24546cf93796cfbcfc6aa330e1d5";
var Promise = require("bluebird");
var request = require("request");
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
var ShujuguanClient = (function () {
    function ShujuguanClient(token) {
        this._token = token;
    }
    ShujuguanClient.prototype.datatables = function () {
        var token = this._token;
        return new Promise(function (resolve, reject) {
            doRequest({
                url: "http://qiye.shujuguan.cn/openapi/data/create",
                method: "POST",
                headers: {
                    "Authorization": "OAuth " + token,
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
    };
    return ShujuguanClient;
}());
function create() {
    return new ShujuguanClient(token);
}
exports.create = create;
//# sourceMappingURL=shujuguanclient.js.map