import {HashSet} from "./hashcollection";
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

	static coordsToIndex(width: number, ...coords: number[]) {
		let index = 0;
		for (let nDimension = 0; nDimension < coords.length; nDimension++) {
			const coord = coords[nDimension];
			if (coord < 0 || coord >= width) {
				return -1;
			}

			index += coord * width**nDimension;
		}
		return index;
	}

	static coordsToIndexWrapping(width: number, ...coords: number[]) {
		let index = 0;
		for (let nDimension = 0; nDimension < coords.length; nDimension++) {
			const coord = mod(coords[nDimension], width);

			index += coord * width**nDimension;
		}
		return index;
	}

	static indexToCoords(index: number, nDimensions: number, width: number) {
		const indexes: number[] = [];
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			indexes.push(Math.floor(index / width**nDimension) % width);
		}
		return indexes;
	}
	
	get(...indexes: number[]) {
		return this.array[CubeMat.coordsToIndex(this.width, ...indexes)];
	}

	getElse(alt: T, ...indexes: number[]) {
		return this.get(...indexes) ?? alt;
	}

	getWrapping(...indexes: number[]) {
		return this.array[CubeMat.coordsToIndexWrapping(this.width, ...indexes)];
	}

	set(value: T, ...indexes: number[]) {
		this.array[CubeMat.coordsToIndex(this.width, ...indexes)] = value;
		return this;
	}

	forEach(fn: (value: T, coords: number[]) => void) {
		const nDimensions = this.nDimensions();

		this.array.forEach((value, i) => {
			fn(value, CubeMat.indexToCoords(i, nDimensions, this.width));
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

		for (const index of CubeMat.indexToCoords(i, nDimensions, map.width)) {
			associatedInputs.push(Boolean(grayOrder[index] & 0b1));
			associatedInputs.push(Boolean(grayOrder[index] >>> 1 & 0b1));
		}

		map.array[i] = getValueFromTruthTable(...associatedInputs);
	}
	return map;
};

export const buildKarnaughPrefix = (map: CubeMat<boolean>) => {
	const nDimensions = map.nDimensions();

	// 5 elements in each dimension except the last, which can either be 5 or 3
	const prefixArrayLength = 5**(nDimensions - 1) * (map.nInputBits() % 2 === 0 ? 5 : 3);

	const prefix = new CubeMat<number>(5); // 1 larger in every direction to handle wrapping
	for (let i = 0; i < prefixArrayLength; i++) {
		const currentCoords = CubeMat.indexToCoords(i, nDimensions, prefix.width);

		let sum = Number(map.getWrapping(...currentCoords));

		// Method for finding N-dimensional prefix sum element
		//  • Take the current element in the Karnaugh map
		//  • ADD all the elements that are [1 position behind in 1 direction] (ie, adjacent elements in 1D)
		//  • SUBTRACT all the elements that are [1 position behind in 2 directions] (ie, diagonals in 2D)
		//  • ADD all the elements that are [1 position behind in 3 directions] (ie, diagonals in 3D)
		//  • SUBTRACT all the elements that are diagonals in 4D
		//    ⋮
		for (let nShiftedDimensions = 1; nShiftedDimensions <= nDimensions; nShiftedDimensions++) {
			const sign = nShiftedDimensions % 2 === 0 ? -1 : 1;

			for (const combo of combineBoolean(nDimensions, nShiftedDimensions)) {
				// Shift the current coords
				const coords = [];
				for (let j = 0; j < currentCoords.length; j++) {
					coords[j] = combo[j] ? currentCoords[j] - 1 : currentCoords[j];
				}

				sum += sign * prefix.getElse(0, ...coords);
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

		const coords = CubeMat.indexToCoords(i, nDimensions, map.width);

		const singleDimensionDistances = getSingleDimensionDistances(map, coords, nDimensions);

		// Find groups based on the single-dimension distances
		/*const dimensionHash = (dimensions: number[]) =>
				dimensions.reduce((value, length, nDimension) => value + (BigInt(length) << (2n * BigInt(nDimension))), 0n); */

		// const groups = new HashSet<number[]>(dimensionHash);
		const groups = new Set<number[]>();
		// const redundantGroups = new HashSet<number[]>(dimensionHash);

		const iterateCoordPossibilities = (dimensions: number[], indexOfVariedDimension: number=0) => {
			dimensions[indexOfVariedDimension] = 0;

			let anyGroupFound = false;
			let lastValidDistance = -1;

			// Test ALL OF THEM!!! (unoptimized)
			for (let distance = 0; distance <= singleDimensionDistances[indexOfVariedDimension]; distance++) {
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

const getSingleDimensionDistances = (map: CubeMat<boolean>, coords: number[], nDimensions: number) => {
	const singleDimensionDistances = new Array(nDimensions).fill(0); // log2(distance)
	for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
		// Check for width 2
		const testCoords = [...coords];
		testCoords[nDimension] = (testCoords[nDimension] + 1) % 4;

		if (map.get(...testCoords) === true) {
			singleDimensionDistances[nDimension] = 1;
		} else {
			continue;
		}

		// Check for width 4
		if (coords[nDimension] !== 0) continue; // Would have been found already

		const testCoords2 = [...coords];
		testCoords2[nDimension] = (testCoords2[nDimension] + 2) % 4;
		const testCoords3 = [...coords];
		testCoords3[nDimension] = (testCoords3[nDimension] + 3) % 4;

		if (map.get(...testCoords2) === true
				&& map.get(...testCoords3) === true) {
			singleDimensionDistances[nDimension] = 2;
		}
	}

	return singleDimensionDistances;
};

const samplePrefix = (prefix: CubeMat<number>, coords: number[], farCoords: number[]): number => {
	const nDimensions = coords.length;

	return prefix.get(...farCoords)
			- farCoords.reduce((sum, farIndex, j) => {
				const targetCoords = [...farCoords];
				targetCoords[j] = coords[j] - 1;

				return sum + prefix.getElse(0, ...targetCoords);
			}, 0)
			+ (nDimensions - 1) * prefix.getElse(0, ...coords.map(coord => coord - 1));
};

const testDimensions = (prefix: CubeMat<number>, coords: number[], dimensions: number[]): boolean => {
	const farCoords = coords.map((coord, i) => coord + 2**dimensions[i] - 1);

	// Count the number of trues
	const prefixResult = samplePrefix(prefix, coords, farCoords);
	return prefixResult === 2**dimensions.reduce((exponent, length) => exponent + length, 0);
};

const removeRedundantGroups = (mapGroups: Map<number[], Set<number[]>>) => {

	const contains = (containerOffset: number[], containerSize: number[], offset: number[], size: number[]) => {
		// Is the offset of the container group less than the offset of this group in every direction?
		return offset.every((coord, i) => coord >= containerOffset[i])
		// Does the container group extend past this group in every direction?
				&& offset.every((coord, i) => coord + 2**size[i] <= containerOffset[i] + 2**containerSize[i]);
	};

	// (unoptimized)
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
						continue groupLoop;
					}
				}
			}
		}
	}
};

export const generateExpression = (groups: Map<number[], Set<number[]>>) => {
	const parts: number[][] = [];

	for (const [offset, sizes] of groups) {
		const grays = offset.map(coord => grayOrder[coord]);

		for (const size of sizes) {
			const dependents = interpretGroup(offset, size, grays);
			parts.push(dependents);
		}
	}

	return parts.map(part => {
		return part.map(factor => {
			const letterId = Math.floor(factor / 2);
			const inverted = factor % 2 !== 0;

			return `${String.fromCharCode(letterId + "A".charCodeAt(0))}${inverted ? "′" : ""}`;
		}).join("");
	}).join(" + ");
}

const interpretGroup = (offset: number[], size: number[], grays: number[]): number[] => {
	const dependents = [];

	const A = 0;
	const NOT_A = 1;
	const B = 2;
	const NOT_B = 3;
	const variableOrderForSize2 = [NOT_B, A, B, NOT_A]; // Variable that stays constant in a group which has a size of 2 along a given axis, given the offset along the axis

	for (let i = 0; i < size.length; i++) {
		const varOffset = i * 4; // Number to be added to the `dependents` value to represent other variables (C, D, E, etc)

		switch (size[i]) {
			case 0: { // 1: 2 variables along this axis matter
				const gray = grays[i];
				dependents.push((gray & 0b1 ? A : NOT_A) + varOffset);
				dependents.push((gray >> 1 & 0b1 ? B : NOT_B) + varOffset);
				break;
			}

			case 1: // 2: 1 variable along this axis matters
				dependents.push(variableOrderForSize2[offset[i]] + varOffset);
				break;

			case 2: // 4: 0 variables along this axis matter
				continue;
		}
	}

	return dependents;
};