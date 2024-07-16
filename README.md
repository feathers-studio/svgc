# `svgc`: SVG Image Compressor

`svgc` is a simple command line tool to compress embedded images in SVG. `svgc` is not a generic SVG optimiser. Consider using [svgo](https://github.com/svg/svgo) along with this tool.

## Usage

If you have Deno, you can install `svgc` using the following command:

```sh
deno install --allow-read --allow-write --name svgc https://raw.githubusercontent.com/feathers-studio/svgc/master/cli.ts
```

```
Usage: svgc [options] -i <input> [-o <output>]

Options:
  -i, --input <input>      Input file
  -o, --output <output>    Output file
  -q, --quality <quality>  Quality for JPEG images (default: 80)
  -a, --optimise-pngs      Optimise PNG images
```

By default, `svgc` will ignore PNG images, as compressing them to JPEG will cause loss of transparency. If you don't rely on transparency, you can enable PNG optimisation using the `-a` flag.

## As a library

You can also use `svgc` as a library:

```ts
import { svgc } from "https://raw.githubusercontent.com/feathers-studio/svgc/master/index.ts";

const input = await Deno.readFile("input.svg");
const output = await svgc(input, { quality: 80, optimisePNGs: true });
await Deno.writeFile("output.svg", output);
```
