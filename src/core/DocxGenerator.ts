import JSZip from 'jszip';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { RelationshipsManager } from './generators/RelationshipsGenerator.js';
import { ImageManager } from './generators/ImageManager.js';
import type { DocxDefinition } from './types/types.js';
import { generateDocumentXml } from './generators/DocumentXmlGenerator.js';
import { generateContentTypesXml } from './generators/ContentTypesGenerator.js';
import { DocxGenerationError } from './DocxGenerationError.js';
import { generateHeaderXml, generateFooterXml } from './generators/HeaderFooterXmlGenerator.js';

import { resolveAssetsNode } from './adapters/resolveAssets.node.js';

/**
 * Generates DOCX documents from structured definitions (Node.js runtime).
 *
 * Handles headers, footers, hyperlinks, images, tables, and ensures all
 * required OPC parts are zipped into a valid `.docx` package.
 *
 * @example
 * const definition: DocxDefinition = {
 *   header: { content: ['Sample Company'] },
 *   footer: { content: ['Page '] },
 *   content: [
 *     'Hello World!',
 *     {
 *       type: 'paragraph',
 *       content: [
 *         'Visit ',
 *         { type: 'link', text: 'GitHub', url: 'https://github.com' },
 *       ],
 *     },
 *     { type: 'image', image: { path: 'logo.png' } },
 *   ],
 * };
 * const generator = new DocxGenerator(definition);
 * await generator.save('output.docx');
 */
export class DocxGenerator {
  private relManager: RelationshipsManager;
  private imageManager: ImageManager;

  /**
   * Creates a DOCX generator instance.
   *
   * @param {DocxDefinition} definition Document structure definition.
   * @throws {DocxGenerationError} When the definition omits a valid content array.
   */
  constructor(private definition: DocxDefinition) {
    if (!definition || !Array.isArray(definition.content)) {
      throw new DocxGenerationError('Invalid document definition. "content" must be an array.');
    }
    this.relManager = new RelationshipsManager();
    this.imageManager = new ImageManager();
  }

  /**
   * @private
   * Resets all per-export managers to avoid leaked relationships or images.
   */
  private resetState(): void {
    this.relManager.reset();
    this.imageManager.reset();
  }

  /**
   * Ensures the output filename uses a .docx extension.
   * If no extension is provided, appends ".docx".
   * If a different extension is provided, throws an error.
   *
   * @private
  * @param {string} outputPath Target path provided by the caller.
  * @returns {string} Sanitized path that always ends with .docx.
   * @throws {DocxGenerationError} When the extension is not .docx.
   */
  private ensureDocxPath(outputPath: string): string {
    const ext = path.extname(outputPath);
    if (!ext) return `${outputPath}.docx`;
    if (ext.toLowerCase() !== '.docx') {
      throw new DocxGenerationError(`Output file must use .docx extension. Received "${ext}".`);
    }
    return outputPath;
  }

  /**
   * Saves the generated DOCX package to disk.
   *
    * @param {string} outputPath Destination path for the .docx file.
    * @returns {Promise<void>} Resolves when the ZIP stream finishes writing.
   * @throws {DocxGenerationError} When asset resolution or streaming fails.
   */
  public async save(outputPath: string): Promise<void> {
    this.resetState();
    try {
      const finalPath = this.ensureDocxPath(outputPath);

      const zip = new JSZip();
      const resolved = await resolveAssetsNode(this.definition);
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
   * Returns the generated DOCX as bytes.
   *
    * @returns {Promise<Uint8Array>} Complete `.docx` payload in memory.
   * @throws {DocxGenerationError} When asset resolution or ZIP generation fails.
   */
  public async generateDocxBuffer(): Promise<Uint8Array> {
    this.resetState();
    try {
      const zip = new JSZip();
      const resolved = await resolveAssetsNode(this.definition);
      await this.generateZipContent(zip, resolved);

      const bytes = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      return new Uint8Array(bytes);
    } catch (error) {
      throw new DocxGenerationError('Failed to generate DOCX buffer.', error);
    }
  }

  /**
   * Returns the generated DOCX as a Blob.
   *
   * @returns {Promise<Blob>} Blob containing the `.docx` package.
   * @throws {DocxGenerationError} When asset resolution or ZIP generation fails.
   */
  public async generateDocxBlob(): Promise<Blob> {
    try {
      const bytes = await this.generateDocxBuffer();
      const blobPart = bytes as unknown as BlobPart;
      return new Blob([blobPart], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
    } catch (error) {
      throw new DocxGenerationError('Failed to generate DOCX blob.', error);
    }
  }

  /**
   * Generates all content for the DOCX zip file.
   *
   * Includes:
   * - header1.xml/footer1.xml (optional)
   * - document.xml referencing them via sectPr
   * - [Content_Types].xml with overrides
   * - document.xml.rels with hyperlink/image/header/footer rels
  *
  * @private
  * @param {JSZip} zip JSZip instance to populate.
  * @param {DocxDefinition} def Fully resolved document definition (buffers instead of paths).
  * @returns {Promise<void>} Resolves once every OPC part is written into the archive.
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
    const documentXml = generateDocumentXml(def, this.relManager, this.imageManager, {
      headerRelId,
      footerRelId,
    });

    // 3) Content types, package rels, document
    zip.file('[Content_Types].xml', generateContentTypesXml({ hasHeader, hasFooter }));
    zip.folder('_rels')?.file('.rels', RelationshipsManager.generateMainRelsXml());
    zip.folder('word')?.file('document.xml', documentXml);

    // 4) Images
    this.imageManager.saveImagesToZip(zip);

    // 5) Document relationships
    if (this.relManager.hasRelationships()) {
      const relsXml = this.relManager.generateDocumentRelsXml();
      zip.folder('word')?.folder('_rels')?.file('document.xml.rels', relsXml);
    }
  }

  /**
   * Static convenience helper to generate a DOCX buffer from a definition.
   *
    * @param {DocxDefinition} definition Document definition to render.
    * @returns {Promise<Uint8Array>} Bytes with the generated document.
   * @throws {DocxGenerationError} When the underlying generation fails.
   */
  public static async toBuffer(definition: DocxDefinition): Promise<Uint8Array> {
    const generator = new DocxGenerator(definition);
    return generator.generateDocxBuffer();
  }

  /**
   * Static convenience helper to generate a DOCX blob from a definition.
   *
   * @param {DocxDefinition} definition Document definition to render.
   * @returns {Promise<Blob>} Blob with the generated document.
   */
  public static async toBlob(definition: DocxDefinition): Promise<Blob> {
    const generator = new DocxGenerator(definition);
    return generator.generateDocxBlob();
  }
}
