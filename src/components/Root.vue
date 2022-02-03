<template>
	<input type="number" v-model="nInputBits" @change="recreateTruthTable" />
	<form @change="updateExpression">
		<input type="checkbox" v-for="(output, index) of truthTable" v-model="truthTable[index]" :key="index" />
	</form>
	<div>{{expression}}</div>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import {findKarnaughGroups, generateExpression} from "../Karnaugh";

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
	},
	
	methods: {
		updateExpression() {
			this.expression = generateExpression(findKarnaughGroups(this.truthTable), this.nInputBits);
		},

		recreateTruthTable() {
			this.truthTable = new Array<boolean>(this.truthTableLength).fill(false);
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