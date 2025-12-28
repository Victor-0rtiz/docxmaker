/**
 * Node.js entry point.
 *
 * Re-exports the main DOCX generator, the error class, and TypeScript types
 * so package consumers can simply `import { DocxGenerator } from 'docxmaker'`.
 */
export { DocxGenerator } from "./core/DocxGenerator.js";
export { DocxGenerationError } from "./core/DocxGenerationError.js";
export { DocxDefinition } from "./core/types/types.js";
