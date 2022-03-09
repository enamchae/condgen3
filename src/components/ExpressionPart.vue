<template>
	<span class="part" @pointerenter="focusGroup" @pointerleave="blurGroup">{{text}}</span>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import Part from "./Part";

export default defineComponent({
	name: "ExpressionPart",

	props: {
		part: Part,
		usingProductOfSums: Number,
		text: String,
	},

	methods: {
		focusGroup() {
			this.$emit("focusGroup", this.part.group);
		},

		blurGroup() {
			this.$emit("focusGroup", null);
		},
	},
});
</script>

<style lang="scss" scoped>
</style>