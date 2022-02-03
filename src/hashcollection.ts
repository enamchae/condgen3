/**
 * Hash function used to compute the hash code of a given key.
 *
 * @callback hashFunction
 * @param {*} key The object used to act as a key.
 */

type HashFunction<T> = (key: T) => bigint;

class HashCollection<T> {
	/**
	 * The hash function used to compute the hash code of a given key.
	 * @type hashFunction
	 */
	#getHash: HashFunction<T>;

	/**
	 * 
	 * @param {hashFunction} hashCodeFunction Hash function used to compute the hash code of a given key.
	 */
	constructor(hashCodeFunction: HashFunction<T>) {
		this.#setHashFunction(hashCodeFunction);
	}

	/**
	 * The hash function used to compute the hash code of a given key.
	 * @type hashFunction
	 */
	get getHash() {
		return this.#getHash;
	}

	#setHashFunction(hashCodeFunction: HashFunction<T>) {
		this.#getHash = hashCodeFunction;
	}
}

class Entry<K, V> {
	key: K;
	value: V;

	constructor(key: K, value: V) {
		this.key = key;
		this.value = value;
	}
}

export class HashMap<K, V> extends HashCollection<K> {
	#hashCodeMap = new Map<bigint, Entry<K, V>>();

	get(key: K): V {
		const hashCode = this.getHash(key);
		return this.#hashCodeMap.get(hashCode).value;
	}

	set(key: K, value: V) {
		const hashCode = this.getHash(key);

		const mapValue = new Entry(key, value);
		this.#hashCodeMap.set(hashCode, mapValue);
		return this;
	}

	delete(key: K) {
		const hashCode = this.getHash(key);
		return this.#hashCodeMap.delete(hashCode);
	}

	has(key: K) {
		const hashCode = this.getHash(key);
		return this.#hashCodeMap.has(hashCode);
	}

	clear() {
		this.#hashCodeMap.clear();
		return this;
	}

	forEach(callback: (key: K, value: V, map: HashMap<K, V>) => void, thisArg: any) {
		for (const [key, value] of this.entries()) {
			callback.apply(thisArg, [key, value, this]);
		}
		return this;
	}

	[Symbol.iterator]() {
		return this.entries();
	}

	* entries() {
		for (const {key, value} of this.#hashCodeMap.values()) {
			yield [key, value];
		}
	}

	* keys() {
		for (const entry of this.#hashCodeMap.values()) {
			yield entry.key;
		}
	}

	* values() {
		for (const entry of this.#hashCodeMap.values()) {
			yield entry.value;
		}
	}
}

export class HashSet<T> extends HashCollection<T> {
	#hashCodeMap = new Map<bigint, T>();

	/**
	 * Hash the object, and then add it to the set.
	 * @param key 
	 * @returns 
	 */
	add(key: T) {
		const hashCode = this.getHash(key);
		this.#hashCodeMap.set(hashCode, key);
		return this;
	}

	delete(key: T) {
		const hashCode = this.getHash(key);
		return this.#hashCodeMap.delete(hashCode);
	}

	has(key: T) {
		const hashCode = this.getHash(key);
		return this.#hashCodeMap.has(hashCode);
	}

	clear() {
		this.#hashCodeMap.clear();
		return this;
	}

	forEach(callback: (key: T, value: T, map: HashSet<T>) => void, thisArg: any) {
		for (const [key, value] of this.entries()) {
			callback.apply(thisArg, [key, value, this]);
		}
		return this;
	}

	[Symbol.iterator]() {
		return this.values();
	}

	* entries() {
		for (const value of this.#hashCodeMap.values()) {
			yield [value, value];
		}
	}

	values() {
		return this.#hashCodeMap.values();
	}

	get size() {
		return this.#hashCodeMap.size;
	}
}
