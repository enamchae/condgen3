import {Cuboid, Group} from "../../src/Boolean/remove-redundant-groups";
import {Karnaugh} from "../../src/Boolean/boolean-util";
// import {describe, it, expect} from "@jest/globals";
import "jest-extended";

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
			expect(Cuboid.forGroup(new Group([3, 0], [1, 0]))).toIncludeSameMembers([
				new Cuboid([3, 0], [1, 1]),
				new Cuboid([0, 0], [1, 1]),
			]);
		}

		{
			expect(Cuboid.forGroup(new Group([1, 3, 3], [1, 0, 1]))).toIncludeSameMembers([
				new Cuboid([1, 3, 3], [2, 1, 1]),
				new Cuboid([1, 3, 0], [2, 1, 1]),
			]);
		}
	});

	it("handles wrapping over 2 axes", () => {
		{
			expect(Cuboid.forGroup(new Group([3, 3], [1, 1]))).toIncludeSameMembers([
				new Cuboid([3, 3], [1, 1]),
				new Cuboid([0, 3], [1, 1]),
				new Cuboid([3, 0], [1, 1]),
				new Cuboid([0, 0], [1, 1]),
			]);
		}

		{
			expect(Cuboid.forGroup(new Group([2, 3, 0, 3], [1, 1, 2, 1]))).toIncludeSameMembers([
				new Cuboid([2, 3, 0, 3], [2, 1, 4, 1]),
				new Cuboid([2, 0, 0, 3], [2, 1, 4, 1]),
				new Cuboid([2, 3, 0, 0], [2, 1, 4, 1]),
				new Cuboid([2, 0, 0, 0], [2, 1, 4, 1]),
			]);
		}
	});
});

describe("Cuboid:subtract", () => {
	it("handles fully contained cuboids", () => {
		const minuend = new Cuboid([0, 0, 0], [4, 4, 4]);
		const subtrahend = new Cuboid([1, 1, 1], [2, 2, 2]);

		expect(minuend.subtract(subtrahend).subcuboids).toIncludeSameMembers([
			new Cuboid([0, 0, 0], [1, 4, 4]),
			new Cuboid([3, 0, 0], [1, 4, 4]),
			new Cuboid([1, 0, 0], [2, 1, 4]),
			new Cuboid([1, 3, 0], [2, 1, 4]),
			new Cuboid([1, 1, 0], [2, 2, 1]),
			new Cuboid([1, 1, 3], [2, 2, 1]),
		]);
	});

	it("handles cuboids that partially break out on 1 axis (left side)", () => {
		{
			const minuend = new Cuboid([2, 0], [4, 5]);
			const subtrahend = new Cuboid([1, 1], [2, 2]);
	
			expect(minuend.subtract(subtrahend).subcuboids).toIncludeSameMembers([
				new Cuboid([3, 0], [3, 5]),
				new Cuboid([2, 0], [1, 1]),
				new Cuboid([2, 3], [1, 2]),
			]);
		}

		{
			const minuend = new Cuboid([3, 2], [5, 7]);
			const subtrahend = new Cuboid([4, 1], [2, 6]);
	
			expect(minuend.subtract(subtrahend).subcuboids).toIncludeSameMembers([
				new Cuboid([3, 2], [1, 7]),
				new Cuboid([6, 2], [2, 7]),
				new Cuboid([4, 7], [2, 2]),
			]);
		}
	});

	it("handles cuboids that partially break out on 1 axis (right side)", () => {
		{
			const minuend = new Cuboid([2, 2], [4, 5]);
			const subtrahend = new Cuboid([5, 3], [2, 2]);
	
			expect(minuend.subtract(subtrahend).subcuboids).toIncludeSameMembers([
				new Cuboid([2, 2], [3, 5]),
				new Cuboid([5, 2], [1, 1]),
				new Cuboid([5, 5], [1, 2]),
			]);
		}

		{
			const minuend = new Cuboid([1, 2], [8, 4]);
			const subtrahend = new Cuboid([5, 5], [2, 3]);
	
			expect(minuend.subtract(subtrahend).subcuboids).toIncludeSameMembers([
				new Cuboid([1, 2], [4, 4]),
				new Cuboid([7, 2], [2, 4]),
				new Cuboid([5, 2], [2, 3]),
			]);
		}
	});

	it("handles cuboids that partially break out on 1 axis (both sides)", () => {
		{
			const minuend = new Cuboid([2, 2], [1, 2]);
			const subtrahend = new Cuboid([0, 3], [4, 1]);
	
			expect(minuend.subtract(subtrahend).subcuboids).toIncludeSameMembers([
				new Cuboid([2, 2], [1, 1]),
			]);
		}
	});
});