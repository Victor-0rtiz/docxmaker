import JSZip from 'jszip';

import { RelationshipsManager } from './generators/RelationshipsGenerator.js';
import { ImageManager } from './generators/ImageManager.js';
import { NumberingManager } from './generators/NumberingManager.js';
import { StylesManager } from './generators/StylesManager.js';
import type { DocxDefinition, StyleText } from './types/types.js';
import { generateDocumentXml } from './generators/DocumentXmlGenerator.js';
import { generateContentTypesXml } from './generators/ContentTypesGenerator.js';
import { DocxGenerationError } from './DocxGenerationError.js';
import { generateHeaderXml, generateFooterXml } from './generators/HeaderFooterXmlGenerator.js';

import { resolveAssetsWeb } from './adapters/resolveAssets.web.js';

function ensureDocxName(name: string): string {
  const lower = name.toLowerCase();

  if (lower.endsWith('.docx')) return name;

  if (/\.[a-z0-9]+$/i.test(name)) {
    throw new DocxGenerationError(
      `Output file must use .docx extension. Received "${name}".`
    );
  }

  return `${name}.docx`;
}

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

export class DocxGenerator {
  private relManager: RelationshipsManager;
  private imageManager: ImageManager;
  private numberingManager: NumberingManager;
  private stylesManager: StylesManager;

  constructor(private definition: DocxDefinition) {
    if (!definition || !Array.isArray(definition.content)) {
      throw new DocxGenerationError('Invalid document definition. "content" must be an array.');
    }
    this.relManager = new RelationshipsManager();
    this.imageManager = new ImageManager();
    this.numberingManager = new NumberingManager();
    this.stylesManager = new StylesManager();
  }

  private resetState(): void {
    this.relManager.reset();
    this.imageManager.reset();
    this.numberingManager.reset();
    this.stylesManager.reset();
  }

  private loadStyles(): void {
    const styles = this.definition.styles;
    if (styles) {
      for (const style of styles) {
        this.stylesManager.addStyle(style);
      }
    }
  }

  private getStyleCallback = (id: string): StyleText | undefined => {
    return this.stylesManager.getStyle(id)?.style;
  };

  public async save(filename: string): Promise<void> {
    this.resetState();
    try {
      this.loadStyles();
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

  public async generateDocxBlob(): Promise<Blob> {
    this.resetState();
    try {
      this.loadStyles();
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

  public async generateDocxBuffer(): Promise<Uint8Array> {
    const blob = await this.generateDocxBlob();
    return new Uint8Array(await blob.arrayBuffer());
  }

  private async generateZipContent(zip: JSZip, def: DocxDefinition): Promise<void> {
    let headerRelId: string | undefined;
    let footerRelId: string | undefined;
    let headerXml: string | undefined;
    let footerXml: string | undefined;

    const hasHeader = !!def.header?.content?.length;
    const hasFooter = !!def.footer?.content?.length;

    // Generate all XML strings first (header/footer need to register relIds before document)
    if (hasHeader && def.header) {
      headerXml = generateHeaderXml(def.header, this.relManager, this.imageManager, this.numberingManager, this.getStyleCallback);
      headerRelId = this.relManager.addHeader('header1.xml');
    }

    if (hasFooter && def.footer) {
      footerXml = generateFooterXml(def.footer, this.relManager, this.imageManager, this.numberingManager, this.getStyleCallback);
      footerRelId = this.relManager.addFooter('footer1.xml');
    }

    const documentXml = generateDocumentXml(def, this.relManager, this.imageManager, this.numberingManager, this.stylesManager, {
      headerRelId,
      footerRelId,
    });

    const hasNumbering = this.numberingManager.hasDefinitions();
    const hasStyles = this.stylesManager.hasStyles();

    // [Content_Types].xml MUST be the first entry per OPC spec
    zip.file('[Content_Types].xml', generateContentTypesXml({ hasHeader, hasFooter, hasNumbering, hasStyles }));
    zip.folder('_rels')?.file('.rels', RelationshipsManager.generateMainRelsXml());

    const wordFolder = zip.folder('word');
    if (headerXml) wordFolder?.file('header1.xml', headerXml);
    if (footerXml) wordFolder?.file('footer1.xml', footerXml);
    wordFolder?.file('document.xml', documentXml);

    if (hasNumbering) {
      this.relManager.addNumbering();
      zip.folder('word')?.file('numbering.xml', this.numberingManager.generateXml());
    }

    if (hasStyles) {
      this.relManager.addStyles();
      zip.folder('word')?.file('styles.xml', this.stylesManager.generateXml());
    }

    this.imageManager.saveImagesToZip(zip);

    if (this.relManager.hasRelationships()) {
      const relsXml = this.relManager.generateDocumentRelsXml();
      zip.folder('word')?.folder('_rels')?.file('document.xml.rels', relsXml);
    }
  }

  public static async toBlob(definition: DocxDefinition): Promise<Blob> {
    const generator = new DocxGenerator(definition);
    return generator.generateDocxBlob();
  }

  public static async toBuffer(definition: DocxDefinition): Promise<Uint8Array> {
    const generator = new DocxGenerator(definition);
    return generator.generateDocxBuffer();
  }
}
