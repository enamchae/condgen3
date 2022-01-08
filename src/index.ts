(() => {
	const logged = value => {
		console.log(value);
		return value;
	};

	// Input
	const truthTable = [false, true, true, true];
	const nInputBits = 2;
	
	const toBits = (n: number) => [...new Array(nInputBits)].map((_, i) => Boolean(n >>> i & 0b1)); // Smallest bit is first input
	
	const OR = Symbol("or");
	const AND = Symbol("and");
	const VAR = Symbol("var");
	const CONST = Symbol("const");
	const NOT = Symbol("not");

	class Node {
		type: symbol;

		constructor(type: symbol) {
			this.type = type;
		}

		eq(node: Node): boolean {
			return this.hashCode === node.hashCode;
		}

		isInverse(node: Node): boolean {
			throw new TypeError("not implemented");
		}

		simplify(): Node {
			console.warn(`not implemented: tried to simplify ${String(this.type)}`);
			return this;
		}

		get hashCode(): number {
			// throw new TypeError("not implemented");
			console.warn(`not implemented: tried to get hash of ${String(this.type)}`);
			return -Infinity;
		}
	}

	class Var extends Node {
		id: number;

		constructor(id: number) {
			super(VAR);

			this.id = id;
		}
	
		get hashCode() {
			return this.id;
		}

/* 		isInverse(node: Node): boolean {

		} */

		simplify(): Node {
			return this;
		}

		toString() {
			return String.fromCharCode(this.id + "A".charCodeAt(0));
		}
	}

	class Const extends Node {
		value: boolean;

		constructor(value: boolean) {
			super(CONST);

			this.value = value;
		}

		toString() {
			return this.value ? "1" : "0";
		}

		simplify() {
			return this;
		}
	}

	class Not extends Node {
		child: Node;

		constructor(child: Node) {
			super(NOT);

			this.child = child;
		}
	
		get hashCode() {
			return -1 * this.child.hashCode - 1;
		}

		toString() {
			return `!${this.child}`;
		}

		simplify(deep=true) {
			const currentChild = deep
					? this.child.simplify()
					: this.child;

			// Constant
			if (currentChild.type === CONST) {
				return new Const((currentChild as Const).value);
			}

			// Double negation
			if (currentChild.type === NOT) {
				return (currentChild as Not).child;
			}

			// DeMorgan's
			// ...

			// XOR
			// ...

			return this;
		}
	}

	class And extends Node {
		children: Node[];

		constructor(...children: Node[]) {
			super(AND);

			this.children = children;
		}

		toString() {
			return this.children.map(expr => `(${expr})`).join(" && ");
		}

		divide(node: Node) {
			let found = false;

			return new And(...this.children.filter(child => {
				if (child.eq(node) && !found) {
					found = true;
					return false;
				}
				return true;
			}));
		}

		simplify(deep=true): Node {
			// Null (Empty product)
			if (this.children.length === 0) {
				return new Const(true);
			}


			const startingChildren = deep
					? this.children.map(node => node.simplify())
					: this.children;

			// Unary
			if (startingChildren.length === 1) {
				return startingChildren[0];
			}

			let currentExpr: And = new And(...startingChildren);

			// Identity and annulment
			{
				const newChildren = [];
				for (const child of currentExpr.children) {
					if (child.type === CONST) {
						if ((child as Const).value === true) continue;

						return new Const(false);
					}
					newChildren.push(child);
				}
				
				if (newChildren.length === 0) {
					return new Const(true);
				}

				if (newChildren.length === 1) {
					return newChildren[0];
				}

				currentExpr = new And(...newChildren);
			}

			// ...

			return currentExpr;
		}
	}

	class Or extends Node {
		children: Node[];

		constructor(...children: Node[]) {
			super(OR);

			this.children = children;
		}

		toString() {
			return this.children.map(expr => `${expr}`).join(" || ");
		}

		likeTermsMap(): Map<number, Set<number>> {
			const likeTermsMap = new Map();
		
			this.children.forEach((child, i) => {
				switch (child.type) {
					case AND: {
						for (const subchild of (child as And).children) {
							const indexes = likeTermsMap.get(subchild.hashCode) ?? new Set();
							indexes.add(i);
							likeTermsMap.set(subchild.hashCode, indexes);
						}
						break;
					}
		
					case NOT:
					case VAR: {
						const indexes = likeTermsMap.get(child.hashCode) ?? new Set();
						indexes.add(i);
						likeTermsMap.set(child.hashCode, indexes);
						break;
					}
		
					default:
						console.warn(`not supported: tried to add ${String(child.type)} to like terms map`);
				}
			});

			return likeTermsMap;
		}

		simplify(deep=true) {
			// Null (Empty sum)
			if (this.children.length === 0) {
				return new Const(false);
			}


			const startingChildren = deep
					? this.children.map(node => node.simplify())
					: this.children;

			// Unary
			if (startingChildren.length === 1) {
				return startingChildren[0];
			}

			let currentExpr: Or = new Or(...startingChildren);

			// Complement
			{
				// Currently only works for Vars and Not(Var)s
				const unmatchedInversePairs: Map<number, number> = new Map();
				const matchedInverseCounts: Map<number, number> = new Map();
				/* for (const [key, indexes] of this.likeTermsMap) {
					if (new )

				} */
				// Count the number of inverses
				for (const child of currentExpr.children) {
					const hash = child.hashCode;
					const inverseHash = new Not(child).hashCode;

					if (unmatchedInversePairs.get(inverseHash) ?? 0 > 0) {
						matchedInverseCounts.set(hash, (matchedInverseCounts.get(hash) ?? 0) + 1);
						matchedInverseCounts.set(inverseHash, (matchedInverseCounts.get(inverseHash) ?? 0) + 1);

						unmatchedInversePairs.set(inverseHash, unmatchedInversePairs.get(inverseHash) - 1);
					} else {
						unmatchedInversePairs.set(hash, (unmatchedInversePairs.get(hash) ?? 0) + 1);
					}
				}

				// Filter all counted nodes
				const newChildren = currentExpr.children.filter(child => {
					const hash = child.hashCode;

					if ((matchedInverseCounts.get(hash) ?? 0) === 0) return true;

					matchedInverseCounts.set(hash, matchedInverseCounts.get(hash) - 1);
					return false;
				});

				if (newChildren.length === 0) {
					return new Const(true);
				}

				currentExpr = new Or(...newChildren);
			}

			// Factoring
			for (const [key, indexes] of currentExpr.likeTermsMap()) {
				if (indexes.size < 2) continue;

				// Factor out the like term
				const newExpr = new Or(
					new And(
						getExpFromHashCode(key),
						new Or(...currentExpr.children
								.filter((_, i) => indexes.has(i))
								.map(expr => (expr as And).divide(getExpFromHashCode(key))) // TODO watch out, might not be And in general
						),
					),
					...currentExpr.children.filter((_, i) => !indexes.has(i)), // Unaffected terms
				).simplify();

				return newExpr;
			}

			// Redundant literal
			// ...

			// ...
			
			return currentExpr;
		}
	}

	// temp; only works on vars so far
	const getExpFromHashCode = (hashCode: number) =>
			hashCode >= 0
					? new Var(hashCode)
					: new Not(new Var(-hashCode - 1));
	
	const initialExpr = new Or(...truthTable.reduce((cumArray, truth, i) => {
		if (!truth) return cumArray;

		return [...cumArray, new And(...toBits(i).map((bit, i) => {
			return bit
					? new Var(i)
					: new Not(new Var(i));
		}))];
	}, []));

	console.log(initialExpr);

	console.log("SIMPLIFYING!!!");
	const simplified = initialExpr.simplify();
	console.log("simplified: ", simplified);

	// console.log(Or(Var(0), Var(1), Var(0), Not(Var(0))));

	document.body.textContent = simplified.toString();
})();