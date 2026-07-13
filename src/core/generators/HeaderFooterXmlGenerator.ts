import { create } from 'xmlbuilder2';
import type { HeaderFooterDefinition, StyleText, DocumentElement, ParagraphElement, TableElement, ListElement, TextElement, LinkElement, ImageElement, FieldElement } from '../types/types.js';
import { ImageManager } from './ImageManager.js';
import { RelationshipsManager } from './RelationshipsGenerator.js';
import { NumberingManager } from './NumberingManager.js';
import { createText } from '../elements/text.js';
import { createTable } from '../elements/table.js';
import { createImage } from '../elements/image.js';
import { createParagraph } from '../elements/paragrahp.js';
import { createList } from '../elements/list.js';
import { createlink } from '../elements/link.js';
import { createField } from '../elements/field.js';

function isBlockElement(item: DocumentElement): item is ParagraphElement | TableElement | ListElement {
  if (typeof item === 'string') return false;
  return item.type === 'paragraph' || item.type === 'table' || item.type === 'list';
}

function isInlineElement(item: DocumentElement): item is string | TextElement | LinkElement | ImageElement | FieldElement {
  if (typeof item === 'string') return true;
  return item.type === 'text' || item.type === 'link' || item.type === 'field' || item.type === 'image';
}

function renderInlineItems(root: any, items: (string | TextElement | LinkElement | ImageElement | FieldElement)[], relManager: RelationshipsManager, imageManager: ImageManager, getStyle?: (id: string) => StyleText | undefined) {
  if (items.length === 0) return;
  const p = root.ele('w:p');
  for (const item of items) {
    if (typeof item === 'string') {
      createText(p, item);
    } else if (item.type === 'text') {
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
    } else if (item.type === 'link') {
      const relId = relManager.addHyperlink(item.url);
      createlink(p, item, relId);
    } else if (item.type === 'field') {
      createField(p, item);
    } else if (item.type === 'image') {
      createImage(p, item,
        (data, ext) => imageManager.registerImage(data, ext),
        filename => relManager.addImage(filename)
      );
    }
  }
}

function processContent(
  root: any,
  content: HeaderFooterDefinition['content'],
  relManager: RelationshipsManager,
  imageManager: ImageManager,
  numberingManager: NumberingManager,
  getStyle?: (id: string) => StyleText | undefined
) {
  let inlineBuffer: (string | TextElement | LinkElement | ImageElement | FieldElement)[] = [];

  const flushInlines = () => {
    renderInlineItems(root, inlineBuffer, relManager, imageManager, getStyle);
    inlineBuffer = [];
  };

  for (const item of content || []) {
    if (isBlockElement(item)) {
      flushInlines();

      if (item.type === 'paragraph') {
        createParagraph(
          root, item,
          url => relManager.addHyperlink(url),
          (data, ext) => imageManager.registerImage(data, ext),
          filename => relManager.addImage(filename),
          getStyle
        );
      } else if (item.type === 'table') {
        createTable(
          root, item,
          url => relManager.addHyperlink(url),
          (data, ext) => imageManager.registerImage(data, ext),
          filename => relManager.addImage(filename)
        );
      } else if (item.type === 'list') {
        const indentTwips = item.style?.indentTwips ?? 720;
        const hangingTwips = item.style?.hangingTwips ?? 360;
        const numId = numberingManager.addList(item.variant ?? 'unordered', indentTwips, hangingTwips);
        createList(
          root, item, numId,
          url => relManager.addHyperlink(url),
          (data, ext) => imageManager.registerImage(data, ext),
          filename => relManager.addImage(filename)
        );
      }
    } else if (isInlineElement(item)) {
      inlineBuffer.push(item);
    }
  }

  flushInlines();
}

export function generateHeaderXml(
  def: HeaderFooterDefinition,
  relManager: RelationshipsManager,
  imageManager: ImageManager,
  numberingManager: NumberingManager,
  getStyle?: (id: string) => StyleText | undefined
): string {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('w:hdr', {
      'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
      'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
    });

  processContent(root, def.content, relManager, imageManager, numberingManager, getStyle);

  return root.end({ prettyPrint: true });
}

export function generateFooterXml(
  def: HeaderFooterDefinition,
  relManager: RelationshipsManager,
  imageManager: ImageManager,
  numberingManager: NumberingManager,
  getStyle?: (id: string) => StyleText | undefined
): string {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('w:ftr', {
      'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
      'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
    });

  processContent(root, def.content, relManager, imageManager, numberingManager, getStyle);

  return root.end({ prettyPrint: true });
}
