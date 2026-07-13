import { defineConfig } from 'tsup';

/**
 * tsup configuration for the browser build.
 *
 * - `noExternal` forces JSZip and xmlbuilder2 to be bundled into
 *   the output file (they would otherwise be left as bare module
 *   imports that browsers cannot resolve).
 * - `esbuildOptions.alias` maps Node built-ins (`events`, `url`)
 *   to local polyfills so xmlbuilder2 can work without a Node
 *   runtime.
 * - `minify` reduces the final bundle.
 */
export default defineConfig({
  entry: ['src/index.browser.ts'],
  format: 'esm',
  outDir: 'dist/browser',
  platform: 'browser',
  target: 'es2020',
  splitting: false,
  minify: true,
  dts: true,
  noExternal: ['jszip', 'xmlbuilder2'],
  esbuildOptions(options) {
    options.alias = {
      events: './src/polyfills/events.ts',
      url: './src/polyfills/url.ts',
    };
  },
});
