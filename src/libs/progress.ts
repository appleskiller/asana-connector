import * as _ from "lodash";

type TaskInfo = {
    name: string;
    [prop: string]: any;
}
export type ProgressTask = {
    current: string;
    error: number;
    loaded: number;
    total: number;
    id: string;
    info: TaskInfo;
}

var tasks: {[id: string]: ProgressTask} = {};

export function create (total: number = 0 , taskInfo: TaskInfo = {name: 'No name'}): ProgressTask{
    var id = _.uniqueId("progress-");
    var task =  {
        id: id ,
        current: "",
        error: 0,
        loaded: 0,
        total: total,
        info: taskInfo
    }
    tasks[id] = task;
    return task;
}
export function end(id: string , afterTake: number = 3000): void {
    tasks[id] && (tasks[id].loaded = tasks[id].total);
    if (afterTake >= 0) {
        setTimeout(function () { delete tasks[id]; } , afterTake);
    }
}
export function get(id: string): ProgressTask {
    return tasks[id];
}
export function take(id: string): ProgressTask {
    var task = tasks[id];
    delete tasks[id];
    return task;
}
export function all(): {[id: string]: ProgressTask} {
    return tasks;
}