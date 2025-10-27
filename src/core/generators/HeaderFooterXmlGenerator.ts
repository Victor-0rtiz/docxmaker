import { create } from 'xmlbuilder2';
import { HeaderFooterDefinition } from '../types/types.js';
import { ImageManager } from './ImageManager.js';
import { RelationshipsManager } from './RelationshipsGenerator.js';
import { createText } from '../elements/text.js';
import { createTable } from '../elements/table.js';
import { createImage } from '../elements/image.js';
import { createParagraph } from '../elements/paragrahp.js';

/**
 * Generates word/header1.xml from a header definition
 * Reuses the same element creators as the main body.
 * 
 * @param {HeaderFooterDefinition} def
 * @param {RelationshipsManager} relManager
 * @param {ImageManager} imageManager
 * @returns {string}
 */
export function generateHeaderXml(
  def: HeaderFooterDefinition,
  relManager: RelationshipsManager,
  imageManager: ImageManager
): string {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('w:hdr', {
      'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
      'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
    });

  for (const item of def.content || []) {
    if (typeof item === 'string') {
      const p = root.ele('w:p'); createText(p, item);
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
        root, item,
        url => relManager.addHyperlink(url),
        (data, ext) => imageManager.registerImage(data, ext),
        filename => relManager.addImage(filename)
      );
    } else if (item.type === 'table') {
      createTable(
        root, item,
        url => relManager.addHyperlink(url),
        (data, ext) => imageManager.registerImage(data, ext),
        filename => relManager.addImage(filename)
      );
    } else if (item.type === 'image') {
      createImage(
        root, item,
        (data, ext) => imageManager.registerImage(data, ext),
        filename => relManager.addImage(filename)
      );
    }
  }

  return root.end({ prettyPrint: true });
}

/**
 * Generates word/footer1.xml from a footer definition
 * 
 * @param {HeaderFooterDefinition} def
 * @param {RelationshipsManager} relManager
 * @param {ImageManager} imageManager
 * @returns {string}
 */
export function generateFooterXml(
  def: HeaderFooterDefinition,
  relManager: RelationshipsManager,
  imageManager: ImageManager
): string {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('w:ftr', {
      'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
      'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
    });

  for (const item of def.content || []) {
    if (typeof item === 'string') {
      const p = root.ele('w:p'); createText(p, item);
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
        root, item,
        url => relManager.addHyperlink(url),
        (data, ext) => imageManager.registerImage(data, ext),
        filename => relManager.addImage(filename)
      );
    } else if (item.type === 'table') {
      createTable(
        root, item,
        url => relManager.addHyperlink(url),
        (data, ext) => imageManager.registerImage(data, ext),
        filename => relManager.addImage(filename)
      );
    } else if (item.type === 'image') {
      createImage(
        root, item,
        (data, ext) => imageManager.registerImage(data, ext),
        filename => relManager.addImage(filename)
      );
    }
  }

  return root.end({ prettyPrint: true });
}
