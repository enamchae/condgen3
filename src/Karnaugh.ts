import {HashSet} from "./hashcollection";

/**
 * Matrix with an arbitrary number of dimensions and at most 4 units long in each dimension
 */
 class KarnaughMatrix<T> {
	array: T[];

	constructor() {
		this.array = [];
	}

	static coordsToIndex(...indexes: number[]) {
		return indexes.reduce((value, index, nDimension) => value + index * 4**nDimension, 0);
	}

	static indexToCoords(index: number, nDimensions: number) {
		const indexes: number[] = [];
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			indexes.push(Math.floor(index / 4**nDimension));
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

	forEach(fn) {
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

	const map: boolean[] = [];
	for (let i = 0; i < truthTable.length; i++) {
		const associatedInputs = [];

		for (const index of KarnaughMatrix.indexToCoords(i, nDimensions)) {
			associatedInputs.push(Boolean(grayOrder[index] & 0b1));
			associatedInputs.push(Boolean(grayOrder[index] >> 1 & 0b1));
		}

		map[i] = getValueFromTruthTable(...associatedInputs);
	}
	return map;
};

export const buildKarnaughPrefix = (map: boolean[]) => {
	const nInputBits = Math.round(Math.log2(map.length));
	const nDimensions = Math.ceil(nInputBits / 2);

	const prefix: number[] = [];
	for (let i = 0; i < map.length; i++) {
		const currentDimensionalCoords = KarnaughMatrix.indexToCoords(i, nDimensions);

		let sum = Number(map[i]);
		// Sum together the adjacent element of the map in each direction
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			// Get the index of the relevant element
			const addendIndex = currentDimensionalCoords.reduce((value, currentIndex, i) => {
				return value + (4**i) * (nDimension === i ? currentIndex - 1 : currentIndex);
			}, 0);

			sum += Number(prefix[addendIndex] ?? 0);
		}

		prefix[i] = sum;
	}

	return prefix;
}

export const getSimplestExpression = (truthTable: boolean[]) => {
	const map = buildKarnaughMap(truthTable);
	const prefix = buildKarnaughPrefix(map);

	const nInputBits = Math.round(Math.log2(truthTable.length));
	const nDimensions = Math.ceil(nInputBits / 2);

	map.forEach((value, i) => {
		if (value === false) return;

		const coords = KarnaughMatrix.indexToCoords(i, nDimensions);

		const singleDimensionDistances = getSingleDimensionDistances(map, coords, nDimensions);

		// Find groups based on the single-dimension distances
		const dimensionHash = (dimensions: number[]) =>
				dimensions.reduce((value, length, nDimension) => value + (BigInt(length) << (2n * BigInt(nDimension))), 0n) ;

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

					if (groupFound) {
						anyGroupFound = true;
						lastValidDistance = distance;
					} else {
						break;
					}
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

const getSingleDimensionDistances = (map: boolean[], coords: number[], nDimensions: number) => {
	const singleDimensionDistances = new Array(nDimensions).fill(0); // log2(distance)
	for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
		// Check for width 2
		const testCoords = coords.map((index, j) => (j === nDimension) ? (index + 1) % 4 : index);

		if (map[KarnaughMatrix.coordsToIndex(...testCoords)] === true) {
			singleDimensionDistances[nDimension] = 1;
		} else {
			continue;
		}

		// Check for width 4
		// if (indexes[nDimension] !== 0) continue; // Would have been found already

		const testCoords2 = coords.map((index, j) => (j === nDimension) ? (index + 2) % 4 : index);
		const testCoords3 = coords.map((index, j) => (j === nDimension) ? (index + 3) % 4 : index);

		if (map[KarnaughMatrix.coordsToIndex(...testCoords2)] === true
				&& map[KarnaughMatrix.coordsToIndex(...testCoords3)] === true) {
			singleDimensionDistances[nDimension] = 2;
		}
	}

	return singleDimensionDistances;
};

const testDimensions = (prefix: number[], coords: number[], dimensions: number[], nDimensions: number): boolean => {
	const farCoords = coords.map((index, j) => index + 2**dimensions[j] - 1);

	// Count the number of trues
	const prefixResult = prefix[KarnaughMatrix.coordsToIndex(...farCoords)]
			- farCoords.reduce((sum, farIndex, j) => {
				const targetCoords = coords.map((index, nDimension) => nDimension === j ? index - 1 : farIndex);
				const newIndex = KarnaughMatrix.coordsToIndex(...targetCoords);
				return sum + prefix[newIndex];
			}, 0)
			+ (nDimensions - 1) * prefix[KarnaughMatrix.coordsToIndex(...coords.map(index => index - 1))];

	return prefixResult === 2**dimensions.reduce((exponent, length) => exponent + length, 0);
};