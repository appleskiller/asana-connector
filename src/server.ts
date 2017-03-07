import * as express from "express";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as cookieParser from "cookie-parser";
import * as bodyParser from "body-parser";
import * as session from "express-session";

import * as oathRouter from "./routers/oauth";
import * as resourceRouter from "./routers/resource";

var config = require("../config/server.json");

var app = express();

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}))
// 允许跨域
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials','true');
    next();
});
app.use('/asana', oathRouter);
app.use('/asana/resource', resourceRouter);

var privateKey = fs.readFileSync("../pem/server-key.pem", "utf-8");
var certificate = fs.readFileSync("../pem/server-cert.pem", "utf-8");

var credentials = {
    key: privateKey,
    cert: certificate
}
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

// Welcome
app.get('/', function (req: express.Request, res: express.Response) {
    if (req.protocol === 'https') {
        res.status(200).send('Welcome to Safety Land!');
    } else {
        res.status(200).send('Welcome!');
    }
});

var PORT = config.env.PORT;
var SSLPORT = config.env.SSLPORT;
httpServer.listen(PORT, function () {
    console.log('HTTP Server is running on: http://localhost:%s', PORT);
});
httpsServer.listen(SSLPORT, function () {
    console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT);
});