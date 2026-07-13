import type { ListElement, ParagraphContent } from '../types/types.js';
import { createText } from './text.js';
import { createlink } from './link.js';
import { createImage } from './image.js';
import { createField } from './field.js';

/**
 * Creates a proper Word list using numbering.xml.

 * @param parent - Parent XML element (root/body, header, footer)
 * @param list - List definition
 * @param numId - Numbering ID from NumberingManager
 * @param getHyperlinkRelId - Callback to register hyperlinks
 * @param registerImage - Callback to register images
 * @param getImageRelId - Callback to get image relationship Id
 */
export function createList(
  parent: any,
  list: ListElement,
  numId: number,
  getHyperlinkRelId: (url: string) => string,
  registerImage: (data: Uint8Array, extension: string) => string,
  getImageRelId: (filename: string) => string
) {
  const renderItemContent = (p: any, parts: ParagraphContent[]) => {
    for (const part of parts) {
      if (typeof part === 'string' || part.type === 'text') {
        createText(p, part as any, list.style);
      } else if (part.type === 'link') {
        const relId = getHyperlinkRelId(part.url);
        createlink(p, part as any, relId);
      } else if (part.type === 'image') {
        createImage(p, part as any, registerImage, getImageRelId);
      } else if (part.type === 'field') {
        createField(p, part as any, list.style);
      }
    }
  };

  for (const itemParts of list.items) {
    const p = parent.ele('w:p');

    const pPr = p.ele('w:pPr');
    const numPr = pPr.ele('w:numPr');
    numPr.ele('w:ilvl', { 'w:val': '0' });
    numPr.ele('w:numId', { 'w:val': numId.toString() });

    renderItemContent(p, itemParts);
  }
}
