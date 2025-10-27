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
 *       image: { path: 'logo.png' } // Se leerá async automáticamente
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

      // 1) Resolver assets async (p. ej. imágenes { path } → Buffer)
      const resolved = await this.resolveAssets(this.definition);

      // 2) Generar contenido del zip a partir de la definición resuelta
      await this.generateZipContent(zip, resolved);

      // 3) Stream a disco
      await new Promise<void>((resolve, reject) => {
        zip
          .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
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

      // 1) Resolver assets async
      const resolved = await this.resolveAssets(this.definition);

      // 2) Generar contenido del zip
      await this.generateZipContent(zip, resolved);

      // 3) Emitir buffer
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
   * Recibe la definición **ya resuelta** (sin `{ path }`, sólo Buffers/base64),
   * genera el `document.xml`, agrega tipos de contenido, relaciones e imágenes.
   * 
   * @private
   * @param {JSZip} zip - JSZip instance to populate
   * @param {DocxDefinition} def - Document definition **resuelta** (sin paths)
   * @returns {Promise<void>}
   */
  private async generateZipContent(zip: JSZip, def: DocxDefinition): Promise<void> {
    // Generate main document XML
    const documentXml = generateDocumentXml(
      def,
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
   * Resolves external assets asynchronously before XML generation.
   * 
   * Convierte cualquier imagen declarada como `{ path: string }`
   * en un `Buffer` usando `fs.promises.readFile`. Deja intactas las
   * imágenes que ya vienen en `Buffer` o `base64`.
   * 
   * Recorre recursivamente `content`, `paragraph.content`, `table.rows[].cells[].content`, etc.
   * 
   * @private
   * @param {DocxDefinition} def - Original document definition
   * @returns {Promise<DocxDefinition>} New definition with all images resolved to Buffer/base64
   * 
   * @example
   * const resolved = await resolveAssets({
   *   content: [{ type:'image', image:{ path:'./logo.png' } }]
   * });
   * // resolved.content[0].image será un Buffer
   */
  private async resolveAssets(def: DocxDefinition): Promise<DocxDefinition> {
    // Clonado profundo (Node 18+). Si tu runtime no tiene structuredClone,
    // puedes cambiarlo por un clon manual.
    const deepClone: DocxDefinition =
      typeof structuredClone === 'function'
        ? structuredClone(def)
        : JSON.parse(JSON.stringify(def));

    const processItem = async (item: any): Promise<any> => {
      if (typeof item === 'string') return item;

      if (item?.type === 'image') {
        const img = item.image;
        if (img && typeof img === 'object' && 'path' in img && typeof img.path === 'string') {
          // ✅ lectura asíncrona sin fs/promises extra: usamos fs.promises
          const data = await fs.promises.readFile(img.path);
          return { ...item, image: data };
        }
        return item; // Ya es Buffer o string base64/data URI
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

      // Cualquier otro nodo con `content` en array:
      if (item?.content && Array.isArray(item.content)) {
        const content = [];
        for (const c of item.content) content.push(await processItem(c));
        return { ...item, content };
      }

      return item;
    };

    const out = [];
    for (const it of deepClone.content) out.push(await processItem(it));
    return { ...deepClone, content: out };
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
