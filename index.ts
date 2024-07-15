import { encodeBase64, decodeBase64 } from "jsr:@std/encoding@1.0.1";
import { Buffer } from "jsr:@std/io@0.224.3";
import { assert } from "jsr:@std/assert@1.0.0";

import {
	ImageMagick,
	IMagickImage,
	initialize as initialise,
	MagickFormat,
} from "https://deno.land/x/imagemagick_deno@0.0.26/mod.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

const toJpg = (data: Uint8Array, quality: number) =>
	ImageMagick.read(data, (img: IMagickImage) => {
		img.quality = quality;
		return new Promise<Uint8Array>(res => img.write(MagickFormat.Jpeg, (data: Uint8Array) => res(data)));
	});

const imgTag =
	/(?<before><\s*image\s[^>]*xlink:href\s*=\s*")data:image\/(?<format>png|jpeg|jpg);base64,(?<data>[A-Za-z0-9+\/=]+)(?<after>"[^>]*>)/;

const compare = (input: Uint8Array, compare: Uint8Array, fromIndex: number = 0) => {
	for (let j = 0; j < compare.length; j++) if (input[fromIndex + j] !== compare[j]) return false;
	return true;
};

Deno.test("compare", () => {
	const input = encoder.encode("hello world");
	const b = encoder.encode("world");
	const i = compare(input, b, 6);
	assert(i === true);
});

const findIndex = (input: Uint8Array, find: Uint8Array, fromindex: number = 0) => {
	const len = find.length;
	const endIndex = input.length - len + 1;
	while (fromindex < endIndex) {
		let found = true;
		for (let j = 0; j < len; j++)
			if (input[fromindex + j] !== find[j]) {
				found = false;
				break;
			}
		if (found) return fromindex;
		fromindex++;
	}
	return -1;
};

Deno.test("findIndex", () => {
	const input = encoder.encode("hello world");
	const b = encoder.encode("world");
	const i = findIndex(input, b, 0);
	assert(i === 6);
});

const char = (char: string) => char.charCodeAt(0);

const OPEN = encoder.encode("<image");
const CLOSE = encoder.encode(">");

interface SvgcOptions {
	quality?: number;
	optimisePngs?: boolean;
	downscaleToFit?: boolean;
}

const defaultOptions: Required<SvgcOptions> = {
	quality: 90,
	optimisePngs: true,
	downscaleToFit: true,
};

export async function svgc(input: Uint8Array, options: SvgcOptions = defaultOptions) {
	const out = new Buffer();

	const opts = { ...defaultOptions, ...options };

	await initialise();

	type Parsed = {
		before: string;
		format: string;
		data: string;
		after: string;
	};

	let i = 0;
	while (i < input.length) {
		const c = input[i];

		if (c !== char("<")) {
			await out.write(new Uint8Array([c]));
			i++;
			continue;
		}

		const start = i;

		// could the next characters be an opening <image tag?
		const potential = input.subarray(i, i + OPEN.length);
		i += OPEN.length;

		// is potential an opening <image tag?
		if (!compare(potential, OPEN)) {
			await out.write(potential);
			continue;
		}

		// find > after <image
		const end = findIndex(input, CLOSE, start + OPEN.length);

		// no closing > found, bail out
		if (end < 0) {
			await out.write(input.subarray(start, i));
			continue;
		}

		i = end + 1;
		const tag = input.subarray(start, i);
		const match = decoder.decode(tag).match(imgTag);
		if (match) {
			const { before, format, data, after } = match.groups as Parsed;

			if (format === "png" && !opts.optimisePngs) {
				await out.write(tag);
				continue;
			}

			const buf = await toJpg(decodeBase64(data), opts.quality);
			const jpg = "data:image/jpg;base64," + encodeBase64(buf);
			const newTag = encoder.encode(`${before}${jpg}${after}`);

			if (newTag.length < tag.length) await out.write(newTag);
			else await out.write(tag);
		} else await out.write(tag);
	}

	return out.bytes();
}
