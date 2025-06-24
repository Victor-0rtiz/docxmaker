import JSZip from 'jszip';
import * as fs from 'fs';
import { RelationshipsManager } from './generators/RelationshipsGenerator.js';
import { ImageManager } from './generators/ImageManager.js';
import { DocxDefinition } from './types/types.js';
import { generateDocumentXml } from './generators/DocumentXmlGenerator.js';
import { generateContentTypesXml } from './generators/ContentTypesGenerator.js';
import { DocxGenerationError } from './DocxGenerationError.js';

/**
 * Generates DOCX documents from structured definitions.
 * 
 * @example
 * // Basic usage
 * import fs from 'fs';
 * 
 * const docDefinition: DocxDefinition = {
 *   content: [
 *     "Hello World!",
 *     {
 *       type: "paragraph",
 *       content: [
 *         "Visit ",
 *         { type: "link", text: "Google", url: "https://google.com" }
 *       ]
 *     },
 *     {
 *       type: "table",
 *       rows: [
 *         { cells: [{ content: ["Cell 1"] }, { content: ["Cell 2"] }] }
 *       ]
 *     },
 *     {
 *       type: 'image',
 *       image: fs.readFileSync('logo.png')
 *     }
 *   ]
 * };
 * 
 * const generator = new DocxGenerator(docDefinition);
 * 
 * // Save to file
 * await generator.save('output.docx');
 * 
 * // Get as Buffer
 * const buffer = await generator.generateDocxBuffer();
 * 
 * @example
 * // Static method usage
 * const buffer = await DocxGenerator.toBuffer(docDefinition);
 */
export class DocxGenerator {
    private relManager: RelationshipsManager;
    private imageManager: ImageManager;

    /**
     * Creates a DOCX generator instance
     * @param {DocxDefinition} definition - Document structure definition
     * @throws {DocxGenerationError} If definition is invalid
     * 
     * @example
     * const generator = new DocxGenerator({
     *   content: ["Hello World"]
     * });
     */
    constructor(private definition: DocxDefinition) {
        if (!definition || !Array.isArray(definition.content)) {
            throw new DocxGenerationError('Invalid document definition. "content" must be an array.');
        }
        
        this.relManager = new RelationshipsManager();
        this.imageManager = new ImageManager();
    }

    /**
     * Resets internal state for a new generation
     * @private
     */
    private resetState(): void {
        this.relManager.reset();
        this.imageManager.reset();
    }

    /**
     * Saves the generated DOCX to disk
     * @param {string} outputPath - File path to save the document
     * @returns {Promise<void>}
     * @throws {DocxGenerationError} If saving fails
     * 
     * @example
     * await generator.save('report.docx');
     * 
     * @example
     * // Error handling
     * try {
     *   await generator.save('/invalid/path/report.docx');
     * } catch (error) {
     *   console.error('Save failed:', error.message);
     * }
     */
    public async save(outputPath: string): Promise<void> {
        this.resetState();
        
        try {
            const zip = new JSZip();
            await this.generateZipContent(zip);
            
            return new Promise((resolve, reject) => {
                zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                    .pipe(fs.createWriteStream(outputPath))
                    .on('finish', resolve)
                    .on('error', reject);
            });
        } catch (error) {
            throw new DocxGenerationError('Failed to save DOCX file.', error);
        }
    }

    /**
     * Returns the generated DOCX as a Buffer
     * @returns {Promise<Buffer>} Buffer containing the DOCX file
     * @throws {DocxGenerationError} If generation fails
     * 
     * @example
     * // Basic usage
     * const buffer = await generator.generateDocxBuffer();
     * 
     * @example
     * // Use in web response
     * app.get('/download', async (req, res) => {
     *   const buffer = await generator.generateDocxBuffer();
     *   res.setHeader('Content-Type', 
     *     'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
     *   res.send(buffer);
     * });
     */
    public async generateDocxBuffer(): Promise<Buffer> {
        this.resetState();
        
        try {
            const zip = new JSZip();
            await this.generateZipContent(zip);
            
            return zip.generateAsync({
                type: 'nodebuffer',
                compression: 'DEFLATE',
                compressionOptions: { level: 9 },
            });
        } catch (error) {
            throw new DocxGenerationError('Failed to generate DOCX buffer.', error);
        }
    }

    /**
     * Generates all content for the DOCX zip file
     * @private
     * @param {JSZip} zip - JSZip instance to populate
     */
    private async generateZipContent(zip: JSZip): Promise<void> {
        // Generate main document XML
        const documentXml = generateDocumentXml(
            this.definition,
            this.relManager,
            this.imageManager
        );

        // Add required files
        zip.file('[Content_Types].xml', generateContentTypesXml());
        zip.folder('_rels')?.file('.rels', RelationshipsManager.generateMainRelsXml());
        zip.folder('word')?.file('document.xml', documentXml);

        // Add images to the media folder
        this.imageManager.saveImagesToZip(zip);

        // Add document relationships if needed
        if (this.relManager.hasRelationships()) {
            const relsXml = this.relManager.generateDocumentRelsXml();
            zip.folder('word')?.folder('_rels')?.file('document.xml.rels', relsXml);
        }
    }

    /**
     * Static method to generate DOCX as Buffer from definition
     * @static
     * @param {DocxDefinition} definition - Document definition
     * @returns {Promise<Buffer>} Buffer containing the DOCX file
     * @throws {DocxGenerationError} If generation fails
     * 
     * @example
     * // Quick one-time generation
     * const buffer = await DocxGenerator.toBuffer({
     *   content: ["Static method document"]
     * });
     * 
     * @example
     * // Serverless function usage
     * export const handler = async (event) => {
     *   const buffer = await DocxGenerator.toBuffer(JSON.parse(event.body));
     *   return { statusCode: 200, body: buffer.toString('base64'), isBase64Encoded: true };
     * };
     */
    public static async toBuffer(definition: DocxDefinition): Promise<Buffer> {
        const generator = new DocxGenerator(definition);
        return generator.generateDocxBuffer();
    }
}