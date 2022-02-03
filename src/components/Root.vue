<template>
	<inputs->
		<input type="number" v-model="nInputBits" @input="refreshTruthTable" />

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
	</inputs->

	<div>{{expression}}</div>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {findKarnaughGroups, generateExpression} from "../Boolean/Karnaugh";

interface RootData {
	nInputBits: number;
	truthTable: boolean[];
	expression: string;
}

export default defineComponent({
	name: "Root",

	data: () => (<RootData>{
		nInputBits: 2,
		truthTable: [],

		expression: "",
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
			this.expression = generateExpression(findKarnaughGroups(this.truthTable), this.nInputBits);
		},

		recreateTruthTable() {
			this.truthTable = new Array<boolean>(this.truthTableLength).fill(false);
		},

		refreshTruthTable() {
			this.recreateTruthTable();
			this.updateExpression();
		},

		* range(n: number): Generator<number, void, void> {
			for (let i = 0; i < n; i++) {
				yield i;
			}
		},
	},

	created() {
		this.recreateTruthTable();
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
}

main {
	width: 100vw;
	height: 100vh;
	display: grid;
	grid-template-columns: 1fr 1fr;
	align-items: center;
	gap: 2em;

	inputs- {
		max-height: 100%;
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
</style>