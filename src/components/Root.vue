<template>
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
	
	methods: {
		updateExpression() {
			this.expression = generateExpression(findKarnaughGroups(this.truthTable));
		},
	},

	created() {
		this.truthTable = new Array<boolean>(2**this.nInputBits).fill(false);
	},
});
</script>