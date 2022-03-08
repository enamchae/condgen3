export const reduce = <T, K>(iterable: Iterable<T>, fn: (accumulated: K, value: T) => K, accumulated: K): K => {
	for (const value of iterable) {
		accumulated = fn(accumulated, value);
	}
	return accumulated;
};