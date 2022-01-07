(() => {
	// Input
	const truthTable = [false, true, true, true];
	const nInputBits = 2;
	
	const toBits = (n: number) => [...new Array(nInputBits)].map((_, i) => Boolean(n >>> i & 0b1)); // Smallest bit is first input
	
	const OR = Symbol("or");
	const AND = Symbol("and");
	const VAR = Symbol("var");
	const NOT = Symbol("not");
	
	const Var = (id: number) => ({
		type: VAR,
		id,
	
		get hashCode() {
			return this.id;
		},

		toString() {
			return String.fromCharCode(id + "A".charCodeAt(0));
		},
	});
	
	const Not = child => ({
		type: NOT,
		child,
	
		get hashCode() {
			// currently only supports Var
			return -1 * this.child.hashCode - 1;
		},

		toString() {
			return `!${child}`;
		},
	});

	const And = (...children) => ({
		type: AND,
		children,

		toString() {
			return this.children.join(" && ");
		},
	});
	
	const Or = (...children) => {
		const likeTermsMap: Map<number, Set<number>> = new Map();
	
		children.forEach((child, i) => {
			console.log(child);

			switch (child.type) {
				case AND: {
					for (const subchild of child.children) {
						// likeTermsMap.set(subchild.hashCode, i);
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
					throw new TypeError("not supported");
			}
		});
	
		return {
			type: OR,
			children,
			likeTermsMap,

			toString() {
				return this.children.join(" || ");
			},

			simplify() {
				for (const [key, indexes] of this.likeTermsMap) {
					if (indexes.size < 2) continue;

					// Factor out the like term
					const newExpr = Or(
						And(
							getExpFromHashCode(key), // todo implement
							Or(...this.children.filter((_, i) => indexes.has(i)).map(expr => expr.divide(getExpFromHashCode(key)))),
						),
						...this.children.filter((_, i) => !indexes.has(i)), // Unaffected terms
					);
				}
			},
		};
	};
	
	const initialExpr = Or(...truthTable.reduce((cumArray, truth, i) => {
		if (!truth) return cumArray;

		return [...cumArray, And(...toBits(i).map((bit, i) => {
			return bit
					? Var(i)
					: Not(Var(i));
		}))];
	}, []));

	console.log(initialExpr);

	// console.log(Or(Var(0), Var(1), Var(0), Not(Var(0))));

	document.body.textContent = initialExpr.toString();
})();