import { defineConfig } from 'tsup';

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
