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
