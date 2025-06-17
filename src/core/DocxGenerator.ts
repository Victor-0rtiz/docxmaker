
import JSZip from 'jszip';
import { create } from 'xmlbuilder2';
import * as fs from 'fs';
import { DocxDefinition } from './types/types.js';
import { createText } from './elements/text.js';
import { createParagraph } from './elements/paragrahp.js';
import { createTable } from './elements/table.js';

/**
 * Custom error class for DOCX generation failures.
 * @class
 * @extends Error
 * 
 * @example
 * try {
 *   // DOCX generation code
 * } catch (error) {
 *   if (error instanceof DocxGenerationError) {
 *     console.error('DOCX Generation Failed:', error.message);
 *   }
 * }
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

/**
 * Generates DOCX documents from JSON definitions.
 * 
 * @example
 * // Basic usage
 * const definition = {
 *   content: [
 *     "Hello World",
 *     {
 *       type: 'paragraph',
 *       content: [
 *         "This is a paragraph with a ",
 *         { type: 'link', text: 'link', url: 'https://example.com' }
 *       ]
 *     }
 *   ]
 * };
 * 
 * const generator = new DocxGenerator(definition);
 * 
 * // Save to file
 * await generator.save('document.docx');
 * 
 * // Get as Buffer
 * const buffer = await generator.generateDocxBuffer();
 * 
 * @example
 * // Static method usage
 * const buffer = await DocxGenerator.toBuffer({
 *   content: [
 *     "Document generated with static method",
 *     { type: 'table', rows: [{ cells: [{ content: ['Table cell'] }] }]
 *   ]
 * });
 */
export class DocxGenerator {
    /** Stores hyperlink relationships for the document */
    private relationships: Array<{ id: string; type: string; target: string }> = [];

    /** Counter for generating relationship IDs */
    private nextRelId = 1;

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
    }


    /**
   * Generates the main document.xml content
   * @private
   * @returns {string} XML string for word/document.xml
   */
    private generateDocumentXml(): string {
        // Reset relationships for each document generation
        this.relationships = [];
        this.nextRelId = 1;

        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('w:document', {
                'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            })
            .ele('w:body');

        for (const item of this.definition.content) {
            if (typeof item === 'string') {
                const p = root.ele('w:p');
                createText(p, item);
            } else if (item.type === 'text') {
                const p = root.ele('w:p');
                if (item.style) {
                    const pPr = p.ele('w:pPr');
                    if (item.style.align) {
                        const wordAlign = item.style.align === 'justify' ? 'both' : item.style.align;
                        pPr.ele('w:jc', { 'w:val': wordAlign });
                    }
                    if (item.style.lineSpacing) {
                        const spacingValue = Math.round(item.style.lineSpacing * 240);
                        pPr.ele('w:spacing', { 'w:line': spacingValue, 'w:lineRule': 'auto' });
                    }
                }
                createText(p, item);
            } else if (item.type === 'paragraph') {
                const getRelId = (url: string) => {
                    const relId = `rId${this.nextRelId++}`;
                    this.relationships.push({
                        id: relId,
                        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
                        target: url,
                    });
                    return relId;
                };
                createParagraph(root, item, getRelId);
            } else if (item.type === 'table') {
                const getRelId = (url: string) => {
                    const relId = `rId${this.nextRelId++}`;
                    this.relationships.push({
                        id: relId,
                        type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
                        target: url,
                    });
                    return relId;
                };
                createTable(root, item, getRelId);
            }
        }

        root.ele('w:sectPr');
        return root.end({ prettyPrint: true });
    }



    /**
   * Generates [Content_Types].xml
   * @private
   * @returns {string} XML for package content types
   */
    private generateContentTypesXml(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
        <Default Extension="xml" ContentType="application/xml"/>
        <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      </Types>`;
    }



    /**
   * Generates package relationships (_rels/.rels)
   * @private
   * @returns {string} XML for package relationships
   */
    private generateRelsXml(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
      </Relationships>`;
    }



    /**
   * Generates document relationships (word/_rels/document.xml.rels)
   * @private
   * @returns {string} XML for document relationships
   */
    private generateDocumentRelsXml(): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('Relationships', {
                xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships',
            });

        for (const rel of this.relationships) {
            root.ele('Relationship', {
                Id: rel.id,
                Type: rel.type,
                Target: rel.target,
                TargetMode: 'External',
            });
        }

        return root.end({ prettyPrint: true });
    }






    /**
   * Saves the generated DOCX to disk
   * @param {string} outputPath - File path to save the document
   * @returns {Promise<void>}
   * @throws {DocxGenerationError} If saving fails
   * 
   * @example
   * // Save to current directory
   * await generator.save('my-document.docx');
   * 
   * @example
   * // Save with path
   * await generator.save('/path/to/documents/report.docx');
   */
    public async save(outputPath: string): Promise<void> {
        try {
            const zip = new JSZip();
            zip.file('[Content_Types].xml', this.generateContentTypesXml());
            zip.folder('_rels')?.file('.rels', this.generateRelsXml());
            zip.folder('word')?.file('document.xml', this.generateDocumentXml());

            if (this.relationships.length > 0) {
                zip.folder('word')?.folder('_rels')?.file('document.xml.rels', this.generateDocumentRelsXml());
            }

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
   * // Get as Buffer
   * const buffer = await generator.generateDocxBuffer();
   * 
   * @example
   * // Use in Express.js response
   * app.get('/download', async (req, res) => {
   *   const generator = new DocxGenerator({ content: ["Downloaded document"] });
   *   const buffer = await generator.generateDocxBuffer();
   *   
   *   res.setHeader('Content-Type', 
   *     'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
   *   res.setHeader('Content-Disposition', 'attachment; filename=document.docx');
   *   res.send(buffer);
   * });
   */
    public async generateDocxBuffer(): Promise<Buffer> {
        try {
            const zip = new JSZip();
            zip.file('[Content_Types].xml', this.generateContentTypesXml());
            zip.folder('_rels')?.file('.rels', this.generateRelsXml());
            zip.folder('word')?.file('document.xml', this.generateDocumentXml());

            if (this.relationships.length > 0) {
                zip.folder('word')?.folder('_rels')?.file('document.xml.rels', this.generateDocumentRelsXml());
            }

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
   * Static method to generate DOCX as Buffer from definition
   * @static
   * @param {DocxDefinition} definition - Document definition
   * @returns {Promise<Buffer>} Buffer containing the DOCX file
   * @throws {DocxGenerationError} If generation fails
   * 
   * @example
   * // Simplest usage
   * const buffer = await DocxGenerator.toBuffer({
   *   content: ["Simple document from static method"]
   * });
   * 
   * @example
   * // Generate and send in one step
   * app.post('/generate', async (req, res) => {
   *   const buffer = await DocxGenerator.toBuffer(req.body);
   *   // Send document to client...
   * });
   */
    public static async toBuffer(definition: DocxDefinition): Promise<Buffer> {
        try {
            const generator = new DocxGenerator(definition);
            return await generator.generateDocxBuffer();
        } catch (error) {
            if (error instanceof DocxGenerationError) {
                throw error;
            }
            throw new DocxGenerationError('Failed to generate DOCX', error);
        }
    }
}
