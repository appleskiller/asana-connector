import * as Asana from "asana";
import * as Promise from 'bluebird';

var clientId = "286003177885547";
var clientSecret = "dc29a7d89aeb8dd631fc2c94e5de8aa6";
var port = process.env['PORT'] || 18081;

export type  Resource = Asana.resources.Resource;
export type  Workspaces = Asana.resources.Workspaces.Type;
export type  Projects = Asana.resources.Projects.Type;
export type  Stories = Asana.resources.Stories.Type;
export type  Teams = Asana.resources.Teams.Type;
export type  Users = Asana.resources.Users.Type;
export type  Tasks = Asana.resources.Tasks.Type;
export type  Tags = Asana.resources.Tags.Type;

export type  ResourceList<Resource> = Asana.resources.ResourceList<Asana.resources.Resource>;

class AsanaClient {
    private _token: string;
    private _nativeClient: Asana.Client;
    constructor(credentials?: Asana.auth.Credentials|string) {
        var client = Asana.Client.create({
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: 'https://localhost:' + port + '/asana/oauth_callback'
        });
        credentials && client.useOauth({ credentials: credentials });
        this._nativeClient = client;
    }
    nativeClient(): Asana.Client {
        return this._nativeClient;
    }
    workspaces(): Promise<ResourceList<Workspaces>> {
        return this._nativeClient.workspaces.findAll();
    }
    projects(workspaceid: number): Promise<ResourceList<Projects>> {
        // TODO
        return this._nativeClient.projects.findByWorkspace(workspaceid);
    }
}

// Create an Asana client. Do this per request since it keeps state that
// shouldn't be shared across requests.
export function create(credentials?: Asana.auth.Credentials|string): AsanaClient {
    return new AsanaClient(credentials);
}