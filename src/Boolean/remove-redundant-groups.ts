import {Karnaugh} from "./boolean-util";

export class Group {
	readonly volume: number;

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
}

namespace naive {
	export const removeRedundantGroups = (groups: Set<Group>, map: Karnaugh) => {
		const newMap = new Karnaugh(map.array.length);
	};
}