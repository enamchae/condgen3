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
		</settings->
	</side-panel>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {findKarnaughGroups, generateExpression} from "../Boolean/Karnaugh";
import Entry from "./Entry.vue";

interface RootData {
	nInputBits: number;
	truthTable: boolean[];
	expression: string;

	readonly N_MAX_INPUTS: number;
}

export default defineComponent({
	name: "Root",

	data: () => (<RootData>{
		nInputBits: 2,
		truthTable: [],

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
			const groups = findKarnaughGroups(this.truthTable);
			this.expression = generateExpression(groups, this.nInputBits);
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

	input {
		width: 4em;
	}
}
</style>