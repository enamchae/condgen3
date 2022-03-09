<template>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -10 225 220"
			:class="{disabled}">
		<rect x="40" y="40" width="160" height="160"
				stroke="currentcolor"
				fill="#0000" />

		<g transform="translate(60, 20)" class="axis-label" id="horizontal-axis">
			<text x="0"><tspan class="not">A′B′</tspan></text>
			<text x="40">A<tspan class="not">B′</tspan></text>
			<text x="80">AB</text>
			<text x="120"><tspan class="not">A′</tspan>B</text>
		</g>

		<g transform="translate(20, 60)" class="axis-label" id="vertical-axis">
			<text y="0"><tspan class="not">C′D′</tspan></text>
			<text y="40">C<tspan class="not">D′</tspan></text>
			<text y="80">CD</text>
			<text y="120"><tspan class="not">C′</tspan>D</text>
		</g>

		<g transform="translate(60, 60)" id="map-data">
			<g v-for="(bit, index) of take(truthTable, 16)" :key="index"
					:transform="`translate(${bitOffset(index)[0] * 40}, ${bitOffset(index)[1] * 40})`"
					:class="{not: !bit}"
					@pointerdown="toggleBit($event, index)">
				<rect transform="translate(-20, -20)" width="40" height="40" fill="#0000" />
				<text>{{bit ? "1" : "0"}}</text>
			</g>
		</g>
	</svg>
</template>


<script lang="ts">
import {defineComponent} from "vue";
import {grayOrder} from "../Boolean/boolean-util";
import {take} from "../util/iter";

export default defineComponent({
	name: "KarnaughMap",

	props: {
		truthTable: Array,
		nInputBits: Number,
	},

	data: () => ({
	}),

	methods: {
		bitOffset(index: number) {
			const x = grayOrder.indexOf(index & 0b11);
			const y = grayOrder.indexOf(index >>> 2 & 0b11);
			return [x, y];
		},

		toggleBit(event: PointerEvent, index: number) {
			if (event.button !== 0) return;
			this.truthTable[index] = !this.truthTable[index];
		},

		take,
	},

	computed: {
		disabled() {
			return this.nInputBits > 4;
		},
	},
});
</script>

<style lang="scss" scoped>
svg {
	--col-not: #0000003f;

	width: 225px;
	height: 220px;
	color: var(--col-not);

	text {
		text-anchor: middle;
		font-size: 1em;
	}

	g.axis-label {
		font-weight: 800;
		font-size: 1.5em;

		tspan.not {
			fill: var(--col-not);
			font-size: 0.666667em;
		}

		&#vertical-axis > text {
			text-anchor: end;
		}
	}

	g#map-data {
		user-select: none;
		cursor: crosshair;

		g.not {
			rect {
				fill: #0000000f;
			}

			text {
				fill: var(--col-not);
			}
		}
	}

	&.disabled {
		opacity: 0.3;
		pointer-events: none;
	}
}
</style>