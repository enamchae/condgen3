/**
 * @file Methods for generating Karnaugh maps from a truth tables and finding groups from them.
 */

import {combineBoolean} from "./permute";

const mod = (a: number, b: number) => (a % b + b) % b;

/**
 * Matrix with an arbitrary number of dimensions, at most `width` units long in each dimension
 */
class CubeMat<T> {
	array: T[] = [];
	width: number;

	constructor(width=4) {
		this.width = width;
	}

	coordsToIndex(coords: number[]) {
		let index = 0;
		for (let nDimension = 0; nDimension < coords.length; nDimension++) {
			const coord = coords[nDimension];
			if (coord < 0 || coord >= this.width) {
				return -1;
			}

			index += coord * this.width**nDimension;
		}
		return index;
	}

	// TODO should handle the case where the final axis is size 2 instead of 4
	coordsToIndexWrapping(coords: number[]) {
		let index = 0;
		for (let nDimension = 0; nDimension < coords.length; nDimension++) {
			const coord = mod(coords[nDimension], this.width);

			index += coord * this.width**nDimension;
		}
		return index;
	}

	indexToCoords(index: number, nDimensions: number=this.nDimensions()) {
		const indexes: number[] = [];
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			indexes.push(Math.floor(index / this.width**nDimension) % this.width);
		}
		return indexes;
	}
	
	get(indexes: number[]) {
		return this.array[this.coordsToIndex(indexes)];
	}

	getElse(alt: T, indexes: number[]) {
		return this.get(indexes) ?? alt;
	}

	getWrapping(indexes: number[]) {
		return this.array[this.coordsToIndexWrapping(indexes)];
	}

	set(value: T, indexes: number[]) {
		this.array[this.coordsToIndex(indexes)] = value;
		return this;
	}

	forEach(fn: (value: T, coords: number[]) => void) {
		const nDimensions = this.nDimensions();

		this.array.forEach((value, i) => {
			fn(value, this.indexToCoords(i, nDimensions));
		});
	}

	nInputBits() {
		return Math.log2(this.array.length);
	}

	nDimensions() {
		return Math.ceil(this.nInputBits() / 2);
	}
}

const grayOrder = [0b00, 0b01, 0b11, 0b10]; // smallest bit => first input

const range = max => {
	const array = [];
	for (let i = 0; i < max; i++) {
		array.push(i);
	}
	return array;
};

export const buildKarnaughMap = (truthTable: boolean[]) => {
	const nInputBits = Math.log2(truthTable.length);
	const nDimensions = Math.ceil(nInputBits / 2);

	if (nInputBits % 1 !== 0) throw new RangeError("Truth table size is not a power of 2");

	const getValueFromTruthTable = (...inputs: boolean[]) => {
		const index = inputs.reduce((value, input, i) => value + (Number(input) << i), 0);
		return truthTable[index];
	};

	const map = new CubeMat<boolean>();
	for (let i = 0; i < truthTable.length; i++) {
		const associatedInputs = [];

		for (const index of map.indexToCoords(i, nDimensions)) {
			associatedInputs.push(Boolean(grayOrder[index] & 0b1));
			associatedInputs.push(Boolean(grayOrder[index] >>> 1 & 0b1));
		}

		map.array[i] = getValueFromTruthTable(...associatedInputs);
	}
	return map;
};

export const buildKarnaughPrefix = (map: CubeMat<boolean>) => {
	const nDimensions = map.nDimensions();

	// 5 elements in each dimension except the last, which can either be 5 or 2 (no need to extend if the size is 2 in a direction)
	const prefixArrayLength = 5**(nDimensions - 1) * (map.nInputBits() % 2 === 0 ? 5 : 2);

	const prefix = new CubeMat<number>(5); // 1 larger in every direction to handle wrapping
	for (let i = 0; i < prefixArrayLength; i++) {
		const coords = prefix.indexToCoords(i, nDimensions);

		let sum = Number(map.getWrapping(coords));

		// Method for finding N-dimensional prefix sum element
		//  • Take the current element in the Karnaugh map
		//  • ADD all the elements that are [1 position behind in 1 direction] (ie, adjacent elements in 1D)
		//  • SUBTRACT all the elements that are [1 position behind in 2 directions] (ie, diagonals in 2D)
		//  • ADD all the elements that are [1 position behind in 3 directions] (ie, diagonals in 3D)
		//  • SUBTRACT all the elements that are diagonals in 4D
		//    ⋮
		for (let nShiftedDimensions = 1; nShiftedDimensions <= nDimensions; nShiftedDimensions++) {
			const sign = nShiftedDimensions % 2 === 0 ? -1 : 1;

			// Account for every coordinate set where exactly `nShiftedDimensions` dimensions have been shifted back 1 space
			for (const combo of combineBoolean(nDimensions, nShiftedDimensions)) {
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

	const nInputBits = Math.round(Math.log2(truthTable.length));
	const nDimensions = Math.ceil(nInputBits / 2);

	const mapGroups = new Map<number[], Set<number[]>>();

	map.array.forEach((value, i) => {
		if (value === false) return;

		const coords = map.indexToCoords(i, nDimensions);
		const singleDimensionDistances = getSingleDimensionDistances(map, coords, nDimensions, nInputBits);

		console.log(coords, singleDimensionDistances);
		
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

		iterateCoordPossibilities(new Array(nDimensions).fill(0));

		if (groups.size > 0) {
			mapGroups.set(coords, groups);
		}
	});

	removeRedundantGroups(mapGroups);

	return mapGroups;
};

const getSingleDimensionDistances = (map: CubeMat<boolean>, coords: number[], nDimensions: number, nInputBits: number) => {
	// code repeated from `interpretGroup`
	const isEven = nInputBits % 2 === 0; // Used to determine whether an axis only has one variable

	const singleDimensionDistances = new Array(nDimensions).fill(0); // log2(distance)
	for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
		const axisHasTwoVariables = isEven || nDimension < nDimensions - 1;

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

	return parts.length === 0
			? "0" // Empty sum
			: parts.map(part => {
				return part.length === 0
						? "1" // Empty product
						: part.map(factor => {
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