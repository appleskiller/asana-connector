"use strict";
var express = require("express");
var fs = require("fs");
var http = require("http");
var https = require("https");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var oathRouter = require("./routers/oauth");
var resourceRouter = require("./routers/resource");
var Logger = require("./libs/logger");
var log = Logger.getLogger("system");
var config = require("../config/server.json");
var app = express();
app.use(express.static('example'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));
app.use('/asana/resource', resourceRouter);
app.use('/asana', oathRouter);
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
var PORT = config.env.PORT;
var SSLPORT = config.env.SSLPORT;
httpServer.listen(PORT, function () {
    log.log("HTTP Server is running on: http://localhost:" + PORT);
});
httpsServer.listen(SSLPORT, function () {
    log.log("HTTPS Server is running on: https://localhost:" + SSLPORT);
});
//# sourceMappingURL=server.js.map