<template>
	<input-table>
		<!-- <input type="number" v-model="nInputBits" @input="refreshTruthTable" /> -->

		<table @change="updateExpression" class="truth-table">
			<thead>
				<tr>
					<td v-for="inputIndex of range(nInputBits)" :key="inputIndex">
						{{String.fromCharCode("A".charCodeAt() + inputIndex)}}
					</td>

					<td>out</td>
				</tr>
			</thead>

			<tbody>
				<tr v-for="(output, index) of truthTable" :key="index">
					<td v-for="inputIndex of range(nInputBits)" :key="inputIndex" :class="['input', {positive: index >> inputIndex & 0b1}]">
						{{index >> inputIndex & 0b1}}
					</td>

					<td>
						<input type="checkbox" v-model="truthTable[index]" />
					</td>
				</tr>
			</tbody>
		</table>
	</input-table>

	<side-panel>
		<output->{{expression}}</output->
		<settings->
			<div>
				<Entry v-model="nInputBits"
						:validate="value => 0 <= value && value <= N_MAX_INPUTS && value % 1 === 0"
						@input="refreshTruthTable" />
				<label>Input variables</label>
			</div>

			<button @click="clearTruthTable">Clear</button>

			<div><input type="checkbox" v-model="usingProductOfSums" @input="updateExpression" /> <label>Compute <i>Product of Sums</i></label></div>
		</settings->
	</side-panel>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {grayOrder} from "../Boolean/boolean-util";
import {findKarnaughGroups, Group} from "../Boolean/Karnaugh";
import Entry from "./Entry.vue";

interface RootData {
	nInputBits: number;
	truthTable: boolean[];
	usingProductOfSums: boolean;
	expression: string;

	readonly N_MAX_INPUTS: number;
}


const generateExpression = (groups: Set<Group>, nInputBits: number, usingProductOfSums: boolean=false) => {
	const parts: number[][] = [];

	for (const group of groups) {
		const grays = group.offset.map(coord => grayOrder[coord]);

		const dependents = interpretGroup(group, grays, nInputBits);
		parts.push(dependents);
	}

	if (!usingProductOfSums) {

		if (parts.length === 0) { // Empty sum
			return "0"
		}

		return parts.map(part => {
			if (part.length === 0) { // Empty product
				return "1";
			}
			return part.map(factor => {
				const letterId = Math.floor(factor / 2);
				const inverted = factor % 2 !== 0;

				return `${String.fromCharCode(letterId + "A".charCodeAt(0))}${inverted ? "′" : ""}`;
			}).join("");
		}).join(" + ");

	} else {

		if (parts.length === 0) { // Empty product
			return "1"
		}

		return parts.map(part => {
			if (part.length === 0) { // Empty sum
				return "0";
			}

			const string = part.map(factor => {
				const letterId = Math.floor(factor / 2);
				const inverted = factor % 2 !== 0;

				return `${String.fromCharCode(letterId + "A".charCodeAt(0))}${inverted ? "" : "′"}`; // Inverted in product of sums
			}).join(" + ");

			return part.length === 1 || parts.length === 1 ? string : `(${string})`;
		}).join("");
	}
};

const interpretGroup = (group: Group, grays: number[], nInputBits: number): number[] => {
	const isEven = nInputBits % 2 === 0; // Used to determine whether an axis only has one variable
	const nDimensions = Math.ceil(nInputBits / 2);

	const dependents = [];

	const A = 0;
	const NOT_A = 1;
	const B = 2;
	const NOT_B = 3;
	const variableOrderForSize2 = [NOT_B, A, B, NOT_A]; // Variable that stays constant in a group which has a size of 2 along a given axis, where the group's offset along the axis is `i`

	for (let dimension = 0; dimension < group.nDimensions; dimension++) {
		const varOffset = dimension * 4; // Number to be added to the `dependents` value to represent other variables (C, D, E, etc)

		const axisHasTwoVariables = isEven || dimension < nDimensions - 1;

		switch (group.size[dimension]) {
			case 0: { // 1: 2 variables along this axis matter
				const gray = grays[dimension];
				dependents.push((gray & 0b1 ? A : NOT_A) + varOffset);
				if (axisHasTwoVariables) {
					dependents.push((gray >> 1 & 0b1 ? B : NOT_B) + varOffset);
				}
				break;
			}

			case 1: // 2: 1 variable along this axis matters
				if (axisHasTwoVariables) {
					dependents.push(variableOrderForSize2[group.offset[dimension]] + varOffset);
				} else {
					continue;
				}
				break;

			case 2: // 4: 0 variables along this axis matter
				continue;
		}
	}

	return dependents;
};

export default defineComponent({
	name: "Root",

	data: () => (<RootData>{
		nInputBits: 2,
		truthTable: [],

		usingProductOfSums: false,

		expression: "",

		N_MAX_INPUTS: 8,
	}),

	computed: {
		truthTableLength() {
			return 2**this.nInputBits;
		},

		nDimensions() {
			return Math.ceil(this.nInputBits / 2);
		},
	},
	
	methods: {
		updateExpression() {
			if (!this.usingProductOfSums) {
				const groups = findKarnaughGroups(this.truthTable);
				this.expression = generateExpression(groups, this.nInputBits);
			} else {
				const groups = findKarnaughGroups(this.truthTable.map(bit => !bit));
				this.expression = generateExpression(groups, this.nInputBits, true);
			}
		},

		repeatTruthTable() {
			const truthTable: boolean[] = [];
			for (let i = 0; i < this.truthTableLength; i++) {
				truthTable[i] = this.truthTable[i % this.truthTable.length];
			}

			this.truthTable = truthTable;
		},

		clearTruthTable() {
			for (let i = 0; i < this.truthTable.length; i++) {
				this.truthTable[i] = false;
			}
			this.updateExpression();
		},

		refreshTruthTable() {
			this.repeatTruthTable();
			this.updateExpression();
		},

		* range(n: number): Generator<number, void, void> {
			for (let i = 0; i < n; i++) {
				yield i;
			}
		},
	},

	components: {
		Entry,
	},

	created() {
		this.truthTable = Array(this.truthTableLength).fill(false);
	},

	mounted() {
		this.updateExpression();
	},
});
</script>

<style lang="scss">
* {
	box-sizing: border-box;
}

body {
	margin: 0;

	font-family: Atkinson Hyperlegible, Overpass, sans-serif;

	// background: repeating-linear-gradient(45deg, #fff, #fea);
}

input,
button {
	font-family: inherit;
}

main {
	width: 100vw;
	height: 100vh;
	display: grid;
	grid-template-columns: 1fr 1fr;
	align-items: center;
	gap: 2em;

	input-table {
		max-height: 100%;
		margin: 2em 0;
		display: block;
		overflow-y: auto;

		direction: rtl;
		* {
			direction: ltr;
		}
	}
}

thead,
th {
	font-weight: 700;
}

.truth-table {
	margin: 2em 0;

	border-collapse: collapse;
	text-align: center;

	> thead {
		position: sticky;
		top: 0;
		background: #fff;
	}

	> tbody .input {
		// background: #ea9;
		color: #358;

		&.positive {
			background: #aee;
		}
	}

	:is(td, th) {
		padding: 0 1em;
	}
}

side-panel {
	display: grid;

	grid-template-rows: 1fr auto 1fr;

	> output- {
		grid-row: 2;
		min-height: 4em;
	}

	> settings- {
		grid-row: 3;
	}
}

output- {
	font-weight: 700;
	font-size: 2em;
		
	display: flex;
	align-items: center;
}

settings- {
	display: flex;
	flex-flow: column;
	align-items: start;
	gap: .5em;
}

settings- {
	label {
		margin-left: .5em;
	}

	input,
	button {
		font-size: 1em;
	}

	input[type="number"] {
		width: 4em;
	}
}
</style>