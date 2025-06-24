/**
 * Custom error class for DOCX generation failures
 */
export class DocxGenerationError extends Error {
    /**
     * Creates a new DocxGenerationError
     * @param {string} message - Error message
     * @param {unknown} [originalError] - Original error that caused this exception
     */
    constructor(message: string, public originalError?: unknown) {
        super(message);
        this.name = 'DocxGenerationError';

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DocxGenerationError);
        }
    }
}