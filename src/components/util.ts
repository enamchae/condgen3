import {Group} from "../Boolean/remove-redundant-groups";

export const groupColor = (group: Group, alpha: number=0.5) => {
	const midX = (group.offset[0] ?? 0);// + 2**(group.size[0] ?? 0) / 2;
	const midY = (group.offset[1] ?? 0);// + 2**(group.size[1] ?? 0) / 2;

	const r = (midX + midY) * -128 / 3 + 191;
	const g = midY * 191 / 3 + 63;
	const b = midX * 191 / 3 + 63;
	// const r = (group.offset[0] ?? 0) * 128 / 3 + 63;
	// const g = (group.offset[1] ?? 0) * 128 / 3 + 63;
	// const b = 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};