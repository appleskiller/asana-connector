"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var fs = require("fs");
var http = require("http");
var https = require("https");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var oathRouter = require("./routers/oauth");
var resourceRouter = require("./routers/resource");
var app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});
app.use('/asana', oathRouter);
app.use('/asana/resource', resourceRouter);
var privateKey = fs.readFileSync("../pem/server-key.pem", "utf-8");
var certificate = fs.readFileSync("../pem/server-cert.pem", "utf-8");
var credentials = {
    key: privateKey,
    cert: certificate
};
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