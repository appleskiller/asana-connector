import * as express from "express";
import * as Asana from "asana";
import * as asanaclient from "../libs/asanaclient";

var router = express.Router();

var clientId = process.env['ASANA_CLIENT_ID'];
var clientSecret = process.env['ASANA_CLIENT_SECRET'];
var port = process.env['PORT'] || 18081;

// Home page - shows user name if authenticated, otherwise seeks authorization.
router.get('/', function (req, res) {
    var client = asanaclient.create();
    // If token is in the cookie, use it to show info.
    var token = req.cookies.token;
    if (token) {

        // Here's where we direct the client to use Oauth with the credentials
        // we have acquired.
        client.useOauth({ credentials: token });
        client.users.me().then(function (me) {
            res.end('Hello ' + me.name);
        }).catch(function (err) {
            res.end('Error fetching user: ' + err);
        });
    } else {
        // Otherwise redirect to authorization.
        res.redirect(client.app.asanaAuthorizeUrl());
    }

});

// Authorization callback - redirected to from Asana.
router.get('/oauth_callback', function (req, res) {
    var code = req.param('code');
    if (code) {
        // If we got a code back, then authorization succeeded.
        // Get token. Store it in the cookie and redirect home.
        var client = asanaclient.create();
        client.app.accessTokenFromCode(code).then(function (credentials) {
            // The credentials contain the refresh token as well. If you use it, keep
            // it safe on the server! Here we just use the access token, and store it
            // in the cookie for an hour.
            // Generally, if stored in a cookie it should be secure- and http-only
            // to prevent it from being stolen.
            res.cookie('token', credentials.access_token, { maxAge: 60 * 60 * 1000 });
            // Redirect back home, where we should now have access to Asana data.
            res.redirect('/asana');
        });
    } else {
        // Authorization could have failed. Show an error.
        res.end('Error getting authorization: ' + req.param('error'));
    }
});

export = router;