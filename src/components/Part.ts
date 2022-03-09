import {Group} from "../Boolean/remove-redundant-groups";

export default class Part {
	readonly group: Group;
	readonly dependents: number[];

	constructor(group: Group, dependents: number[]) {
		this.group = group;
		this.dependents = dependents;
	}

	get size() {
		return this.dependents.length;
	}
}