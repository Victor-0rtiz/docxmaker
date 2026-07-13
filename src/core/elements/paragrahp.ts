import type { ParagraphElement, StyleText } from "../types/types.js";
import { createImage } from "./image.js";
import { createlink } from "./link.js";
import { createText } from "./text.js";
import { createField } from "./field.js";

/**
 * Creates a WordprocessingML paragraph (`<w:p>`) with optional styling.
 *
 * Supports:
 * - Registered styles via `style: 'Heading1'` (looked up through `getStyle`)
 * - Inline styles: color, bold, italic, underline, fontSize, align, lineSpacing
 * - Mixed content: text, hyperlinks, fields, and images
 *
 * @param parent - Parent XML element (from xmlbuilder2)
 * @param paragraph - Paragraph element definition
 * @param getHyperlinkRelId - Callback to register hyperlinks
 * @param registerImage - Callback to register images
 * @param getImageRelId - Callback to get image relationship Id
 * @param getStyle - Callback to resolve registered style by id
 */
export function createParagraph(
  parent: any,
  paragraph: ParagraphElement,
  getHyperlinkRelId: (url: string) => string,
  registerImage: (data: Uint8Array, extension: string) => string,
  getImageRelId: (filename: string) => string,
  getStyle?: (id: string) => StyleText | undefined
) {
  const p = parent.ele('w:p');
  const style = paragraph.style;

  let pPr: any = null;

  if (typeof style === 'string') {
    pPr = p.ele('w:pPr');
    pPr.ele('w:pStyle', { 'w:val': style });
  } else if (style) {
    pPr = p.ele('w:pPr');
    const rPr = pPr.ele('w:rPr');

    if (style.color)
      rPr.ele('w:color', { 'w:val': style.color });

    if (style.bold)
      rPr.ele('w:b');

    if (style.italic)
      rPr.ele('w:i');

    if (style.underline)
      rPr.ele('w:u', { 'w:val': 'single' });

    if (style.align) {
      const wordAlign = style.align === 'justify' ? 'both' : style.align;
      pPr.ele('w:jc', { 'w:val': wordAlign });
    }

    if (style.fontSize) {
      const sizeVal = style.fontSize * 2;
      rPr.ele('w:sz', { 'w:val': sizeVal });
    }

    if (style.lineSpacing) {
      const spacingValue = Math.round(style.lineSpacing * 240);
      pPr.ele('w:spacing', {
        'w:line': spacingValue,
        'w:lineRule': 'auto'
      });
    }
  }

  for (const part of paragraph.content) {
    if (typeof part === 'string' || part.type === 'text') {
      createText(p, part, typeof style === 'object' ? style : undefined);
    } else if (part.type === 'link') {
      const relId = getHyperlinkRelId(part.url);
      createlink(p, part, relId);
    } else if (part.type === 'field') {
      createField(p, part, typeof style === 'object' ? style : undefined);
    } else if (part.type === 'image') {
      createImage(p, part, registerImage, getImageRelId);
    }
  }
}
