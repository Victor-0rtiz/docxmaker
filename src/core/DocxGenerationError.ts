import util from "node:util";

/**
 * Custom error class for DOCX generation failures.
 * 
 * This class:
 * - Preserves the original error cause
 * - Provides pretty console output for developers
 * - Keeps full stack trace for debugging
 * 
 * @example
 * try {
 *   await generator.save('/bad/path.docx');
 * } catch (err) {
 *   if (err instanceof DocxGenerationError) {
 *     console.error(err.toString());
 *   }
 * }
 */
export class DocxGenerationError extends Error {
  /** The original underlying error (if any) */
  public originalError?: unknown;

  /**
   * Creates a new DocxGenerationError.
   * @param {string} message - Error message
   * @param {unknown} [originalError] - Original error that caused this exception
   */
  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = "DocxGenerationError";
    this.originalError = originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DocxGenerationError);
    }
  }

  /**
   * Developer-friendly representation for logging and debugging.
   * Includes nested error message and stack trace if available.
   * 
   * @returns {string} Formatted multi-line error description
   */
  override toString(): string {
    const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
    const gray = (text: string) => `\x1b[90m${text}\x1b[0m`;

    let output = `\n${red("DOCX Generation Error")}\n`;
    output += `→ ${this.message}\n`;

    if (this.originalError instanceof Error) {
      output += gray(
        `└─ Caused by: ${this.originalError.name}: ${this.originalError.message}\n`
      );
      if (this.originalError.stack) {
        output += gray(
          this.originalError.stack
            .split("\n")
            .slice(0, 4)
            .map((line) => "   " + line)
            .join("\n") + "\n"
        );
      }
    } else if (this.originalError) {
      output += gray(
        "└─ Caused by: " +
          util.inspect(this.originalError, { depth: 1, colors: true }) +
          "\n"
      );
    }

    return output;
  }
}
