<template>
	<expression->
		<!-- Empty sum or product -->
		<span class="part empty" v-if="groups.size === 0">{{usingProductOfSums ? "1" : "0"}}</span>

		<template v-else v-for="(part, index) of parts" :key="index">
			<ExpressionPart :part="part"
					:usingProductOfSums="usingProductOfSums"
					:text="partText(part)"
					@focusGroup="group => $emit('focusGroup', group)" />

			<span class="separator" v-if="!usingProductOfSums && index < parts.length - 1"> + </span>
		</template>
	</expression->
</template>

<script lang="tsx">
import {defineComponent, PropType} from "vue";
import {Group} from "../Boolean/Karnaugh";
import {grayOrder} from "../Boolean/boolean-util";
import ExpressionPart from "./ExpressionPart.vue";
import Part from "./Part";

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

		parts: [] as Part[],
	}),

	methods: {

		/* generateExpression() {
			this.generateParts();

			if (!this.usingProductOfSums) {

				if (this.parts.length === 0) { // Empty sum
					return "0"
				}

				return this.parts.map(part => {
					if (part.size === 0) { // Empty product
						return "1";
					}
					return part.map(factor => {
						const letterId = Math.floor(factor / 2);
						const inverted = factor % 2 !== 0;

						return `${String.fromCharCode(letterId + "A".charCodeAt(0))}${inverted ? "′" : ""}`;
					}).join("");
				}).join(" + ");

			} else {

				if (this.parts.length === 0) { // Empty product
					return "1"
				}

				return this.parts.map(part => {
					if (part.size === 0) { // Empty sum
						return "0";
					}

					const string = part.map(factor => {
						const letterId = Math.floor(factor / 2);
						const inverted = factor % 2 !== 0;

						return `${String.fromCharCode(letterId + "A".charCodeAt(0))}${inverted ? "" : "′"}`; // Inverted in product of sums
					}).join(" + ");

					return part.length === 1 || this.parts.length === 1 ? string : `(${string})`;
				}).join("");
			}
		}, */

		partText(part: Part) {
			if (!this.usingProductOfSums) {

				if (part.size === 0) { // Empty product
					return "1";
				}
				return part.dependents.map(factor => {
					const letterId = Math.floor(factor / 2);
					const inverted = factor % 2 !== 0;

					return `${String.fromCharCode(letterId + "A".charCodeAt(0))}${inverted ? "′" : ""}`;
				}).join("");

			} else {
				
				if (part.size === 0) { // Empty sum
					return "0";
				}

				const string = part.dependents.map(factor => {
					const letterId = Math.floor(factor / 2);
					const inverted = factor % 2 !== 0;

					return `${String.fromCharCode(letterId + "A".charCodeAt(0))}${inverted ? "" : "′"}`; // Inverted in product of sums
				}).join(" + ");

				return part.dependents.length === 1 || this.parts.length === 1 ? string : `(${string})`;

			}
		},

		generateParts() {
			const parts: Part[] = [];

			for (const group of this.groups) {
				const grays = group.offset.map(coord => grayOrder[coord]);

				const dependents = interpretGroup(group, grays, this.nInputBits);
				parts.push(new Part(group, dependents));
			}

			this.parts = parts;
		},
	},

	watch: {
		groups() {
			this.generateParts();
		},
		nInputBits() {
			this.generateParts();
		},
		usingProductOfSums() {
			this.generateParts();
		},
	},

	components: {
		ExpressionPart,
	},
});
</script>

<style lang="scss" scoped>
expression- {
	cursor: default;

	.part:not(.empty) {
		cursor: help;
	}

	.part.empty {
		color: #000000bf;
	}

	:deep(.separator) {
		color: #0000007f;
	}
}
</style>