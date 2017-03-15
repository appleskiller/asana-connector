import * as express from "express";
import * as Asana from "asana";
import * as asanaclient from "../libs/asanaclient";
import * as Logger from "../libs/logger";
import * as cache from "../libs/cache";

var storage = cache.createInstance("asana");
var log = Logger.getLogger("asana_connector");
var router = express.Router();

router.get("/currentuser" , function (req , res) {
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        res.charset = 'utf-8';
        res.send({
            connected: true ,
            user: asanauser.user
        })
    } else {
        res.send({
            connected: false
        })
    }
})
// Home page - shows user name if authenticated, otherwise seeks authorization.
router.get('/connect', function (req, res) {
    var client = asanaclient.create().nativeClient();
    // If token is in the cookie, use it to show info.
    var asanauser = storage.get("asanauser");
    if (asanauser) {
        res.send(`<script>window.close()</script>`);
    } else {
        log.log("connect to asana oauth ...")
        // Otherwise redirect to authorization.
        res.redirect(client.app.asanaAuthorizeUrl());
    }
});
router.get("/disconnect" , function (req , res) {
    log.log("disconnect from asana oauth ...");
    storage.del("asanauser");
    // TODO disconnect from asana;
    res.end();
});
// Authorization callback - redirected to from Asana.
router.get('/oauth_callback', function (req, res) {
    var client = asanaclient.create().nativeClient();
    var code = req.query.code;
    if (code) {
        log.log("asana callback with code")
        // If we got a code back, then authorization succeeded.
        // Get token. Store it in the cookie and redirect home.
        client.app.accessTokenFromCode(code).then(function (credentials) {
            log.log("asana connected.");
            // Here's where we direct the client to use Oauth with the credentials
            // we have acquired.
            client.useOauth({ credentials: credentials.access_token });
            client.users.me().then(function (me) {
                storage.set("asanauser" , {
                    user: me ,
                    token: credentials
                });
                res.send(`<script>window.close()</script>`);
            }).catch(function (err) {
                res.charset = 'utf-8';
                let content = `Error fetching user , <a href="/asana/connect">reconnect</a>. <div><a onclick="alert('${JSON.stringify(err)}')">What's happen?</a></div>`;
                res.send(content);
            });
        });
    } else {
        // Authorization could have failed. Show an error.
        log.log("asana callback without code! Error getting authorization: " , req.query.error);
        res.charset = 'utf-8';
        let content = `Error getting authorization , <a href="/asana/connect">reconnect</a>. <div><a href="javascript:void(0)" onclick="alert('${req.query.error}')">What's happen?</a></div>`;
        res.send(content);
    }
});

export = router;