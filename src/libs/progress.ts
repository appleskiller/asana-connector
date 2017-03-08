import * as _ from "lodash";

export type ProgressTask = {
    current: string;
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