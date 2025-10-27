import JSZip from 'jszip';
import * as fs from 'fs';
import { RelationshipsManager } from './generators/RelationshipsGenerator.js';
import { ImageManager } from './generators/ImageManager.js';
import { DocxDefinition } from './types/types.js';
import { generateDocumentXml } from './generators/DocumentXmlGenerator.js';
import { generateContentTypesXml } from './generators/ContentTypesGenerator.js';
import { DocxGenerationError } from './DocxGenerationError.js';
import { generateHeaderXml, generateFooterXml } from './generators/HeaderFooterXmlGenerator.js';
import * as path from 'path';

/**
 * Generates DOCX documents from structured definitions.
 * 
 * @example
 * const docDefinition: DocxDefinition = {
 *   header: { content: ["Mi Empresa"] },
 *   footer: { content: ["Página "] },
 *   content: [
 *     "Hello World!",
 *     { type: "paragraph", content: ["Visit ", { type: "link", text: "Google", url: "https://google.com" }] },
 *     { type: "image", image: { path: "logo.png" } }
 *   ]
 * };
 * const generator = new DocxGenerator(docDefinition);
 * await generator.save('output.docx');
 */
export class DocxGenerator {
    private relManager: RelationshipsManager;
    private imageManager: ImageManager;

    /**
     * Creates a DOCX generator instance
     * @param {DocxDefinition} definition - Document structure definition
     * @throws {DocxGenerationError} If definition is invalid
     */
    constructor(private definition: DocxDefinition) {
        if (!definition || !Array.isArray(definition.content)) {
            throw new DocxGenerationError('Invalid document definition. "content" must be an array.');
        }
        this.relManager = new RelationshipsManager();
        this.imageManager = new ImageManager();
    }

    /** @private */
    private resetState(): void {
        this.relManager.reset();
        this.imageManager.reset();
    }

    /**
     * Saves the generated DOCX to disk
     * @param {string} outputPath - File path to save the document
     * @returns {Promise<void>}
     * @throws {DocxGenerationError} If saving fails
     */
    public async save(outputPath: string): Promise<void> {
        this.resetState();
        try {
            //  Enforce .docx extension
            const finalPath = this.ensureDocxPath(outputPath);

            const zip = new JSZip();
            const resolved = await this.resolveAssets(this.definition);
            await this.generateZipContent(zip, resolved);

            await new Promise<void>((resolve, reject) => {
                zip
                    .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                    .pipe(fs.createWriteStream(finalPath))
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
     */
    public async generateDocxBuffer(): Promise<Buffer> {
        this.resetState();
        try {
            const zip = new JSZip();
            const resolved = await this.resolveAssets(this.definition);
            await this.generateZipContent(zip, resolved);
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
     * 
     * Receives the definition **already resolved** (no `{ path }`, only Buffers/base64),
     * generates XML parts (document, header, footer), content-types, relationships and images.
     * 
     * @private
     * @param {JSZip} zip - JSZip instance to populate
     * @param {DocxDefinition} def - Resolved document definition
     * @returns {Promise<void>}
     */
    private async generateZipContent(zip: JSZip, def: DocxDefinition): Promise<void> {
        // 1) Optional header/footer parts
        let headerRelId: string | undefined;
        let footerRelId: string | undefined;

        const hasHeader = !!def.header?.content?.length;
        const hasFooter = !!def.footer?.content?.length;

        if (hasHeader && def.header) {
            const headerXml = generateHeaderXml(def.header, this.relManager, this.imageManager);
            zip.folder('word')?.file('header1.xml', headerXml);
            headerRelId = this.relManager.addHeader('header1.xml');
        }

        if (hasFooter && def.footer) {
            const footerXml = generateFooterXml(def.footer, this.relManager, this.imageManager);
            zip.folder('word')?.file('footer1.xml', footerXml);
            footerRelId = this.relManager.addFooter('footer1.xml');
        }

        // 2) Main document.xml with references
        const documentXml = generateDocumentXml(
            def,
            this.relManager,
            this.imageManager,
            { headerRelId, footerRelId }
        );

        // 3) Content types, package rels, document, media
        zip.file('[Content_Types].xml', generateContentTypesXml({ hasHeader, hasFooter }));
        zip.folder('_rels')?.file('.rels', RelationshipsManager.generateMainRelsXml());
        zip.folder('word')?.file('document.xml', documentXml);

        this.imageManager.saveImagesToZip(zip);

        if (this.relManager.hasRelationships()) {
            const relsXml = this.relManager.generateDocumentRelsXml();
            zip.folder('word')?.folder('_rels')?.file('document.xml.rels', relsXml);
        }
    }

    /**
     * Resolves external assets asynchronously before XML generation.
     * Converts `{ path: string }` images into Buffers using `fs.promises.readFile`.
     * Leaves base64/Buffer images intact. Traverses paragraphs, tables, etc.
     * 
     * @private
     * @param {DocxDefinition} def - Original document definition
     * @returns {Promise<DocxDefinition>} New definition with all images resolved to Buffer/base64
     */
    private async resolveAssets(def: DocxDefinition): Promise<DocxDefinition> {
        const deepClone: DocxDefinition =
            typeof structuredClone === 'function'
                ? structuredClone(def)
                : JSON.parse(JSON.stringify(def));

        const processItem = async (item: any): Promise<any> => {
            if (typeof item === 'string') return item;

            if (item?.type === 'image') {
                const img = item.image;
                if (img && typeof img === 'object' && 'path' in img && typeof img.path === 'string') {
                    const data = await fs.promises.readFile(img.path);
                    return { ...item, image: data };
                }
                return item;
            }

            if (item?.type === 'paragraph' && Array.isArray(item.content)) {
                const content = [];
                for (const c of item.content) content.push(await processItem(c));
                return { ...item, content };
            }

            if (item?.type === 'table' && Array.isArray(item.rows)) {
                const rows = [];
                for (const row of item.rows ?? []) {
                    const cells = [];
                    for (const cell of row.cells ?? []) {
                        const cellContent = [];
                        for (const c of (cell.content ?? [])) cellContent.push(await processItem(c));
                        cells.push({ ...cell, content: cellContent });
                    }
                    rows.push({ ...row, cells });
                }
                return { ...item, rows };
            }

            if (item?.content && Array.isArray(item.content)) {
                const content = [];
                for (const c of item.content) content.push(await processItem(c));
                return { ...item, content };
            }

            return item;
        };

        const out = [];
        for (const it of deepClone.content) out.push(await processItem(it));

        // Header/Footer content resolution too
        let header = deepClone.header;
        if (header?.content?.length) {
            const content = [];
            for (const c of header.content) content.push(await processItem(c));
            header = { ...header, content };
        }
        let footer = deepClone.footer;
        if (footer?.content?.length) {
            const content = [];
            for (const c of footer.content) content.push(await processItem(c));
            footer = { ...footer, content };
        }

        return { ...deepClone, content: out, header, footer };
    }



    /**
   * Ensures the output filename uses a .docx extension.
   * If no extension is provided, appends ".docx".
   * If a different extension is provided, throws an error.
   * 
   * @private
   * @param {string} outputPath
   * @returns {string} Sanitized path ending with .docx
   * @throws {DocxGenerationError} if the extension is not .docx
   */
    private ensureDocxPath(outputPath: string): string {
        const ext = path.extname(outputPath);
        if (!ext) return `${outputPath}.docx`;
        if (ext.toLowerCase() !== '.docx') {
            throw new DocxGenerationError(
                `Output file must use .docx extension. Received "${ext}".`
            );
        }
        return outputPath;
    }


    /**
     * Static method to generate DOCX as Buffer from definition
     * @static
     * @param {DocxDefinition} definition - Document definition
     * @returns {Promise<Buffer>} Buffer containing the DOCX file
     * @throws {DocxGenerationError} If generation fails
     */
    public static async toBuffer(definition: DocxDefinition): Promise<Buffer> {
        const generator = new DocxGenerator(definition);
        return generator.generateDocxBuffer();
    }
}
