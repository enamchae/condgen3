<template>
	<input type="number" @input="onInput" @change.stop="onChange" @focus="onFocus" @blur="onBlur" :class="{invalid: !proposedValueIsValid}" />
</template>

<script>
import {defineComponent} from "vue";
import converterMixin from "./converterMixin.js";

const acceptAlways = () => true;

export default defineComponent({
	name: "entry",

	mixins: [converterMixin],

	props: {
		validate: {
			type: Function,
			default: acceptAlways,
		},
	},

	data() {
		return {
			proposedValueIsValid: true,
			isFocused: false,
		};
	},

	methods: {
		onInput(event) {
			const proposedValue = this.convertOut(Number(this.$el.value));

			this.proposedValueIsValid = this.validate(proposedValue);
			if (this.proposedValueIsValid) {
				this.$emit("update:modelValue", proposedValue);
			} else {
				event.stopPropagation();
			}
		},

		onChange() {
			this.updateDisplayValue();
			this.proposedValueIsValid = true;
		},

		onFocus() {
			this.isFocused = true;
		},

		onBlur() {
			this.isFocused = false;
		},
	},
	
	watch: {
		value() {
			if (this.isFocused) return;
			this.updateDisplayValue();
		},
	},
});
</script>