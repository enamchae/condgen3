/**
 * Matrix with an arbitrary number of dimensions and at most 4 units long in each dimension
 */
 class KarnaughMatrix<T> {
	array: T[];

	constructor() {
		this.array = [];
	}

	static indexesToTrueIndex(...indexes: number[]) {
		return indexes.reduce((value, index, nDimension) => value + index * 4**nDimension, 0);
	}

	static trueIndexToIndexes(index: number, nDimensions: number) {
		const indexes: number[] = [];
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			indexes.push(Math.floor(index / 4**nDimension));
		}
		return indexes;
	}
	
	get(...indexes: number[]) {
		return this.array[KarnaughMatrix.indexesToTrueIndex(...indexes)];
	}

	set(value: T, ...indexes: number[]) {
		this.array[KarnaughMatrix.indexesToTrueIndex(...indexes)] = value;
		return this;
	}

	forEach(fn) {
		const nDimensions = this.nDimensions();

		this.array.forEach((value, i) => {
			fn(value, KarnaughMatrix.trueIndexToIndexes(i, nDimensions));
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

		for (const index of KarnaughMatrix.trueIndexToIndexes(i, nDimensions)) {
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
		const currentDimensionalIndexes = KarnaughMatrix.trueIndexToIndexes(i, nDimensions);

		let sum = Number(map[i]);
		for (let nShiftedDimension = 0; nShiftedDimension < nDimensions; nShiftedDimension++) {
			const addendIndex = currentDimensionalIndexes.reduce((value, currentIndex, nDimension) => {
				return value + (4**nDimension) * (nShiftedDimension === nDimension ? currentIndex - 1 : currentIndex);
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

		const indexes = KarnaughMatrix.trueIndexToIndexes(i, nDimensions);

		const singleDimensionDistances = new Array(nDimensions).fill(1);
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			// Check for width 2
			const testIndexes = indexes.map((index, i) => (i === nDimension) ? (index + 1) % 4 : index);

			if (map[KarnaughMatrix.indexesToTrueIndex(...testIndexes)] === true) {
				singleDimensionDistances[nDimension] = 2;
			} else {
				continue;
			}

			// Check for width 4
			// if (indexes[nDimension] !== 0) continue; // Would have been found already

			const testIndexes2 = indexes.map((index, i) => (i === nDimension) ? (index + 2) % 4 : index);
			const testIndexes3 = indexes.map((index, i) => (i === nDimension) ? (index + 3) % 4 : index);

			if (map[KarnaughMatrix.indexesToTrueIndex(...testIndexes2)] === true
					&& map[KarnaughMatrix.indexesToTrueIndex(...testIndexes3)] === true) {
				singleDimensionDistances[nDimension] = 4;
			}
		}

		// Find groups based on the single-dimension distances
	});
};