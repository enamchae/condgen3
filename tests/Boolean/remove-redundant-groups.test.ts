import {Cuboid, Group, removeRedundantGroups} from "../../src/Boolean/remove-redundant-groups";
import {Karnaugh} from "../../src/Boolean/boolean-util";
// import {describe, it, expect} from "@jest/globals";
import "jest-extended";

/* expect.extend({
	asArrayToSuperset<T>(received: T[], set: Set<T>) {
		const receivedSet = new Set(received);
		for (const value of set) {
			if (receivedSet.has(value)) continue;
			
		}
	},
}); */

describe(removeRedundantGroups.name, () => {
	it("handles unoptimizable sets: single group", () => {
		{
			const map = Karnaugh.withNDimensions(4);

			const group = new Group([1, 1, 1, 1], [1, 1, 1, 1]);
			const groups = new Set([group]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([group]);
		}
	});

	it("handles unoptimizable sets: overlapping groups", () => {
		{
			const map = Karnaugh.withNDimensions(2);

			// █ █ █ .
			// . . . .
			// █ █ █ █
			// . █ █ .
			const groups = new Set([
				new Group([0, 0], [1, 0]),
				new Group([1, 0], [1, 0]),
				new Group([0, 2], [2, 0]),
				new Group([1, 2], [1, 1]),
			]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([...groups]);
		}
	});

	it("handles groups coverable by a single other group", () => {
		{
			const map = Karnaugh.withNDimensions(2);

			const groups = new Set([
				new Group([1, 2], [0, 0]),
				new Group([1, 1], [1, 1]), // ✓
			]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([new Group([1, 1], [1, 1])]);
		}

		{
			const map = Karnaugh.withNDimensions(2);

			const groups = new Set([
				new Group([0, 0], [2, 1]), // ✓
				new Group([2, 0], [1, 1]),
				new Group([3, 0], [0, 1]),
			]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([new Group([0, 0], [2, 1])]);
		}

		{
			const map = Karnaugh.withNDimensions(2);

			const groups = new Set([
				new Group([0, 0], [2, 1]), // ✓
				new Group([0, 1], [2, 1]), // ✓
				new Group([0, 0], [1, 2]), // ✓
				new Group([1, 0], [1, 2]), // ✓
				new Group([1, 0], [1, 1]),
				new Group([2, 0], [1, 1]),
				new Group([0, 1], [1, 1]),
				new Group([0, 2], [1, 1]),
				new Group([1, 1], [1, 1]),
				new Group([1, 2], [1, 1]),
				new Group([2, 1], [1, 1]),
			]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([
						new Group([0, 0], [2, 1]),
						new Group([0, 1], [2, 1]),
						new Group([0, 0], [1, 2]),
						new Group([1, 0], [1, 2]),
					]);
		}
	});

	it("handles groups coverable by a single other group, with wrapping", () => {
		{
			const map = Karnaugh.withNDimensions(2);

			const groups = new Set([
				new Group([3, 3], [1, 1]), // ✓
				new Group([0, 3], [0, 1]),
			]);

			expect(new Group([3, 3], [1, 1]).contains(new Group([0, 3], [0, 1]))).toBeTrue();

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([new Group([3, 3], [1, 1])]);
		}
	});

	it("handles groups coverable only by the union of other groups", () => {
		{
			const map = Karnaugh.withNDimensions(2);

			const groups = new Set([
				new Group([0, 1], [1, 1]), // ✓
				new Group([1, 1], [1, 1]),
				new Group([2, 1], [1, 1]), // ✓
			]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([
						new Group([0, 1], [1, 1]),
						new Group([2, 1], [1, 1]),
					]);
		}

		{
			const map = Karnaugh.withNDimensions(2);

			const groups = new Set([
				new Group([0, 0], [2, 0]), // ✓
				new Group([0, 0], [0, 2]), // ✓
				new Group([0, 0], [1, 1]),
				new Group([1, 0], [1, 1]), // ✓
				new Group([0, 1], [1, 1]), // ✓
			]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([
						new Group([0, 0], [2, 0]),
						new Group([0, 0], [0, 2]),
						new Group([1, 0], [1, 1]),
						new Group([0, 1], [1, 1]),
					]);
		}

		{
			const map = Karnaugh.withNDimensions(2);

			// From truth table where all but ABCD' and A'B'C'D are true
			// █ █ █ █
			// █ █ . █
			// █ █ █ █
			// . █ █ █

			const groups = new Set([
				new Group([0, 0], [2, 0]), // ✓
				new Group([0, 2], [2, 0]),
				new Group([1, 0], [0, 2]),
				new Group([3, 0], [0, 2]), // ✓
				new Group([0, 0], [1, 1]),
				new Group([0, 1], [1, 1]), // ✓
				new Group([1, 2], [1, 1]), // ✓
				new Group([2, 2], [1, 1]),

				// wrap around
				// new Group([3, 0], [1, 1]),
				// new Group([3, 1], [1, 1]),
				// new Group([1, 3], [1, 1]),
				// new Group([2, 3], [1, 1]),
			]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([
						new Group([0, 0], [2, 0]),
						new Group([3, 0], [0, 2]),
						new Group([0, 1], [1, 1]),
						new Group([1, 2], [1, 1]),
					]);
		}

		/* {
			const map = Karnaugh.withNDimensions(2);

			// █ █ █ █
			// █ . . █
			// █ . . █
			// . █ █ █

			const groups = new Set([
				new Group([0, 0], [2, 0]), // ✓
				new Group([3, 0], [0, 2]), // ✓
				new Group([3, 0], [1, 1]),
				new Group([3, 1], [1, 1]), // ✓
				new Group([1, 3], [1, 1]), // ✓
				new Group([2, 3], [1, 1]),
			]);

			expect([...removeRedundantGroups(groups, map)])
					.toIncludeSameMembers([
						new Group([0, 0], [2, 0]),
						new Group([3, 0], [0, 2]),
						new Group([3, 1], [1, 1]),
						new Group([1, 3], [1, 1]),
					]);
		} */
	});
});