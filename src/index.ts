/* import {Var, Not, And, Or} from "./Algebra";

(() => {

	// Input
	const truthTable = [false, true, true, true];
	const nInputBits = 2;
	
	const toBits = (n: number) => [...new Array(nInputBits)].map((_, i) => Boolean(n >>> i & 0b1)); // Smallest bit is first input
	
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
})(); */
import {createApp} from "vue";
import Root from "./components/Root.vue";

// import {buildKarnaughMap, buildKarnaughPrefix, findKarnaughGroups, generateExpression} from "./Boolean/Karnaugh";

(() => {
	/* const truthTable = [true];

	const map = buildKarnaughMap(truthTable);
	const prefix = buildKarnaughPrefix(map);

	console.log(map, prefix);

	const groups = findKarnaughGroups(truthTable);

	console.log([...groups].map(([coords, set]) => [coords, [...set]]));

	// document.body.textContent = generateExpression(groups);
	console.log(generateExpression(groups, 1)); */

	const app = createApp(Root);
	app.mount("main");
})();