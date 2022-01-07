(() => {
	// Input
	const truthTable = [false, true, true, true];
	const nInputBits = 2;
	
	const toBits = (n: number) => [...new Array(nInputBits)].map((_, i) => Boolean(n >>> i & 0b1)); // Smallest bit is first input
	
	const OR = Symbol("or");
	const AND = Symbol("and");
	const VAR = Symbol("var");
	const NOT = Symbol("not");

	class Node {
		type: Symbol;

		constructor(type: Symbol) {
			this.type = type;
		}

		eq(target: Node): boolean {
			return this.hashCode === target.hashCode;
		}

		isInverse(target: Node): boolean {
			throw new TypeError("not implemented");
		}

		get hashCode(): number {
			// throw new TypeError("not implemented");
			console.warn("Not implemented");
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

		isInverse(target: Node): boolean {

		}

		toString() {
			return String.fromCharCode(this.id + "A".charCodeAt(0));
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
			const newChildren = [];
			let found = false;

			for (const child of this.children) {
				if (child.eq(node) && !found) {
					found = true;
				} else {
					newChildren.push(child);
				}
			}

			return new And(...newChildren);
		}
	}

	class Or extends Node {
		children: Node[];

		likeTermsMap: Map<number, Set<number>>;

		constructor(...children: Node[]) {
			super(OR);

			this.children = children;

			this.likeTermsMap = new Map();
		
			children.forEach((child, i) => {
				switch (child.type) {
					case AND: {
						for (const subchild of (child as And).children) {
							const indexes = this.likeTermsMap.get(subchild.hashCode) ?? new Set();
							indexes.add(i);
							this.likeTermsMap.set(subchild.hashCode, indexes);
						}
						break;
					}
		
					case NOT:
					case VAR: {
						const indexes = this.likeTermsMap.get(child.hashCode) ?? new Set();
						indexes.add(i);
						this.likeTermsMap.set(child.hashCode, indexes);
						break;
					}
		
					default:
						throw new TypeError("not supported");
				}
			});
		}

		toString() {
			return this.children.map(expr => `${expr}`).join(" || ");
		}

		simplify() {
			for (const [key, indexes] of this.likeTermsMap) {
				if (indexes.size < 2) continue;

				// Factor out the like term
				const newExpr = new Or(
					new And(
						getExpFromHashCode(key), // todo implement
						new Or(...this.children.filter((_, i) => indexes.has(i)).map(expr => (expr as And).divide(getExpFromHashCode(key)))),
					),
					...this.children.filter((_, i) => !indexes.has(i)), // Unaffected terms
				);

				return newExpr;
			}
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

	console.log(initialExpr.simplify());

	// console.log(Or(Var(0), Var(1), Var(0), Not(Var(0))));

	document.body.textContent = initialExpr.simplify().toString();
})();