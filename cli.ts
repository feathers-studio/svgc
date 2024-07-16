#! /usr/bin/env -S deno run --allow-read --allow-write

import { parseArgs } from "jsr:@std/cli@0.224.7/parse-args";
import { Spinner } from "jsr:@std/cli@1.0.0-rc.5/spinner";
import { svgc } from "./index.ts";
import { basename } from "node:path";

const args = parseArgs(Deno.args, {
	boolean: ["help", "optimise-pngs"],
	string: ["output", "input", "quality"],
	alias: { "help": "h", "input": "i", "output": "o", "quality": "q", "optimise-pngs": "a" },
});

if (args.help) {
	console.log("Usage: svgc [options] -i <input> [-o <output>]");
	console.log("");
	console.log("Options:");
	console.log("  -i, --input <input>      Input file");
	console.log("  -o, --output <output>    Output file");
	console.log("  -q, --quality <quality>  Quality for JPEG images (default: 80)");
	console.log("  -a, --optimise-pngs      Optimise PNG images");
	console.log("  -h, --help               Show this help message");
	Deno.exit(0);
}

const input = args.input;

if (!input) {
	console.error("No input file specified");
	console.error("");
	console.error("Usage: svgc [options] -i <input> [-o <output>]");
	console.error("svgc --help for more information");
	Deno.exit(0);
}

const output = args.output ?? `${basename(input, ".svg")}-compressed.svg`;

const GREEN = "\u001b[32m";
const RESET = "\u001b[0m";
const green = (text: string) => `${GREEN}${text}${RESET}`;

const human = (bytes: number) => {
	const units = ["B", "KiB", "MiB", "GiB", "TiB"];
	let i = 0;
	while (bytes >= 1024) (bytes /= 1024), i++;
	return `${bytes.toFixed(2)} ${units[i]}`;
};

const spinner = new Spinner({ message: "Compressing..." });
spinner.start();

const data = await Deno.readFile(input);

const start = performance.now();
const result = await svgc(data, {
	quality: args.quality ? parseInt(args.quality) : undefined,
	optimisePngs: args["optimise-pngs"],
});

const diff = data.length - result.length;
const diffPercent = ((diff / data.length) * 100).toFixed(2);
const diffText = diff > 0 ? green(`Saved ${human(diff)}, ${diffPercent}%`) : "-";

spinner.stop();
console.log(`Done in in ${performance.now() - start}ms!`);

await Deno.writeFile(output, result);
console.log(`${basename(input)} (${human(data.length)}) -> ${basename(output)} (${human(result.length)}): ${diffText}`);
