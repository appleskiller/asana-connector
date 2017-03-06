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

var LIMIT = 100;

function fetchList(dispatcher:any , params?: any , list?: Resource[]) {
    list = list || [];
    params = params || {};
    params.limit = params.limit || LIMIT;
    return new Promise(function (resolve , reject) {
        dispatcher.findAll(params).then(function (result: ResourceList<Workspaces>) {
            list = list.concat(result.data || []);
            if (result["next_page"] && result["next_page"]["offset"]) {
                params.offset = result["next_page"]["offset"];
                fetchList(dispatcher , params , list).then(function (result: ResourceList<Workspaces>) {
                    resolve(list);
                } , function (err) {
                    reject(err);
                });
            } else {
                resolve(list);
            }
        } , function (err) {
            reject(err);
        })
    })
}

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
    workspaces(): Promise<Workspaces[]> {
        return fetchList(this._nativeClient.workspaces);
    }
    metadatas(metaType: string , workspaces: Workspaces[]): Promise<Resource[]> {
        var client = this._nativeClient;
        return new Promise(function (resolve , reject) {
            if (!client[metaType]) {
                return reject(new Error(`metaType invalid : ${metaType}`))
            } else {
                var promises = [] , projects = [];
                for (var i: number = 0; i < workspaces.length; i++) {
                    promises.push(fetchList(client[metaType] , {workspace: workspaces[i]}).then(function (result) {
                        projects = projects.concat(result);
                    }));
                }
                Promise.all(promises).then(function () {
                    resolve(projects);
                } , reject);
            }
        });
    }
}

// Create an Asana client. Do this per request since it keeps state that
// shouldn't be shared across requests.
export function create(credentials?: Asana.auth.Credentials|string): AsanaClient {
    return new AsanaClient(credentials);
}