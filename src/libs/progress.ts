import * as _ from "lodash";

export type ProgressTask = {
    current: string;
    error: number;
    loaded: number;
    total: number;
    id: string;
}

var tasks: {[id: string]: ProgressTask} = {};

export function create (): ProgressTask{
    var id = _.uniqueId("progress-");
    var task =  {
        id: id ,
        current: "",
        error: 0,
        loaded: 0,
        total: 0,
    }
    tasks[id] = task;
    return task;
}
export function end(id: string): void {
    tasks[id] && (delete tasks[id]);
}
export function get(id: string): ProgressTask {
    return tasks[id];
}
export function all(): {[id: string]: ProgressTask} {
    return tasks;
}