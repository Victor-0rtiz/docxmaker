import type { ListElement, ParagraphContent } from '../types/types.js';
import { createText } from './text.js';
import { createlink } from './link.js';
import { createImage } from './image.js';
import { createField } from './field.js';

/**
 * Creates a simple list by generating one paragraph per item.
 * Does NOT use numbering.xml (keeps the package minimal).
 *
 * @param {object} parent - Parent XML element (root/body, header, footer)
 * @param {ListElement} list - List definition
 * @param {function} getHyperlinkRelId - Callback to register hyperlinks
 * @param {function} registerImage - Callback to register images
 * @param {function} getImageRelId - Callback to get image relationship Id
 *
 * @example
 * {
 *   type:'list',
 *   variant:'ordered',
 *   items: [
 *     ['First item ', { type:'field', field:'PAGE' }],
 *     ['Second item']
 *   ]
 * }
 */
export function createList(
  parent: any,
  list: ListElement,
  getHyperlinkRelId: (url: string) => string,
  registerImage: (data: Uint8Array, extension: string) => string,
  getImageRelId: (filename: string) => string
) {
  const variant = list.variant ?? 'unordered';
  const indentTwips = list.style?.indentTwips ?? 720;
  const hangingTwips = list.style?.hangingTwips ?? 360;

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

  list.items.forEach((itemParts, idx) => {
    const p = parent.ele('w:p');

    // Paragraph properties for indent/hanging
    const pPr = p.ele('w:pPr');
    pPr.ele('w:ind', {
      'w:left': indentTwips.toString(),
      'w:hanging': hangingTwips.toString(),
    });

    // Prefix: bullet or number
    const prefix = variant === 'ordered' ? `${idx + 1}. ` : '• ';

    // Prefix as text (inherits list.style)
    createText(p, prefix, list.style);

    // Item content
    renderItemContent(p, itemParts);
  });
}
