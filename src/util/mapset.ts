/**
 * Wraps a `Map<K, Set<V>>`.
 */
export default class MapSet<K, V> {
	private readonly map = new Map<K, Set<V>>();

	#size = 0;
	get size() { return this.#size; }

	add(key: K, value: V) {
		const set = this.map.get(key) ?? new Set<V>();

		this.#size -= set.size;
		set.add(value);
		this.#size += set.size;
	}

	deleteSet(key: K) {
		this.#size -= this.map.get(key)?.size ?? 0;
		this.map.delete(key);
	}

	setSet(key: K, set: Set<V>) {
		this.#size -= this.map.get(key)?.size ?? 0;
		this.map.set(key, set);
		this.#size += set.size;
	}

	* [Symbol.iterator]() {
		for (const [key, values] of this.map) {
			for (const value of values) {
				yield [key, value];
			}
		}
	}

	* sets() {
		yield* this.map;
	}
}