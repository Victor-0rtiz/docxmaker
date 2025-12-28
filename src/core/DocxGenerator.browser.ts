import JSZip from 'jszip';

import { RelationshipsManager } from './generators/RelationshipsGenerator.js';
import { ImageManager } from './generators/ImageManager.js';
import type { DocxDefinition } from './types/types.js';
import { generateDocumentXml } from './generators/DocumentXmlGenerator.js';
import { generateContentTypesXml } from './generators/ContentTypesGenerator.js';
import { DocxGenerationError } from './DocxGenerationError.js';
import { generateHeaderXml, generateFooterXml } from './generators/HeaderFooterXmlGenerator.js';

import { resolveAssetsWeb } from './adapters/resolveAssets.web.js';

/**
 * Normalizes a filename so it always ends with the `.docx` extension.
 * Rejects other extensions to avoid confusing downloads such as `.zip`.
 *
 * @param {string} name Desired filename provided by consumers.
 * @returns {string} Sanitized filename ending with `.docx`.
 * @throws {DocxGenerationError} When another extension is supplied.
 */
function ensureDocxName(name: string): string {
  const lower = name.toLowerCase();

  if (lower.endsWith('.docx')) return name;

  // if user typed some extension other than .docx, reject
  if (/\.[a-z0-9]+$/i.test(name)) {
    throw new DocxGenerationError(
      `Output file must use .docx extension. Received "${name}".`
    );
  }

  return `${name}.docx`;
}

/**
 * Triggers a download for the provided Blob using an ephemeral anchor.
 *
 * @param {Blob} blob Generated DOCX payload in the browser.
 * @param {string} filename Final filename to suggest in the download dialog.
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Generates DOCX documents from structured definitions (Browser version).
 *
 * - save("file.docx") triggers a download
 * - supports images as base64, Uint8Array/ArrayBuffer, Blob/File, or { url }
 */
export class DocxGenerator {
  private relManager: RelationshipsManager;
  private imageManager: ImageManager;

  /**
   * Creates a DOCX generator instance for browser runtimes.
   *
   * @param {DocxDefinition} definition Structured document definition.
   * @throws {DocxGenerationError} When `content` is missing or not an array.
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
   * Saves the generated DOCX by downloading it in the browser.
    *
    * @param {string} filename Desired download filename (without or with `.docx`).
    * @returns {Promise<void>} Resolves when the Blob is ready and the download triggers.
    * @throws {DocxGenerationError} When asset resolution or ZIP creation fails.
   */
  public async save(filename: string): Promise<void> {
    this.resetState();
    try {
      const finalName = ensureDocxName(filename);

      const zip = new JSZip();
      const resolved = await resolveAssetsWeb(this.definition);
      await this.generateZipContent(zip, resolved);

      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });

      downloadBlob(blob, finalName);
    } catch (error) {
      throw new DocxGenerationError('Failed to save DOCX file.', error);
    }
  }

  /**
    * Generates a DOCX Blob (browser).
    *
    * @returns {Promise<Blob>} Blob containing the `.docx` package.
    * @throws {DocxGenerationError} When asset resolution or ZIP creation fails.
   */
  public async generateDocxBlob(): Promise<Blob> {
    this.resetState();
    try {
      const zip = new JSZip();
      const resolved = await resolveAssetsWeb(this.definition);
      await this.generateZipContent(zip, resolved);

      return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      });
    } catch (error) {
      throw new DocxGenerationError('Failed to generate DOCX blob.', error);
    }
  }

  /**
   * Same zip generation logic as Node, including optional header/footer parts.
   *
   * @private
   * @param {JSZip} zip JSZip instance to populate.
   * @param {DocxDefinition} def Fully resolved document definition (no remote assets pending).
   * @returns {Promise<void>} Resolves once every OPC part is enqueued in the archive.
   */
  private async generateZipContent(zip: JSZip, def: DocxDefinition): Promise<void> {
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

    const documentXml = generateDocumentXml(def, this.relManager, this.imageManager, {
      headerRelId,
      footerRelId,
    });

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
   * Static helper for browsers that only need a Blob result.
   *
   * @param {DocxDefinition} definition Document definition to render.
   * @returns {Promise<Blob>} Blob containing the generated file.
   */
  public static async toBlob(definition: DocxDefinition): Promise<Blob> {
    const generator = new DocxGenerator(definition);
    return generator.generateDocxBlob();
  }
}
