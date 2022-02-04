/**
 * @file Methods for generating Karnaugh maps from a truth tables and finding groups from them.
 */

import {grayOrder, CubeMat, Karnaugh, TruthTable} from "./boolean-util";
import {combineBoolean} from "./permute";

export const buildKarnaughMap = (truthTable: boolean[]) => {
	const truth = new TruthTable(truthTable);

	const map = new Karnaugh(truthTable.length);
	for (let i = 0; i < truthTable.length; i++) {
		const inputs = [];

		for (const coord of map.indexToCoords(i)) {
			inputs.push(Boolean(grayOrder[coord] & 0b1));
			inputs.push(Boolean(grayOrder[coord] >>> 1 & 0b1));
		}

		map.array[i] = truth.get(inputs);
	}
	return map;
};

export const buildKarnaughPrefix = (map: Karnaugh) => {
	// 5 elements in each dimension except the last, which can either be 5 or 2 (no need to extend if the size is 2 in a direction)
	const prefixArrayLength = 5**(map.nDimensions - 1) * (map.nInputBits % 2 === 0 ? 5 : 2);

	const prefix = new CubeMat<number>(5, prefixArrayLength); // 1 larger in every direction to handle wrapping
	for (let i = 0; i < prefixArrayLength; i++) {
		const coords = prefix.indexToCoords(i);

		let sum = Number(map.getWrapping(coords));

		// Method for finding N-dimensional prefix sum element
		//  • Take the current element in the Karnaugh map
		//  • ADD all the elements that are [1 position behind in 1 direction] (ie, adjacent elements in 1D)
		//  • SUBTRACT all the elements that are [1 position behind in 2 directions] (ie, diagonals in 2D)
		//  • ADD all the elements that are [1 position behind in 3 directions] (ie, diagonals in 3D)
		//  • SUBTRACT all the elements that are diagonals in 4D
		//    ⋮
		for (let nShiftedDimensions = 1; nShiftedDimensions <= map.nDimensions; nShiftedDimensions++) {
			const sign = nShiftedDimensions % 2 === 0 ? -1 : 1;

			// Account for every coordinate set where exactly `nShiftedDimensions` dimensions have been shifted back 1 space
			for (const combo of combineBoolean(map.nDimensions, nShiftedDimensions)) {
				// Shift the current coords
				const targetCoords: number[] = [];
				for (let j = 0; j < coords.length; j++) {
					targetCoords[j] = combo[j] ? coords[j] - 1 : coords[j];
				}

				sum += sign * prefix.getElse(0, targetCoords);
			}
		}

		prefix.array[i] = sum;
	}

	return prefix;
}

export const findKarnaughGroups = (truthTable: boolean[]) => {
	const map = buildKarnaughMap(truthTable);
	const prefix = buildKarnaughPrefix(map);

	const mapGroups = new Map<number[], Set<number[]>>();

	map.array.forEach((value, i) => {
		if (value === false) return;

		const coords = map.indexToCoords(i);
		const singleDimensionDistances = getSingleDimensionDistances(map, coords);
		
		const groups = new Set<number[]>();

		const iterateCoordPossibilities = (dimensions: number[], indexOfVariedDimension: number=0) => {
			let anyGroupFound = false;
			let lastValidDistance = -1;

			// Test ALL OF THEM!!! (unoptimized)
			const maxDistance = singleDimensionDistances[indexOfVariedDimension];
			for (let distance = 0; distance <= maxDistance; distance++) {
				dimensions[indexOfVariedDimension] = distance;

				if (indexOfVariedDimension + 1 !== dimensions.length) {
					iterateCoordPossibilities(dimensions, indexOfVariedDimension + 1);
				} else {
					const groupFound = testDimensions(prefix, coords, dimensions);
					if (!groupFound) break;

					anyGroupFound = true;
					lastValidDistance = distance;
				}
			}

			if (anyGroupFound) {
				const lastValidDimensions = [...dimensions];
				lastValidDimensions[indexOfVariedDimension] = lastValidDistance;

				groups.add(lastValidDimensions);
			}
		};

		iterateCoordPossibilities(Array(map.nDimensions).fill(0));

		if (groups.size > 0) {
			mapGroups.set(coords, groups);
		}
	});

	// :)
	if (map.nDimensions === 0 && map.array[0] === true) {
		mapGroups.set([], new Set<number[]>([[]]));
	}

	removeRedundantGroups(mapGroups);

	return mapGroups;
};

const getSingleDimensionDistances = (map: Karnaugh, coords: number[]) => {
	const singleDimensionDistances = Array(map.nDimensions).fill(0); // log2(distance)
	for (let nDimension = 0; nDimension < map.nDimensions; nDimension++) {
		const axisHasTwoVariables = map.isEven || nDimension < map.nDimensions - 1; // code repeated from `interpretGroup`

		// Check for width 2
		if (!axisHasTwoVariables && coords[nDimension] !== 0) continue; // Would have been found already
		
		const testCoords = [...coords];
		testCoords[nDimension] = (testCoords[nDimension] + 1) % 4;

		if (map.get(testCoords) === true) {
			singleDimensionDistances[nDimension] = 1;
		} else {
			continue;
		}

		if (!axisHasTwoVariables) continue;

		// Check for width 4
		if (coords[nDimension] !== 0) continue; // Would have been found already

		const testCoords2 = [...coords];
		testCoords2[nDimension] = (testCoords2[nDimension] + 2) % 4;
		const testCoords3 = [...coords];
		testCoords3[nDimension] = (testCoords3[nDimension] + 3) % 4;

		if (map.get(testCoords2) === true
				&& map.get(testCoords3) === true) {
			singleDimensionDistances[nDimension] = 2;
		}
	}

	return singleDimensionDistances;
};

const samplePrefix = (prefix: CubeMat<number>, coords: number[], farCoords: number[]): number => {
	const nDimensions = coords.length;

	let prefixResult = prefix.get(farCoords);

	// Same as when building up the prefix sum, but the sign is flipped and the targetCoords are not necessarily
	// adjacent
	for (let nShiftedDimensions = 1; nShiftedDimensions <= nDimensions; nShiftedDimensions++) {
		const sign = nShiftedDimensions % 2 !== 0 ? -1 : 1;

		// Let coords = [1, 1] (4 in the following prefix) and farCoords = [2, 2] (9 in the prefix)
		// Map:    Prefix:
		// 1 1 1   1 2 3
		// 1 1 1   2 4 6
		// 1 1 1   3 6 9
		// In 2D, the prefix result would be (9 − 3 − 3 + 1) = 4, which is the number of 1s in the map within the
		// rectangle whose corners are [1, 1] and [2, 2] inclusive.

		for (const combo of combineBoolean(nDimensions, nShiftedDimensions)) {
			const targetCoords: number[] = [];
			
			for (let j = 0; j < coords.length; j++) {
				targetCoords[j] = combo[j] ? coords[j] - 1 : farCoords[j];
			}

			prefixResult += sign * prefix.getElse(0, targetCoords);
		}
	}

	return prefixResult;
};

const testDimensions = (prefix: CubeMat<number>, coords: number[], dimensions: number[]): boolean => {
	const farCoords = coords.map((coord, i) => coord + 2**dimensions[i] - 1);

	// Count the number of trues
	const prefixResult = samplePrefix(prefix, coords, farCoords);
	return prefixResult === 2**dimensions.reduce((exponent, length) => exponent + length, 0);
};

const removeRedundantGroups = (mapGroups: Map<number[], Set<number[]>>) => {

	// TODO wrapping in an axis with 1 variable?

	const contains = (containerOffset: number[], containerSize: number[], offset: number[], size: number[]) => {
		const result = 
				// Is the offset of the container group less than the offset of this group in every direction?
				offset.every((coord, i) => coord >= containerOffset[i])

				// Does the container group extend past this group in every direction?
				&& offset.every((coord, i) =>
						coord + 2**size[i] <= containerOffset[i] + 2**containerSize[i]
						|| containerSize[i] === 2 // Container size is 4 and wraps around infinitely
						// (handles case where container is size 4, while smaller is size 2 and wraps)
				);

		return result;
	};

	// (unoptimized)
	offsetLoop:
	for (const [offset, sizes] of mapGroups) {
		groupLoop:
		for (const size of sizes) {
			// Compare with every other group; determine if `cont` (container) contains this group
			for (const [contOffset, contSizes] of mapGroups) {
				for (const contSize of contSizes) {
					// If the same group, ignore
					const sameGroup = offset.every((coord, i) => coord === contOffset[i] && size[i] === contSize[i]);
					if (sameGroup) continue;

					if (!contains(contOffset, contSize, offset, size)) {
						// Determine if the container has an offset of 3 and size of 1 in any direction (it wraps around)
						let containerWraps = false;
						const newContOffset = [...contOffset];

						for (let i = 0; i < offset.length; i++) {
							if (contOffset[i] !== 3 || contSize[i] !== 1) continue;

							containerWraps = true;
							newContOffset[i] -= 4; // Shift the container group back
						}
						
						// Try again, but with the shifted coordinates
						if (!containerWraps || !contains(newContOffset, contSize, offset, size)) continue;
					}

					// Container group thus contains this group; no longer necessary
					sizes.delete(size);
					if (sizes.size === 0) {
						mapGroups.delete(offset);
						continue offsetLoop;
					}
					continue groupLoop;
				}
			}
		}
	}
};

export const generateExpression = (groups: Map<number[], Set<number[]>>, nInputBits: number) => {
	const parts: number[][] = [];

	for (const [offset, sizes] of groups) {
		const grays = offset.map(coord => grayOrder[coord]);

		for (const size of sizes) {
			const dependents = interpretGroup(offset, size, grays, nInputBits);
			parts.push(dependents);
		}
	}

	if (parts.length === 0) {// Empty sum
		return "0"
	}
	return parts.map(part => {
		if (part.length === 0) { // Empty product
			return "1";
		}
		return part.map(factor => {
			const letterId = Math.floor(factor / 2);
			const inverted = factor % 2 !== 0;

			return `${String.fromCharCode(letterId + "A".charCodeAt(0))}${inverted ? "′" : ""}`;
		}).join("");
	}).join(" + ");
}

const interpretGroup = (offset: number[], size: number[], grays: number[], nInputBits: number): number[] => {
	const isEven = nInputBits % 2 === 0; // Used to determine whether an axis only has one variable
	const nDimensions = Math.ceil(nInputBits / 2);

	const dependents = [];

	const A = 0;
	const NOT_A = 1;
	const B = 2;
	const NOT_B = 3;
	const variableOrderForSize2 = [NOT_B, A, B, NOT_A]; // Variable that stays constant in a group which has a size of 2 along a given axis, where the group's offset along the axis is `i`

	for (let i = 0; i < size.length; i++) {
		const varOffset = i * 4; // Number to be added to the `dependents` value to represent other variables (C, D, E, etc)

		const axisHasTwoVariables = isEven || i < nDimensions - 1;

		switch (size[i]) {
			case 0: { // 1: 2 variables along this axis matter
				const gray = grays[i];
				dependents.push((gray & 0b1 ? A : NOT_A) + varOffset);
				if (axisHasTwoVariables) {
					dependents.push((gray >> 1 & 0b1 ? B : NOT_B) + varOffset);
				}
				break;
			}

			case 1: // 2: 1 variable along this axis matters
				if (axisHasTwoVariables) {
					dependents.push(variableOrderForSize2[offset[i]] + varOffset);
				} else {
					continue;
				}
				break;

			case 2: // 4: 0 variables along this axis matter
				continue;
		}
	}

	return dependents;
};