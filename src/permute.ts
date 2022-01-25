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