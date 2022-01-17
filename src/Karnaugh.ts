const grayOrder = [0b00, 0b01, 0b11, 0b10];

const buildKarnaughMap = (truthTable: boolean[]) => {
	const nInputBits = Math.round(Math.log2(truthTable.length));
	const nDimensions = Math.ceil(nInputBits / 2);

	const getValueFromTruthTable = (...inputs: boolean[]) => {
		let index = 0;
		inputs.forEach((input, i) => {
			index += Number(input) << i;
		});
		return truthTable[index];
	};

	const map: boolean[] = [];
	for (let i = 0; i < truthTable.length; i++) {
		const associatedInputs = [];
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			const currentIndexInDimension = Math.floor(i / 4**nDimension);

			associatedInputs.push(Boolean(grayOrder[currentIndexInDimension] & 0b1));
			associatedInputs.push(Boolean(grayOrder[currentIndexInDimension] >> 1 & 0b1));
		}

		map[i] = getValueFromTruthTable(...associatedInputs);
	}
	return map;
};

const buildKarnaughPrefix = (map: boolean[]) => {
	const nInputBits = Math.round(Math.log2(map.length));
	const nDimensions = Math.ceil(nInputBits / 2);

	const prefix: number[] = [];
	for (let i = 0; i < map.length; i++) {
		const currentDimensionalIndexes = [];
		for (let nDimension = 0; nDimension < nDimensions; nDimension++) {
			currentDimensionalIndexes.push(Math.floor(i / 4**nDimension));
		}

		const addendIndexes = [];
		for (let nShiftedDimension = 0; nShiftedDimension < nDimensions; nShiftedDimension++) {
			const index = currentDimensionalIndexes.reduce((value, currentIndex, nDimension) => {
				return value + (4**nDimension) * (nShiftedDimension === nDimension ? currentIndex - 1 : currentIndex);
			}, 0);

			addendIndexes.push(index);
		}

		prefix[i] = currentDimensionalIndexes.reduce((value, addendIndex) => value + (map[addendIndex] ?? 0), map[i]);
	}

	return prefix;
}