export const reduce = <T, K>(iterable: Iterable<T>, fn: (accumulated: K, value: T) => K, accumulated: K): K => {
	for (const value of iterable) {
		accumulated = fn(accumulated, value);
	}
	return accumulated;
};

export const range = function* (n: number): Generator<number, void, void> {
	for (let i = 0; i < n; i++) {
		yield i;
	}
};

export const take = function* <T>(iterable: Iterator<T>, count: number) {
	const iterator = iterable[Symbol.iterator]();

	let result = iterator.next();
	let i = 0;
	while (!result.done && i < count) {
		yield result.value;
		result = iterator.next();
		i++;
	}
}