import * as asanaclient from "./asanaclient";
import * as shujuguanclient from "./shujuguanclient";

type HeaderProp = {
	property: string;
	name: string;
	dataType: string;
	columnType: string;
	valueConverter: (value: any) => any;
}
function any2any(v:any):any {
	return v;
}
function boolean2number(bool: Boolean): number {
	return !!bool ? 1 : 0;
}
function date2number(date: string): number {
	return date ? (new Date(date)).getTime() : null;
}
function obj2id(obj: any): number {
	return obj ? obj.id : null;
}
function obj2name(obj: any): string {
	return obj ? obj.name : null;
}
function array2id(obj: any): string {
	if (!obj || !obj.length) {
		return "";
	}
	var id = 
	return ;
}
function array2name(obj: any): string {
	return obj ? obj.name : null;
}
function array2count(obj: any): number{
	return (obj && obj.length) ? obj.length : 0;
}
// -----------------------------------------------------------------------
// tasks datatable
// =========================================================================
var template = {
	assignee: {
		id: 38745566021223, 
		name: "lily"
	},
	assignee_status: "inbox",
	completed: false,
	completed_at: null,
	created_at: "2017-03-03T09:42:29.307Z",
	custom_fields: [],
	due_at: null,
	due_on: null,
	followers: [
		{id: 34569996131079, name: "赵鹭"}, 
		{id: 38745566021223, name: "lily"}
	],
	hearted: false,
	hearts: [],
	id: 285199443646363,
	memberships: [],
	modified_at: "2017-03-06T10:05:28.042Z",
	name: "[3]Slideshow or export PPT for dashboards || 集成测试",
	notes: "",
	num_hearts: 0,
	parent: {
		id: 285170704360298, 
		name: "[S42F_dataflow] Dataflow AB Release"
	},
	projects: [],
	tags: [],
	workspace: {
		id: 34498826015511, 
		name: "shujuguan.cn"
	},
}
var taskTableHeader: HeaderProp[] = [
	{property: "assignee" , name: "assignee" , dataType: "STRING" , columnType: "TEXT" , valueConverter: obj2name},
	{property: "assignee_status" , name: "assignee_status" , dataType: "STRING" , columnType: "TEXT" , valueConverter: any2any},
	{property: "completed" , name: "completed" , dataType: "INTEGER" , columnType: "INTEGER" , valueConverter: boolean2number},
	{property: "completed_at" , name: "completed_at" , dataType: "STRING" , columnType: "TEXT" , valueConverter: any2any},
	{property: "created_at" , name: "created_at" , dataType: "DATE" , columnType: "DATETIME" , valueConverter: date2number},

	// custom_fields

	{property: "due_at" , name: "due_at" , dataType: "DATE" , columnType: "DATETIME" , valueConverter: date2number},
	{property: "due_on" , name: "due_on" , dataType: "DATE" , columnType: "DATETIME" , valueConverter: date2number},
]
export function createTasksTableByProject(client: asanaclient.AsanaClient , projectId: number): void {
	client.tasksInProject(projectId).then(function (project: asanaclient.Projects) {

	})
}

// archived: false
// color: "dark-teal"
// created_at: "2017-02-20T06:38:45.790Z"
// current_status: null
// custom_field_settings: Array[2]
// due_date: null
// followers: Array[1]
// id: 275995325944865
// layout: "list"
// members: Array[1]
// modified_at: "2017-03-10T06:52:03.708Z"
// name: "S42B"
// notes: ""
// owner: Object
// public: true
// tasks: Array[48]
// team: Object
// workspace: Object