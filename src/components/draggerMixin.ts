export default {
	data: () => ({
		pointerDown: false,
	}),

	methods: {
		toggleBit(event: PointerEvent, index: number) {
			const input = event.currentTarget as HTMLInputElement;
			input.checked = !input.checked;

			this.truthTable[index] = !this.truthTable[index];
		},

		toggleBitIfPointerdown(event: PointerEvent, index: number) {
			if (!this.pointerDown) return;

			this.toggleBit(event, index);
		},
	},

	mounted() {
		addEventListener("pointerdown", (event: PointerEvent) => {
			if (event.button !== 0) return;
			this.pointerDown = true;
			
			addEventListener("pointerup", (event: PointerEvent) => {
				if (event.button !== 0) return;
				this.pointerDown = false;
			}, {once: true});
		});
	},
};