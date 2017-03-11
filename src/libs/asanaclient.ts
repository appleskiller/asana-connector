import * as Asana from "asana";
import * as Promise from 'bluebird';
import * as progress from "./progress";

var config = require("../../config/server.json");
var clientId = config.asana.clientId;
var clientSecret = config.asana.clientSecret;
var redirectUri = config.asana.redirectUri;
var port = process.env['PORT'] || 18081;

type CustomFieldSetting = {
    custom_field: {
        id: number;
        name: string;
        type: string;
    }
}
interface ITasks extends Asana.resources.Tasks.Type {
    subtasks?: ITasks[];
    custom_fields?: {
        id: number;
        name: string;
        type: string;
    }[]
}
interface IProjects extends Asana.resources.Projects.Type {
    tasks?: ITasks[];
    custom_field_settings?: CustomFieldSetting[];
}

export type Resource = Asana.resources.Resource;
export type Workspaces = Asana.resources.Workspaces.Type;
export type Projects = IProjects;
export type Stories = Asana.resources.Stories.Type;
export type Teams = Asana.resources.Teams.Type;
export type Users = Asana.resources.Users.Type;
export type Tasks = ITasks;
export type Tags = Asana.resources.Tags.Type;

export type ResourceList<Resource> = Asana.resources.ResourceList<Asana.resources.Resource>;

var LIMIT = 100;

type ListResult = {
    list: Resource[]
}

function fetchList(dispatcher: any, params?: any, finalResult?: ListResult): Promise<Resource[]> {
    finalResult = finalResult || { list: [] };
    params = params || {};
    params.limit = params.limit || LIMIT;
    return new Promise(function (resolve, reject) {
        dispatcher.findAll(params).then(function (result: ResourceList<Workspaces>) {
            finalResult.list = finalResult.list.concat(result.data || []);
            if (result._response && result._response.next_page && result._response.next_page.offset) {
                params.offset = result._response.next_page.offset;
                fetchList(dispatcher, params, finalResult).then(function () {
                    resolve(finalResult.list);
                }, function (err) {
                    reject(err);
                });
            } else {
                resolve(finalResult.list);
            }
        }, function (err) {
            reject(err);
        })
    })
}

function fetchListById(dispatcher: any, method: string, id: number, params?: any, finalResult?: ListResult): Promise<Resource[]> {
    finalResult = finalResult || { list: [] };
    params = params || {};
    params.limit = params.limit || LIMIT;
    return new Promise(function (resolve, reject) {
        dispatcher[method](id, params).then(function (result: ResourceList<Workspaces>) {
            finalResult.list = finalResult.list.concat(result.data || []);
            if (result._response && result._response.next_page && result._response.next_page.offset) {
                params.offset = result._response.next_page.offset;
                fetchListById(dispatcher, method, id, params, finalResult).then(function () {
                    resolve(finalResult.list);
                }, function (err) {
                    reject(err);
                });
            } else {
                resolve(finalResult.list);
            }
        }, function (err) {
            reject(err);
        })
    })
}

export class AsanaClient {
    private _token: string;
    private _nativeClient: Asana.Client;
    constructor(credentials?: Asana.auth.Credentials | string) {
        var client = Asana.Client.create({
            clientId: clientId,
            clientSecret: clientSecret,
            redirectUri: redirectUri
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
    metadatas(metaType: string, workspaces: Workspaces[]): Promise<Resource[]> {
        var client = this._nativeClient;
        return new Promise(function (resolve, reject) {
            if (!client[metaType]) {
                return reject(new Error(`metaType invalid : ${metaType}`))
            } else {
                var token = progress.create(workspaces.length, {
                    method: 'asanaclient.metadatas',
                    type: metaType,
                    name: 'asanaclient.metadatas.' + metaType
                });
                var metas = [];
                Promise.map(workspaces, function (id: string, index: number, length: number) {
                    return fetchList(client[metaType], { workspace: workspaces[index].id }).then(function (results: Resource[]) {
                        token.loaded++;
                        token.current = workspaces[index].name;
                        metas = metas.concat(results);
                    }).catch(function ignore(err) {
                        console.log("metadatas - ignore error: " , err);
                        token.loaded++;
                        token.error++;
                    })
                }, {
                    concurrency: 1
                }).then(function () {
                    progress.end(token.id);
                    resolve(metas);
                }).catch(function (err) {
                    progress.end(token.id);
                    return Promise.reject(err);
                });
            }
        });
    }
    entities(resType: string, ids: number[]): Promise<Resource[]> {
        var client = this._nativeClient;
        return new Promise(function (resolve, reject) {
            if (!client[resType]) {
                return reject(new Error(`resType invalid : ${resType}`));
            } else {
                var promises = [];
                for (var i: number = 0; i < ids.length; i++) {
                    promises.push(client[resType].findById(ids[i]));
                }
                Promise.all(promises).then(function (entities: Resource[]) {
                    resolve(entities);
                }, reject);
            }
        })
    }
    progressEntities(resType: string, ids: number[], processor: (Resource) => Promise<any>): Promise<Resource[]> {
        var dispatcher = this._nativeClient[resType];
        var token = progress.create(ids.length, {
            method: 'asanaclient.progressEntities',
            type: resType,
            name: 'asanaclient.progressEntities'
        });
        return new Promise(function (resolve, reject) {
            Promise.map(ids, function (id: string, index: number, length: number) {
                return dispatcher.findById(id).then(function (res: Resource) {
                    token.loaded++;
                    token.current = res.name;
                    return processor(res);
                }).catch(function ignore(err) {
                    console.log("progressEntities - ignore error:" , err);
                    token.loaded++;
                    token.error++;
                })
            }, {
                concurrency: 10
            }).then(function (results: Resource[]) {
                progress.end(token.id);
                resolve(results);
            }).catch(function (err) {
                progress.end(token.id);
                return Promise.reject(err);
            });
        })
    }
    teams(workspaces: Workspaces[]): Promise<Teams[]> {
        var client = this._nativeClient;
        return new Promise(function (resolve, reject) {
            var promises = [];
            for (var i: number = 0; i < workspaces.length; i++) {
                promises.push(client.teams.findByOrganization(workspaces[i].id));
            }
            Promise.all(promises).then(function (results: ResourceList<Resource>[]) {
                var ret = [];
                for (var i: number = 0; i < results.length; i++) {
                    ret = ret.concat(results[i].data || [])
                }
                resolve(ret);
            }, reject);
        })
    }
    tasksInProject(projectId: number): Promise<Projects[]> {
        // fetch all tasks
        var client = this._nativeClient;
        return new Promise(function (resolve, reject) {
            var token = progress.create(1, {
                method: "asanaclient.tasksInProject",
                type: "tasks",
                name: "fetch project: " + projectId
            });
            client.projects.findById(projectId).then(function (project: Projects) {
                fetchListById(client.projects, "tasks", projectId).then(function (tasks: Tasks[]) {
                    token.info.id = project.id;
                    token.info.name = "fetch project tasks: " + project.name;
                    token.total = tasks.length;

                    project.tasks = tasks;
                    // fetch all subtasks
                    Promise.map(tasks, function (task: Tasks, index: number, length: number) {
                        return fetchListById(client.tasks, "subtasks", task.id).then(function (subtasks: Tasks[]) {
                            task.subtasks = subtasks;
                            token.loaded++;
                            token.current = task.name;
                        }).catch(function ignore(err) {
                            console.log("tasksInProject - fetch all subtasks error:" , err);
                            token.loaded++;
                            token.error++;
                        })
                    }, {
                        concurrency: 10
                    }).then(function () {
                        progress.end(token.id);
                        resolve(project);
                    }).catch(function (err) {
                        progress.end(token.id);
                        return Promise.reject(err);
                    });
                }).catch(function (err) {
                    reject(err);
                })
            }).catch(function (err) {
                reject(err);
            })
        });
    }
    taskEntities(task: Tasks): Promise<Tasks[]> {
        var client = this._nativeClient;
        var self = this;
        var subs = task.subtasks ? task.subtasks : [];
        var ids: number[] = [];
        for (var i = 0; i < subs.length; i++) {
            subs[i] && ids.push(subs[i].id);
        }
        return client.tasks.findById(task.id)
            .then((result: Tasks) => {
                return Promise.resolve(result);
            })
            .then((result: Tasks) => {
                return self.entities("tasks" , ids).then((subtasks: Tasks[]) => {
                    result.subtasks = subtasks;
                    return Promise.resolve(result);
                })
            })
            .then((result: Tasks) => {
                return Promise.resolve(result);
            })
            .catch((err) => {
                return Promise.reject(err);
            });
    }
}

// Create an Asana client. Do this per request since it keeps state that
// shouldn't be shared across requests.
export function create(credentials?: Asana.auth.Credentials | string): AsanaClient {
    return new AsanaClient(credentials);
}