/**
 * @file Methods for generating permutations and combinations.
 */

/* const permutations = (items: unknown[]): unknown[][] => {
	switch (items.length) {
		case 1:
			return [[items[0]]];

		case 0:
			return [[]];
	}

	const perms = [];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];

		const rest = [...items.slice(0, i), ...items.slice(i + 1)];
		for (const subperm of permutations(rest)) {
			perms.push([item, ...subperm]);
		}
	}
	
	return perms;
};

export default permutations; */

export function* permute(items: unknown[]): Generator<unknown[], void, void> {
	switch (items.length) {
		case 1:
			yield [items[0]];
			return;

		case 0:
			yield [];
			return;
	}

	for (let i = 0; i < items.length; i++) {
		const item = items[i];

		const rest = [...items.slice(0, i), ...items.slice(i + 1)];
		for (const subperm of permute(rest)) {
			yield [item, ...subperm];
		}
	}
}

/**
 * Generates all boolean arrays of a given size that contain exactly a desired number of `true`s.
 * @param nTotal Size of each boolean array.
 * @param nTrues Number of `true`s in each array.
 * @yields Boolean array of size `nTotal` containing exactly `nTrues` `true`s (the rest are `false`).
 */
export function* combineBoolean(nTotal: number, nTrues: number): Generator<boolean[], void, void> {
	if (nTrues > nTotal) throw new RangeError();

	switch (nTotal) {
		case 1:
			yield [nTrues !== 0];
			return;
		
		case 0:
			yield [];
			return;
	}
	
	if (nTrues <= nTotal - 1) {
		for (const subcombo of combineBoolean(nTotal - 1, nTrues)) {
			yield [false, ...subcombo];
		}
	}

	if (nTrues > 0) {
		for (const subcombo of combineBoolean(nTotal - 1, nTrues - 1)) {
			yield [true, ...subcombo];
		}
	}
}

export function* combineN(nTotal: number, nSelected: number, offset: number=0): Generator<number[], void, void> {
	if (nSelected > nTotal) throw new RangeError();

	switch (nTotal) {
		case 1:
			if (nSelected === 0) {
				yield [];
			} else {
				yield [offset];
			}

			return;
		
		case 0:
			yield [];
			return;
	}
	
	// Skip the current entry
	if (nSelected <= nTotal - 1) {
		for (const subcombo of combineN(nTotal - 1, nSelected, offset + 1)) {
			yield subcombo;
		}
	}

	// Add the current entry
	if (nSelected > 0) {
		for (const subcombo of combineN(nTotal - 1, nSelected - 1, offset + 1)) {
			yield [offset, ...subcombo];
		}
	}
}

export function* combine(items: number[], nSelected: number, i: number=0): Generator<number[], void, void> {
	if (nSelected > items.length) throw new RangeError();

	switch (items.length) {
		case 1:
			if (nSelected === 0) {
				yield [];
			} else {
				yield [items[i]];
			}

			return;
		
		case 0:
			yield [];
			return;
	}
	
	// Skip the current entry
	if (nSelected <= items.length - 1) {
		for (const subcombo of combineN(items.length - 1, nSelected, i + 1)) {
			yield subcombo;
		}
	}

	// Add the current entry
	if (nSelected > 0) {
		for (const subcombo of combineN(items.length - 1, nSelected - 1, i + 1)) {
			yield [items[i], ...subcombo];
		}
	}
}

export function* anyCombineBoolean(nTotal: number) {
	for (let i = 0; i < nTotal; i++) {
		yield* combineBoolean(nTotal, i);
	}
}

export function* anyCombine(items: number[]) {
	for (let i = 0; i < items.length; i++) {
		yield* combine(items, i);
	}
}