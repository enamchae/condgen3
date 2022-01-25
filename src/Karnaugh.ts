import {HashSet} from "./hashcollection";
import {combineBoolean} from "./permute";

/**
 * Matrix with an arbitrary number of dimensions and at most 4 units long in each dimension
 */
class KarnaughMatrix<T> {
	array: T[];

	constructor() {
		this.array = [];
	}

	static coordsToIndex(...coords: number[]) {
		let index = 0;
		for (let nDimension = 0; nDimension < coords.length; nDimension++) {
			const coord = coords[nDimension];
			if (coord < 0 || coord >= 4) {
				return -1;
			}

			index += coord * 4**nDimension;
		}
		return index;
	}

	static indexToCoords(index: number, nDimensions: number) {
		const indexes: number[] = [];
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			indexes.push(Math.floor(index / 4**nDimension) % 4);
		}
		return indexes;
	}
	
	get(...indexes: number[]) {
		return this.array[KarnaughMatrix.coordsToIndex(...indexes)];
	}

	set(value: T, ...indexes: number[]) {
		this.array[KarnaughMatrix.coordsToIndex(...indexes)] = value;
		return this;
	}

	forEach(fn: (value: T, coords: number[]) => void) {
		const nDimensions = this.nDimensions();

		this.array.forEach((value, i) => {
			fn(value, KarnaughMatrix.indexToCoords(i, nDimensions));
		});
	}

	nInputBits() {
		return Math.round(Math.log2(this.array.length));
	}

	nDimensions() {
		return Math.ceil(this.nInputBits() / 2);
	}
}

const grayOrder = [0b00, 0b01, 0b11, 0b10];

const range = max => {
	const array = [];
	for (let i = 0; i < max; i++) {
		array.push(i);
	}
	return array;
};

export const buildKarnaughMap = (truthTable: boolean[]) => {
	const nInputBits = Math.round(Math.log2(truthTable.length));
	const nDimensions = Math.ceil(nInputBits / 2);

	const getValueFromTruthTable = (...inputs: boolean[]) => {
		const index = inputs.reduce((value, input, i) => value + (Number(input) << i), 0);
		return truthTable[index];
	};

	const map = new KarnaughMatrix<boolean>();
	for (let i = 0; i < truthTable.length; i++) {
		const associatedInputs = [];

		for (const index of KarnaughMatrix.indexToCoords(i, nDimensions)) {
			associatedInputs.push(Boolean(grayOrder[index] & 0b1));
			associatedInputs.push(Boolean(grayOrder[index] >> 1 & 0b1));
		}

		map.array[i] = getValueFromTruthTable(...associatedInputs);
	}
	return map;
};

export const buildKarnaughPrefix = (map: KarnaughMatrix<boolean>) => {
	const nDimensions = map.nDimensions();

	const prefix = new KarnaughMatrix<number>();
	for (let i = 0; i < map.array.length; i++) {
		const currentCoords = KarnaughMatrix.indexToCoords(i, nDimensions);

		let sum = Number(map.array[i]);

		// Method for finding N-dimensional prefix sum element
		//  • Take the current element in the Karnaugh map
		//  • ADD all the elements that are [1 position behind in 1 direction] (ie, adjacent elements in 1D)
		//  • SUBTRACT all the elements that are [1 position behind in 2 directions] (ie, diagonals in 2D)
		//  • ADD all the elements that are [1 position behind in 3 directions] (ie, diagonals in 3D)
		//    ⋮
		for (let nShiftedDimensions = 1; nShiftedDimensions <= nDimensions; nShiftedDimensions++) {
			const sign = nShiftedDimensions % 2 === 0 ? -1 : 1;

			for (const combo of combineBoolean(nDimensions, nShiftedDimensions)) {
				// Shift the current coords
				const coords = [];
				for (let j = 0; j < currentCoords.length; j++) {
					coords[j] = combo[j] ? currentCoords[j] - 1 : currentCoords[j];
				}

				sum += sign * (prefix.get(...coords) ?? 0);
			}
		}

		prefix.array[i] = sum;
	}

	return prefix;
}

export const getSimplestExpression = (truthTable: boolean[]) => {
	const map = buildKarnaughMap(truthTable);
	const prefix = buildKarnaughPrefix(map);

	const nInputBits = Math.round(Math.log2(truthTable.length));
	const nDimensions = Math.ceil(nInputBits / 2);

	map.array.forEach((value, i) => {
		if (value === false) return;

		const coords = KarnaughMatrix.indexToCoords(i, nDimensions);

		const singleDimensionDistances = getSingleDimensionDistances(map, coords, nDimensions);

		// Find groups based on the single-dimension distances
		const dimensionHash = (dimensions: number[]) =>
				dimensions.reduce((value, length, nDimension) => value + (BigInt(length) << (2n * BigInt(nDimension))), 0n);

		const groups = new HashSet<number[]>(dimensionHash);
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
					const groupFound = testDimensions(prefix, coords, dimensions, nDimensions);
					if (!groupFound) break;

					anyGroupFound = true;
					lastValidDistance = distance;
				}
			}

			if (anyGroupFound) {
				groups.add(dimensions.map((dimension, i) => i === indexOfVariedDimension ? lastValidDistance : dimension));
			}
		};

		iterateCoordPossibilities(new Array(nDimensions).fill(0));

		console.log(coords, [...groups.values()]);
	});
};

const getSingleDimensionDistances = (map: KarnaughMatrix<boolean>, coords: number[], nDimensions: number) => {
	const singleDimensionDistances = new Array(nDimensions).fill(0); // log2(distance)
	for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
		// Check for width 2
		const testCoords = coords.map((index, j) => (j === nDimension) ? (index + 1) % 4 : index);

		if (map.get(...testCoords) === true) {
			singleDimensionDistances[nDimension] = 1;
		} else {
			continue;
		}

		// Check for width 4
		// if (indexes[nDimension] !== 0) continue; // Would have been found already

		const testCoords2 = coords.map((index, j) => (j === nDimension) ? (index + 2) % 4 : index);
		const testCoords3 = coords.map((index, j) => (j === nDimension) ? (index + 3) % 4 : index);

		if (map.get(...testCoords2) === true
				&& map.get(...testCoords3) === true) {
			singleDimensionDistances[nDimension] = 2;
		}
	}

	return singleDimensionDistances;
};

const testDimensions = (prefix: KarnaughMatrix<number>, coords: number[], dimensions: number[], nDimensions: number): boolean => {
	const farCoords = coords.map((index, j) => index + 2**dimensions[j] - 1);

	// Count the number of trues
	const prefixResult = prefix.get(...farCoords)
			- farCoords.reduce((sum, farIndex, j) => {
				const targetCoords = coords.map((index, nDimension) => nDimension === j ? index - 1 : farIndex);
				return sum + prefix.get(...targetCoords);
			}, 0);
			+ (nDimensions - 1) * prefix.get(...coords.map(index => index - 1));

	return prefixResult === 2**dimensions.reduce((exponent, length) => exponent + length, 0);
};