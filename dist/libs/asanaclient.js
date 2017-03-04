"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Asana = require("asana");
var clientId = "286003177885547";
var clientSecret = "dc29a7d89aeb8dd631fc2c94e5de8aa6";
var port = process.env['PORT'] || 18081;
function create(credentials) {
    var client = Asana.Client.create({
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: 'https://localhost:' + port + '/asana/oauth_callback'
    });
    credentials && client.useOauth({ credentials: credentials });
    return client;
}
exports.create = create;
function accessToken(code) {
    var client = create();
    return client.app.accessTokenFromCode(code);
}
exports.accessToken = accessToken;
//# sourceMappingURL=asanaclient.js.map