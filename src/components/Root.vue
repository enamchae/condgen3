<template>
	<input-table>
		<!-- <input type="number" v-model="nInputBits" @input="refreshTruthTable" /> -->

		<table class="truth-table">
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

					<td @pointerenter="toggleBitIfPointerdown($event, index)">
						<input type="checkbox"
								v-model="truthTable[index]"
								@click.prevent
								@pointerdown="toggleBit($event, index)" />
					</td>
				</tr>
			</tbody>
		</table>
	</input-table>

	<side-panel>
		<KarnaughMap :truthTable="truthTable"
				:nInputBits="nInputBits"
				:groups="groups"
				:focusedGroup="focusedGroup" />

		<output->
			<Expression :groups="groups"
					:nInputBits="nInputBits"
					:usingProductOfSums="usingProductOfSums"
					@focusGroup="setFocusedGroup" />
		</output->

		<settings->
			<div>
				<Entry v-model="nInputBits"
						:validate="value => 0 <= value && value <= N_MAX_INPUTS && value % 1 === 0"
						@input="refreshTruthTable" />
				<label>Input variables</label>
			</div>

			<div>
				<button @click="clearTruthTable(false)">All 0s</button>
				<button @click="clearTruthTable(true)">All 1s</button>
			</div>

			<div>
				<input type="checkbox" v-model="usingProductOfSums" id="compute-product-input" />
				<label for="compute-product-input">Compute <i>Product of Sums</i></label>
				</div>
		</settings->
	</side-panel>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {findKarnaughGroups, Group} from "../Boolean/Karnaugh";
import {range} from "../util/iter";
import Entry from "./Entry.vue";
import KarnaughMap from "./KarnaughMap.vue";
import Expression from "./Expression.vue";

interface RootData {
	nInputBits: number;
	truthTable: boolean[];
	usingProductOfSums: boolean;

	pointerDown: boolean;
	groups: Set<Group>;

	focusedGroup: Group;

	readonly N_MAX_INPUTS: number;
}

export default defineComponent({
	name: "Root",

	data: () => (<RootData>{
		nInputBits: 2,
		truthTable: [],

		usingProductOfSums: false,

		pointerDown: false,

		groups: null,
		focusedGroup: null,

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
		updateGroups() {
			if (!this.usingProductOfSums) {
				this.groups = findKarnaughGroups(this.truthTable);
			} else {
				this.groups = findKarnaughGroups(this.truthTable.map(bit => !bit));
			}
		},

		repeatTruthTable() {
			const truthTable: boolean[] = [];
			for (let i = 0; i < this.truthTableLength; i++) {
				truthTable[i] = this.truthTable[i % this.truthTable.length];
			}

			this.truthTable = truthTable;
		},

		clearTruthTable(toTrue: boolean=true) {
			for (let i = 0; i < this.truthTable.length; i++) {
				this.truthTable[i] = toTrue;
			}
		},

		refreshTruthTable() {
			this.repeatTruthTable();
		},

		toggleBit(event: PointerEvent, index: number) {
			const input = event.currentTarget as HTMLInputElement;
			input.checked = !input.checked;

			this.truthTable[index] = !this.truthTable[index];
		},

		toggleBitIfPointerdown(event: PointerEvent, index: number) {
			if (!this.pointerDown) return;

			this.toggleBit(event, index);
		},

		setFocusedGroup(group: Group) {
			this.focusedGroup = group;
		},

		range,
	},

	watch: {
		truthTable: {
			deep: true,
			handler() {
				this.updateGroups();
			},
		},

		usingProductOfSums() {
			this.updateGroups();
		},
	},

	components: {
		Entry,
		KarnaughMap,
		Expression,
	},

	created() {
		this.truthTable = Array(this.truthTableLength).fill(false);
	},

	mounted() {
		this.updateGroups();

		addEventListener("pointerdown", (event: PointerEvent) => {
			if (event.button !== 0) return;
			this.pointerDown = true;
			
			addEventListener("pointerup", (event: PointerEvent) => {
				if (event.button !== 0) return;
				this.pointerDown = false;
			}, {once: true});
		});
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

	user-select: none;

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
	flex-flow: wrap;
}

settings- {
	display: flex;
	flex-flow: column;
	align-items: start;
	gap: .5em;


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