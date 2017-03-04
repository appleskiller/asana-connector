"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var fs = require("fs");
var http = require("http");
var https = require("https");
var cookieParser = require("cookie-parser");
var oathRouter = require("./routers/oauth");
var app = express();
var privateKey = fs.readFileSync("../pem/server-key.pem", "utf-8");
var certificate = fs.readFileSync("../pem/server-cert.pem", "utf-8");
var credentials = {
    key: privateKey,
    cert: certificate
};
app.use(cookieParser());
app.use('/', oathRouter);
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
app.get('/', function (req, res) {
    if (req.protocol === 'https') {
        res.status(200).send('Welcome to Safety Land!');
    }
    else {
        res.status(200).send('Welcome!');
    }
});
var PORT = 18080;
var SSLPORT = 18081;
httpServer.listen(PORT, function () {
    console.log('HTTP Server is running on: http://localhost:%s', PORT);
});
httpsServer.listen(SSLPORT, function () {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});
//# sourceMappingURL=server.js.map