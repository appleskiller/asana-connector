import * as Asana from "asana";
import * as Promise from 'bluebird';

var clientId = "286003177885547";
var clientSecret = "dc29a7d89aeb8dd631fc2c94e5de8aa6";
var port = process.env['PORT'] || 18081;

// Create an Asana client. Do this per request since it keeps state that
// shouldn't be shared across requests.
export function create(credentials?: Asana.auth.Credentials|string): Asana.Client {
    var client = Asana.Client.create({
        clientId: clientId,
        clientSecret: clientSecret,
        redirectUri: 'https://localhost:' + port + '/asana/oauth_callback'
    });
    credentials && client.useOauth({ credentials: credentials });
    return client;
}

// If we got a code back, then authorization succeeded.
// Get token. Store it in the cookie and redirect home.
export function accessToken(code: string):Promise<Credentials> {
    var client = create();
    return client.app.accessTokenFromCode(code);
}