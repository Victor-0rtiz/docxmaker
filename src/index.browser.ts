/**
 * Browser-friendly entry point.
 *
 * Surfaces the browser-specific `DocxGenerator` along with shared types so
 * bundlers can tree-shake unused Node code when targeting the web.
 */
export { DocxGenerator } from "./core/DocxGenerator.browser.js";
export { DocxGenerationError } from "./core/DocxGenerationError.js";
export { DocxDefinition } from "./core/types/types.js";
