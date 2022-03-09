<template>
	<output->{{expression}}</output->
</template>


<script lang="ts">
import {defineComponent, PropType} from "vue";
import {Group} from "../Boolean/Karnaugh";
import {grayOrder} from "../Boolean/boolean-util";


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
	name: "Expression",

	props: {
		groups: {
			type: Set as PropType<Set<Group>>,
		},
		nInputBits: {
			type: Number as PropType<number>,
		},
		usingProductOfSums: {
			type: Boolean as PropType<boolean>,
		},
	},

	data: () => ({
		expression: "",
	}),

	methods: {
		generateExpression() {
			if (!this.usingProductOfSums) {
				this.expression = generateExpression(this.groups, this.nInputBits);
			} else {
				this.expression = generateExpression(this.groups, this.nInputBits, true);
			}
		}
	},

	watch: {
		groups() {
			this.generateExpression();
		},
	},
});
</script>

<style lang="scss" scoped>
</style>