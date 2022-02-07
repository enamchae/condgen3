const mod = (a: number, b: number) => (a % b + b) % b;

export const grayOrder = [0b00, 0b01, 0b11, 0b10]; // smallest bit => first input 

/**
 * Matrix with an arbitrary number of dimensions, at most a given number of units long in each dimension.
 */
export class CubeMat<T> {
	readonly array: T[] = [];
	readonly width: number;

	readonly nDimensions: number;

	constructor(width: number, arrayLength: number) {
		this.width = width;
		// this.array = Array<T>(arrayLength);
		// Object.seal(this.array); 

		this.nDimensions = Math.ceil(Math.log2(arrayLength) / Math.log2(this.width));
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

	indexToCoords(index: number) {
		const indexes: number[] = [];
		for (let nDimension = 0; nDimension < this.nDimensions; nDimension++) {
			indexes.push(Math.floor(index / this.width**nDimension) % this.width);
		}
		return indexes;
	}
	
	get(coords: number[]) {
		return this.array[this.coordsToIndex(coords)];
	}

	getElse(alt: T, coords: number[]) {
		return this.get(coords) ?? alt;
	}

	getWrapping(coords: number[]) {
		return this.array[this.coordsToIndexWrapping(coords)];
	}

	set(value: T, coords: number[]) {
		this.array[this.coordsToIndex(coords)] = value;
		return this;
	}

	forEach(fn: (value: T, coords: number[]) => void) {
		this.array.forEach((value, i) => {
			fn(value, this.indexToCoords(i));
		});
	}
}

export class Karnaugh extends CubeMat<boolean> {
	readonly nInputBits: number;

	/**
	 * Whether the map has an even number of dimensions. If false, the final axis only has 1 variable.
	 */
	readonly isEven: boolean;

	constructor(arrayLength: number) {
		super(4, arrayLength);

		this.nInputBits = Math.log2(arrayLength);
		if (this.nInputBits % 1 !== 0) throw new RangeError("Truth table size is not a power of 2");

		this.isEven = this.nInputBits % 2 === 0;
	}
}

/* export class TruthTable extends CubeMat<boolean> {
	readonly nInputBits: number;

	constructor(inputs: boolean[]) {
		super(2, inputs.length);
		this.array.push(...inputs);

		this.nInputBits = Math.log2(inputs.length);
	}

	// functionally equivalent, partially copied over
	coordsToIndex(coords: number[]): number {
		let index = 0;
		for (let nDimension = 0; nDimension < coords.length; nDimension++) {
			const coord = coords[nDimension];
			if (coord < 0 || coord >= this.width) {
				return -1;
			}

			index += coord << nDimension;
		}
		return index;
	}
} */