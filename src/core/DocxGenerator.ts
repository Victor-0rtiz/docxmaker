import JSZip from 'jszip';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { RelationshipsManager } from './generators/RelationshipsGenerator.js';
import { ImageManager } from './generators/ImageManager.js';
import { NumberingManager } from './generators/NumberingManager.js';
import type { DocxDefinition } from './types/types.js';
import { generateDocumentXml } from './generators/DocumentXmlGenerator.js';
import { generateContentTypesXml } from './generators/ContentTypesGenerator.js';
import { DocxGenerationError } from './DocxGenerationError.js';
import { generateHeaderXml, generateFooterXml } from './generators/HeaderFooterXmlGenerator.js';

import { resolveAssetsNode } from './adapters/resolveAssets.node.js';

export class DocxGenerator {
  private relManager: RelationshipsManager;
  private imageManager: ImageManager;
  private numberingManager: NumberingManager;

  constructor(private definition: DocxDefinition) {
    if (!definition || !Array.isArray(definition.content)) {
      throw new DocxGenerationError('Invalid document definition. "content" must be an array.');
    }
    this.relManager = new RelationshipsManager();
    this.imageManager = new ImageManager();
    this.numberingManager = new NumberingManager();
  }

  private resetState(): void {
    this.relManager.reset();
    this.imageManager.reset();
    this.numberingManager.reset();
  }

  private ensureDocxPath(outputPath: string): string {
    const ext = path.extname(outputPath);
    if (!ext) return `${outputPath}.docx`;
    if (ext.toLowerCase() !== '.docx') {
      throw new DocxGenerationError(`Output file must use .docx extension. Received "${ext}".`);
    }
    return outputPath;
  }

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

  private async generateZipContent(zip: JSZip, def: DocxDefinition): Promise<void> {
    let headerRelId: string | undefined;
    let footerRelId: string | undefined;

    const hasHeader = !!def.header?.content?.length;
    const hasFooter = !!def.footer?.content?.length;

    if (hasHeader && def.header) {
      const headerXml = generateHeaderXml(def.header, this.relManager, this.imageManager, this.numberingManager);
      zip.folder('word')?.file('header1.xml', headerXml);
      headerRelId = this.relManager.addHeader('header1.xml');
    }

    if (hasFooter && def.footer) {
      const footerXml = generateFooterXml(def.footer, this.relManager, this.imageManager, this.numberingManager);
      zip.folder('word')?.file('footer1.xml', footerXml);
      footerRelId = this.relManager.addFooter('footer1.xml');
    }

    const documentXml = generateDocumentXml(def, this.relManager, this.imageManager, this.numberingManager, {
      headerRelId,
      footerRelId,
    });

    const hasNumbering = this.numberingManager.hasDefinitions();

    zip.file('[Content_Types].xml', generateContentTypesXml({ hasHeader, hasFooter, hasNumbering }));
    zip.folder('_rels')?.file('.rels', RelationshipsManager.generateMainRelsXml());
    zip.folder('word')?.file('document.xml', documentXml);

    if (hasNumbering) {
      this.relManager.addNumbering();
      zip.folder('word')?.file('numbering.xml', this.numberingManager.generateXml());
    }

    this.imageManager.saveImagesToZip(zip);

    if (this.relManager.hasRelationships()) {
      const relsXml = this.relManager.generateDocumentRelsXml();
      zip.folder('word')?.folder('_rels')?.file('document.xml.rels', relsXml);
    }
  }

  public static async toBuffer(definition: DocxDefinition): Promise<Uint8Array> {
    const generator = new DocxGenerator(definition);
    return generator.generateDocxBuffer();
  }

  public static async toBlob(definition: DocxDefinition): Promise<Blob> {
    const generator = new DocxGenerator(definition);
    return generator.generateDocxBlob();
  }
}
