import { create } from 'xmlbuilder2';
import { DocxDefinition } from '../types/types.js';
import { createText } from '../elements/text.js';
import { createTable } from '../elements/table.js';
import { createImage } from '../elements/image.js';
import { ImageManager } from './ImageManager.js';
import { RelationshipsManager } from './RelationshipsGenerator.js';
import { createParagraph } from '../elements/paragrahp.js';

/**
 * Generates the main document.xml content for a DOCX file
 * 
 * @param {DocxDefinition} definition - Document structure definition
 * @param {RelationshipsManager} relManager - Manages document relationships
 * @param {ImageManager} imageManager - Manages image registration and storage
 * @param {object} [opts] - Optional references for header/footer
 * @param {string} [opts.headerRelId] - Relationship Id for default header
 * @param {string} [opts.footerRelId] - Relationship Id for default footer
 * @returns {string} XML string for word/document.xml
 */
export function generateDocumentXml(
  definition: DocxDefinition,
  relManager: RelationshipsManager,
  imageManager: ImageManager,
  opts?: { headerRelId?: string; footerRelId?: string }
): string {
  // Create root document element with required namespaces
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('w:document', {
      'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
      'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
    })
    .ele('w:body');

  // Process each content item in the document definition
  for (const item of definition.content) {
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
      createParagraph(
        root,
        item,
        (url) => relManager.addHyperlink(url),
        (data, ext) => imageManager.registerImage(data, ext),
        (filename) => relManager.addImage(filename)
      );
    } else if (item.type === 'table') {
      createTable(
        root,
        item,
        (url) => relManager.addHyperlink(url),
        (data, ext) => imageManager.registerImage(data, ext),
        (filename) => relManager.addImage(filename)
      );
    } else if (item.type === 'image') {
      createImage(
        root,
        item,
        (data, ext) => imageManager.registerImage(data, ext),
        (filename) => relManager.addImage(filename)
      );
    }
  }

  // Add required section properties to the document
  const sectPr = root.ele('w:sectPr');

  // Optional header/footer references
  if (opts?.headerRelId) {
    sectPr.ele('w:headerReference', { 'w:type': 'default', 'r:id': opts.headerRelId });
  }
  if (opts?.footerRelId) {
    sectPr.ele('w:footerReference', { 'w:type': 'default', 'r:id': opts.footerRelId });
  }

  // Return formatted XML string
  return root.end({ prettyPrint: true });
}
