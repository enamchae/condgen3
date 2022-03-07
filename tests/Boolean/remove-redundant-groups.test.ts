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

describe("Group:length", () => {
	it("computes correctly", () => {
		expect(new Group([0, 1, 2], [1, 2, 0])).toHaveProperty("length", [2, 4, 1]);
		expect(new Group([0, 3, 2, 1], [2, 2, 2, 2])).toHaveProperty("length", [4, 4, 4, 4]);
	});
});

describe("Cuboid.thatCovers", () => {
	it("covers even maps", () => {
		expect(Cuboid.thatCovers(new Karnaugh(4**5))).toEqual(new Cuboid([0, 0, 0, 0, 0], [4, 4, 4, 4, 4]));
	});

	it("covers uneven maps", () => {
		expect(Cuboid.thatCovers(new Karnaugh(4**2 * 2))).toEqual(new Cuboid([0, 0, 0], [4, 4, 2]));
	});
});

describe("Cuboid.fromGroup", () => {
	it("handles contained groups", () => {
		expect(Cuboid.forGroup(new Group([0, 0], [1, 1]))).toContainEqual(new Cuboid([0, 0], [2, 2]));

		expect(Cuboid.forGroup(new Group([2, 0, 1], [0, 2, 1]))).toContainEqual(new Cuboid([2, 0, 1], [1, 4, 2]));
	});

	it("handles wrapping over 1 axis", () => {
		{
			const cuboids = Cuboid.forGroup(new Group([3, 0], [1, 0]));
			expect(cuboids).toContainEqual(new Cuboid([3, 0], [1, 1]));
			expect(cuboids).toContainEqual(new Cuboid([0, 0], [1, 1]));
		}

		{
			const cuboids = Cuboid.forGroup(new Group([1, 3, 3], [1, 0, 1]));
			expect(cuboids).toContainEqual(new Cuboid([1, 3, 3], [2, 1, 1]));
			expect(cuboids).toContainEqual(new Cuboid([1, 3, 0], [2, 1, 1]));
		}
	});

	it("handles wrapping over 2 axes", () => {
		{
			const cuboids = Cuboid.forGroup(new Group([3, 3], [1, 1]));
			expect(cuboids).toContainEqual(new Cuboid([3, 3], [1, 1]));
			expect(cuboids).toContainEqual(new Cuboid([0, 3], [1, 1]));
			expect(cuboids).toContainEqual(new Cuboid([3, 0], [1, 1]));
			expect(cuboids).toContainEqual(new Cuboid([0, 0], [1, 1]));
		}

		{
			const cuboids = Cuboid.forGroup(new Group([2, 3, 0, 3], [1, 1, 2, 1]));
			expect(cuboids).toContainEqual(new Cuboid([2, 3, 0, 3], [2, 1, 4, 1]));
			expect(cuboids).toContainEqual(new Cuboid([2, 0, 0, 3], [2, 1, 4, 1]));
			expect(cuboids).toContainEqual(new Cuboid([2, 3, 0, 0], [2, 1, 4, 1]));
			expect(cuboids).toContainEqual(new Cuboid([2, 0, 0, 0], [2, 1, 4, 1]));
		}
	});
});

describe(removeRedundantGroups.name, () => {
	it("handles cases with no removed groups", () => {
		{
			const map = new Karnaugh(4**4);

			const group = new Group([1, 1, 1, 1], [1, 1, 1, 1]);
			const groups = new Set([group]);

			removeRedundantGroups(groups, map);
			expect(groups).toSatisfy((object: Set<Group>) => object.size === 1 && object.has(group));
		}
	});
});