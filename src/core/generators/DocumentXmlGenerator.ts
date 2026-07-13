import { create } from 'xmlbuilder2';
import type { DocxDefinition, StyleText, PageConfig } from '../types/types.js';
import { createText } from '../elements/text.js';
import { createTable } from '../elements/table.js';
import { createImage } from '../elements/image.js';
import { ImageManager } from './ImageManager.js';
import { RelationshipsManager } from './RelationshipsGenerator.js';
import { NumberingManager } from './NumberingManager.js';
import { StylesManager } from './StylesManager.js';
import { createParagraph } from '../elements/paragrahp.js';
import { createList } from '../elements/list.js';
import { getPageSize, DEFAULT_MARGINS } from '../../utils/page.js';

export function generateDocumentXml(
  definition: DocxDefinition,
  relManager: RelationshipsManager,
  imageManager: ImageManager,
  numberingManager: NumberingManager,
  stylesManager: StylesManager,
  opts?: { headerRelId?: string; footerRelId?: string }
): string {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('w:document', {
      'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
      'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
    })
    .ele('w:body');

  const getStyle = (id: string): StyleText | undefined => {
    return stylesManager.getStyle(id)?.style;
  };

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
        (filename) => relManager.addImage(filename),
        getStyle
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
    } else if (item.type === 'list') {
      const indentTwips = item.style?.indentTwips ?? 720;
      const hangingTwips = item.style?.hangingTwips ?? 360;
      const numId = numberingManager.addList(item.variant ?? 'unordered', indentTwips, hangingTwips);
      createList(
        root,
        item,
        numId,
        (url) => relManager.addHyperlink(url),
        (data, ext) => imageManager.registerImage(data, ext),
        (filename) => relManager.addImage(filename)
      );
    }
  }

  const sectPr = root.ele('w:sectPr');

  if (opts?.headerRelId) {
    sectPr.ele('w:headerReference', { 'w:type': 'default', 'r:id': opts.headerRelId });
  }
  if (opts?.footerRelId) {
    sectPr.ele('w:footerReference', { 'w:type': 'default', 'r:id': opts.footerRelId });
  }

  const page = definition.page;
  if (page) {
    if (page.size) {
      const { width, height } = getPageSize(page.size, page.orientation);
      sectPr.ele('w:pgSz', { 'w:w': width.toString(), 'w:h': height.toString() });
    } else if (page.orientation) {
      const { width, height } = getPageSize('A4', page.orientation);
      sectPr.ele('w:pgSz', { 'w:w': width.toString(), 'w:h': height.toString() });
    }

    const margins = { ...DEFAULT_MARGINS, ...page.margins };
    sectPr.ele('w:pgMar', {
      'w:top': margins.top.toString(),
      'w:right': margins.right.toString(),
      'w:bottom': margins.bottom.toString(),
      'w:left': margins.left.toString(),
    });
  }

  return root.end({ prettyPrint: true });
}
