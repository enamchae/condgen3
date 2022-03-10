<template>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 -10 225 220"
			:class="{disabled}">

		<g transform="translate(60, 20)" class="axis-label" id="horizontal-axis">
			<text x="0"><tspan class="not">A′B′</tspan></text>
			<text :x="CELL_SIZE">A<tspan class="not">B′</tspan></text>
			<text :x="CELL_SIZE * 2">AB</text>
			<text :x="CELL_SIZE * 3"><tspan class="not">A′</tspan>B</text>
		</g>

		<g transform="translate(20, 60)" class="axis-label" id="vertical-axis">
			<text y="0"><tspan class="not">C′D′</tspan></text>
			<text :y="CELL_SIZE">C<tspan class="not">D′</tspan></text>
			<text :y="CELL_SIZE * 2">CD</text>
			<text :y="CELL_SIZE * 3"><tspan class="not">C′</tspan>D</text>
		</g>

		<g transform="translate(40, 40)" id="map">
			<rect width="160" height="160"
					stroke="currentcolor"
					fill="none" />

			<g id="map-groups" mask="url(#groups-mask)" v-if="!disabled">
				<g :class="['group', {unfocused: !groupIsFocused(group)}]" v-for="(group, index) of groups" :key="index">
					<g v-for="(combo, index2) of wrappingCombos(group)" :key="index2">
						<rect :x="((group.offset[0] ?? 0) - (combo[0] ? 4 : 0)) * CELL_SIZE"
								:y="((group.offset[1] ?? 0) - (combo[1] ? 4 : 0)) * CELL_SIZE"
								:width="2**(group.size[0] ?? 0) * CELL_SIZE"
								:height="2**(group.size[1] ?? 0) * CELL_SIZE"
								fill="none"
								:stroke="groupColor(group)"
								stroke-width="4" />
						<rect :x="((group.offset[0] ?? 0) - (combo[0] ? 4 : 0)) * CELL_SIZE + 8"
								:y="((group.offset[1] ?? 0) - (combo[1] ? 4 : 0)) * CELL_SIZE + 8"
								:width="2**(group.size[0] ?? 0) * CELL_SIZE - 16"
								:height="2**(group.size[1] ?? 0) * CELL_SIZE - 16"
								:fill="groupColor(group, 0.375)" />
					</g>
				</g>

				<mask id="groups-mask">
					<rect x="-2"
							y="-2"
							:width="2**Math.min(nInputBits, 2) * CELL_SIZE + 4"
							:height="2**Math.max(0, Math.min(nInputBits - 2, 2)) * CELL_SIZE + 4"
							fill="#fff" />
				</mask>
			</g>

			<g id="map-data" transform="translate(20, 20)">
				<g v-for="(bit, index) of take(truthTable, 16)" :key="index"
						:transform="`translate(${bitOffset(index)[0] * CELL_SIZE}, ${bitOffset(index)[1] * CELL_SIZE})`"
						:class="{not: !bit}"
						@pointerdown="toggleBitIfLmb($event, index)"
						@pointerenter="toggleBitIfPointerdown($event, index)">
					<rect transform="translate(-20, -20)" :width="CELL_SIZE" :height="CELL_SIZE" fill="#0000" />
					<text>{{bit ? "1" : "0"}}</text>
				</g>
			</g>
		</g>
	</svg>
</template>


<script lang="ts">
import {defineComponent, PropType} from "vue";
import {Group} from "../Boolean/Karnaugh";
import {grayOrder} from "../Boolean/boolean-util";
import {take} from "../util/iter";
import {anyCombineBoolean} from "../Boolean/permute";
import {groupColor} from "./util";
import draggerMixin from "./draggerMixin";

interface KarnaughMapData {
	readonly CELL_SIZE: number;
}

export default defineComponent({
	name: "KarnaughMap",
	
	mixins: [draggerMixin],

	props: {
		groups: {
			type: Set as PropType<Set<Group>>,
		},
		truthTable: {
			type: Array as PropType<boolean[]>,
		},
		nInputBits: Number,
		focusedGroup: Group,
	},

	data: () => (<KarnaughMapData>{
		CELL_SIZE: 40,
	}),

	methods: {
		bitOffset(index: number) {
			const x = grayOrder.indexOf(index & 0b11);
			const y = grayOrder.indexOf(index >>> 2 & 0b11);
			return [x, y];
		},

		/* toggleBit(event: PointerEvent, index: number) {
			if (event.button !== 0) return;
			this.truthTable[index] = !this.truthTable[index];
		}, */

		groupColor,

		* wrappingCombos(group: Group): Generator<boolean[], void, void> {
			const wrappedDimensions: number[] = [];
			for (let dimension = 0; dimension < group.nDimensions; dimension++) {
				if (group.endCorner[dimension] <= 4) continue;
				wrappedDimensions.push(dimension);
			}
			
			for (const combo of anyCombineBoolean(wrappedDimensions.length)) {
				const shiftedAxes = [false, false];
				for (let i = 0; i < wrappedDimensions.length; i++) {
					const dimension = wrappedDimensions[i];
					shiftedAxes[dimension] = combo[i];
				}
				yield shiftedAxes;
			}
		},

		groupIsFocused(group: Group) {
			return !this.focusedGroup || group === this.focusedGroup;
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
	
	:not(#horizontal-axis) text {
		transform: translateY(0.5ch);
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

	g#map-groups {
		pointer-events: none;

		.group {
			mix-blend-mode: multiply;

			transition: opacity 0.1s ease;

			&.unfocused {
				opacity: 0.1;
			}
		}
	}

	&.disabled {
		opacity: 0.3;
		pointer-events: none;
	}
}
</style>