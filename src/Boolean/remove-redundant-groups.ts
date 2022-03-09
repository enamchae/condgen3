import BucketMap from "../util/BucketMap";
import { reduce } from "../util/iter";
import {Karnaugh} from "./boolean-util";
import {anyCombine, anyCombineBoolean, combine, permute, rangeArray} from "./permute";

export class Group {
	/**
	 * log2(true volume).
	 */
	readonly volume: number;
	readonly nDimensions: number;

	constructor(
		readonly offset: number[],
		/**
		 * log2(true length) in each direction.
		 */
		readonly size: number[],
	) {
		let volume = 0;
		for (const length of size) {
			volume += length;
		}
		this.volume = volume;
		this.nDimensions = offset.length;
	}

	eq(target: Group) {
		return this.offset.every((coord, i) => coord === target.offset[i] && this.size[i] === target.size[i]);
	}

	/**
	 * Determines whether this group contains another group, without considering the wrapping case.
	 * @param target 
	 * @returns 
	 */
	partialContains(target: Group) {
		// TODO wrapping in an axis with 1 variable?

		const result = 
				// Is the offset of the container group less than the offset of this group in every direction?
				target.offset.every((coord, i) => coord >= this.offset[i])

				// Does the container group extend past this group in every direction?
				&& target.offset.every((coord, i) =>
						coord + 2**target.size[i] <= this.offset[i] + 2**this.size[i]
						|| this.size[i] === 2 // Container size is 4 and wraps around infinitely
						// (handles case where container is size 4, while smaller is size 2 and wraps)
				);

		return result;
	}

	contains(target: Group) {
		if (this.partialContains(target)) {
			return true;
		}
		
		// Determine if the container has an offset of 3 and size of 1 in any direction (it wraps around)
		let containerWraps = false;
		const newOffset = [...this.offset];

		for (let i = 0; i < target.offset.length; i++) {
			if (this.offset[i] !== 3 || this.size[i] !== 1) continue;

			containerWraps = true;
			newOffset[i] -= 4; // Shift the container group back
		}
		
		// Try again, but with the shifted coordinates
		if (containerWraps && new Group(newOffset, this.size).partialContains(target)) {
			return true;
		}
		return false;
	}

	getWrappedDimensions() {
		const wrappedDimensions: number[] = [];
		for (let dimension = 0; dimension < this.nDimensions; dimension++) {
			if (this.endCorner[dimension] <= 4) continue;
			wrappedDimensions.push(dimension);
		}
		return wrappedDimensions;
	}

	private _length: number[]; // Switched from private fields due to Vue failing to support them
	get length() {
		return this._length ?? (this._length = this.size.map(size => 2**size));
	}

	private _endCorner: number[];
	get endCorner() {
		return this._endCorner ?? (this._endCorner = this.offset.map((coord, i) => coord + this.length[i]));
	}
}

export class Cuboid {
	readonly nDimensions: number;

	constructor(
		readonly offset: number[],
		/**
		 * True size; not log2.
		 */
		readonly length: number[],
	) {
		this.nDimensions = offset.length;
	}

	static thatCovers(map: Karnaugh): Cuboid {
		const length: number[] = [];
		for (let i = 0; i < map.nDimensions; i++) {
			length.push(i < map.nDimensions - 1 || map.isEven ? 4 : 2);
		}

		return new Cuboid(Array(map.nDimensions).fill(0), length);
	}

	/**
	 * (Due to wrapping, a group may consist of multiple cuboids.)
	 * @param group 
	 */
	static forGroup(group: Group): Cuboid[] {
		// Find all groups in which this group wraps
		const wrappedDimensions = group.getWrappedDimensions();

		if (wrappedDimensions.length === 0) {
			return [new Cuboid(group.offset, group.length)];
		}

		const cuboids = [];

		for (const combo of anyCombineBoolean(wrappedDimensions.length)) {
			const offset = [...group.offset];
			const length = [...group.length];
			for (let i = 0; i < wrappedDimensions.length; i++) {
				const dimension = wrappedDimensions[i];
				const firstLength = 4 - group.offset[dimension];

				offset[dimension] = combo[i] ? group.offset[dimension] : 0;
				length[dimension] = combo[i] ? firstLength : group.length[dimension] - firstLength;
			}

			cuboids.push(new Cuboid(offset, length));
		}

		return cuboids;
	}

	static totalVolume(cuboids: Set<Cuboid>): number {
		return reduce(cuboids, (cumVolume, cuboid) => cumVolume + cuboid.volume(), 0);
	}

	#endCorner: number[];
	get endCorner(): number[] {
		return this.#endCorner ?? (this.#endCorner = this.offset.map((coord, i) => coord + this.length[i]));
	}

	subtract(target: Cuboid): SubtractResult {
		const newCuboids: Cuboid[] = [];

		const newLeftCuboid = (dimension: number): Cuboid => {
			const offset: number[] = [];
			const length: number[] = [];
			for (let i = 0; i < this.nDimensions; i++) {
				if (i < dimension) {
					offset.push(Math.max(this.offset[i], target.offset[i]));
					length.push(target.length[i] - Math.max(0, this.offset[i] - target.offset[i]) - Math.max(0, target.endCorner[i] - this.endCorner[i]));
				} else if (i === dimension) {
					offset.push(this.offset[i]);
					length.push(target.offset[i] - this.offset[i]);
				} else {
					offset.push(this.offset[i]);
					length.push(this.length[i]);
				}
			}

			return new Cuboid(offset, length);
		};

		const newRightCuboid = (dimension: number): Cuboid => {
			const offset: number[] = [];
			const length: number[] = [];
			for (let i = 0; i < this.nDimensions; i++) {
				if (i < dimension) {
					offset.push(Math.max(this.offset[i], target.offset[i]));
					length.push(target.length[i] - Math.max(0, this.offset[i] - target.offset[i]) - Math.max(0, target.endCorner[i] - this.endCorner[i]));
				} else if (i === dimension) {
					offset.push(target.endCorner[i]);
					length.push(this.endCorner[i] - target.endCorner[i]);
				} else {
					offset.push(this.offset[i]);
					length.push(this.length[i]);
				}
			}

			return new Cuboid(offset, length);
		};

		for (let dimension = 0; dimension < this.nDimensions; dimension++) {
			// Does the target actually intersect this? (Only one direction needed to return no)
			if (target.endCorner[dimension] <= this.offset[dimension] || this.endCorner[dimension] <= target.offset[dimension]) {
				return {
					changed: false,
					subcuboids: [this],
				};
			}

			if (this.offset[dimension] < target.offset[dimension]) {
				newCuboids.push(newLeftCuboid(dimension));
			}
			if (target.endCorner[dimension] < this.endCorner[dimension]) {
				newCuboids.push(newRightCuboid(dimension));
			}
		}

		return {
			changed: true,
			subcuboids: newCuboids,
		};
	}

	volume() {
		return this.length.reduce((volume, length) => volume * length, 1);
	}
}
interface SubtractResult {
	readonly changed: boolean;
	readonly subcuboids: Cuboid[];
}

export const removeRedundantGroups = (groups: Set<Group>, map: Karnaugh) => {
	// Remove all groups that are contained by 1 other group
	// (unoptimized)
	for (const group of groups) {
		for (const container of groups) {
			if (group === container || !container.contains(group)) continue;
			groups.delete(group);
		}
	}

	if (groups.size <= 2) return groups;

	// Remove all groups that are contained by the union of multiple groups
	// (this is basically the minimum set cover problem so it's intrinsically slow)


	// The commented solution here is incomplete since the order of same-size groups matters
	
	// Determine if a N-cuboid is completely covered by a set of other parallel N-cuboids:
	//  • Create a cuboid covering the entire map and add it to a [set of remaining cuboids] S
	//     (the cuboids in S altogether represent, for any group during the iteration, a volume that has not been
	//     covered by any larger groups)
	//  • Starting with the largest group, subtract (cut out) [the cuboid representing the group] C from each cuboid D in S
	//      • If C does not affect D during the subtraction, remove C from the set of groups
	//      • Replace D in S with the cuboids resulting from the subtraction
/*	const uncoveredCuboids = new Set<Cuboid>([Cuboid.thatCovers(map)]);
	const groupsSorted = [...groups].sort((a, b) => b.volume - a.volume);

	for (const group of groupsSorted) {
		let atLeastOneChanged = false;

		for (const groupCuboid of Cuboid.forGroup(group)) {
			for (const cuboid of uncoveredCuboids) {
				const {changed, subcuboids} = cuboid.subtract(groupCuboid);
				if (!changed) continue;
	
				atLeastOneChanged = true;
				uncoveredCuboids.delete(cuboid);
				for (const subcuboid of subcuboids) {
					uncoveredCuboids.add(subcuboid);
				}
			}
		}

		if (atLeastOneChanged) continue;
		groups.delete(group);
	}
	
	return; */

	const groupsByVolume = new BucketMap<number, Group>();
	for (const group of groups) {
		groupsByVolume.add(group.volume, group);
	}

	const groupBucketsSorted = [...groupsByVolume.sets()].sort((a, b) => b[0] - a[0]);
	let uncoveredCuboids = new Set([Cuboid.thatCovers(map)]);

	for (const [volume, groupsOfVolume] of groupBucketsSorted) {
		const cuboidsForGroups = new Map<Group, Cuboid[]>();
		for (const group of groupsOfVolume) {
			cuboidsForGroups.set(group, Cuboid.forGroup(group));
		}

		// Find the optimal volume by subtracting all the groups first
		// Optimal volume is the minimum total volume of the uncovered cuboids
		const refUncoveredCuboids = new Set(uncoveredCuboids);
		for (const group of groupsOfVolume) {
			for (const groupCuboid of cuboidsForGroups.get(group)) {
				for (const cuboid of refUncoveredCuboids) {
					const {changed, subcuboids} = cuboid.subtract(groupCuboid);
					if (!changed) continue;

					refUncoveredCuboids.delete(cuboid);
					for (const subcuboid of subcuboids) {
						refUncoveredCuboids.add(subcuboid);
					}
				}
			}
		}
		const optimalVolume = Cuboid.totalVolume(refUncoveredCuboids);

		let optimalCombo: Group[];

		comboLoop:
		for (const combo of anyCombine([...groupsOfVolume])) {
			const comboUncoveredCuboids = new Set(uncoveredCuboids);

			for (const group of combo) {
				for (const groupCuboid of cuboidsForGroups.get(group)) {
					let anyCuboidsChanged = false;

					for (const cuboid of comboUncoveredCuboids) {
						const {changed, subcuboids} = cuboid.subtract(groupCuboid);
						if (!changed) continue;
			
						comboUncoveredCuboids.delete(cuboid);
						for (const subcuboid of subcuboids) {
							comboUncoveredCuboids.add(subcuboid);
						}

						anyCuboidsChanged = true;
					}

					if (!anyCuboidsChanged) continue comboLoop; // Any subset with a group that does not affect the cuboids is not optimal
				}
			}

			// Check the newfound volume against the optimal volume
			if (Cuboid.totalVolume(comboUncoveredCuboids) === optimalVolume) {
				optimalCombo = combo;
				break;
			}
		}

		optimalCombo ??= [...groupsOfVolume]; // Necessary?

		// Remove all groups that are not in the optimal combination
		const removedGroups = new Set(groupsOfVolume);
		for (const group of optimalCombo) {
			removedGroups.delete(group);
		}

		for (const group of removedGroups) {
			groups.delete(group);
		}

		// Update the original cuboid set
		uncoveredCuboids = refUncoveredCuboids;
	}

	return groups;
};

/*namespace naive {

	const fillMap = (map: Karnaugh, offset: number[], size: number[], dimension: number) => {
		if 

		for (let i = 0; i < size[dimension]; i++) {
			const newOffset = [...offset];
			newOffset[dimension]++;

		}
	};

	const removeRedundantGroups = (groups: Set<Group>, map: Karnaugh) => {
		const newMap = new Karnaugh(map.array.length);
		const groupsSorted = [...groups].sort((a, b) => b.volume - a.volume);
		
		for (const group of groupsSorted) {
			let anyChanged = false;

			fillMap(newMap, group);

			const oldValue = newMap.get(group.offset);
			if (oldValue === false) {
				anyChanged = true;
			}

			newMap.set(true, group.offset);
		}
	};
}*/