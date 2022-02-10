import {Cuboid} from "../../src/Boolean/remove-redundant-groups";
import {Karnaugh} from "../../src/Boolean/boolean-util";
import {describe, it, expect} from "@jest/globals";

describe("Cuboid.thatCovers", () => {
	it("Creates a cuboid with the same size as a map", () => {
		expect(Cuboid.thatCovers(new Karnaugh(4**5))).toEqual(new Cuboid([0, 0, 0, 0, 0], [4, 4, 4, 4, 4]));

		expect(Cuboid.thatCovers(new Karnaugh(4**2 * 2))).toEqual(new Cuboid([0, 0, 0], [4, 4, 2]));
	});
});