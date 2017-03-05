"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Asana = require("asana");
var clientId = "286003177885547";
var clientSecret = "dc29a7d89aeb8dd631fc2c94e5de8aa6";
var port = process.env['PORT'] || 18081;
var AsanaClient = (function () {
    function AsanaClient(credentials) {
        var client = Asana.Client.create({
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: 'https://localhost:' + port + '/asana/oauth_callback'
        });
        credentials && client.useOauth({ credentials: credentials });
        this._nativeClient = client;
    }
    AsanaClient.prototype.nativeClient = function () {
        return this._nativeClient;
    };
    AsanaClient.prototype.workspaces = function () {
        return this._nativeClient.workspaces.findAll();
    };
    AsanaClient.prototype.projects = function (workspaceid) {
        return this._nativeClient.projects.findByWorkspace(workspaceid);
    };
    return AsanaClient;
}());
function create(credentials) {
    return new AsanaClient(credentials);
}
exports.create = create;
//# sourceMappingURL=asanaclient.js.map