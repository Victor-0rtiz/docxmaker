import { ParagraphElement } from "../types/types.js";
import { createlink } from "./link.js";
import { createText } from "./text.js";

/**
 * Creates a WordprocessingML paragraph (`<w:p>`) element with content and styling
 * 
 * @param {object} parent - Parent XML element from xmlbuilder2
 * @param {ParagraphElement} paragraph - Paragraph definition object
 * @param {function} getRelId - Function to generate relationship IDs for hyperlinks
 * 
 * @example
 * // Simple paragraph
 * createParagraph(root, {
 *   type: 'paragraph',
 *   content: ['Hello world'],
 *   style: { align: 'center', fontSize: 12 }
 * }, getRelId);
 * 
 * @example
 * // Paragraph with mixed content
 * createParagraph(root, {
 *   type: 'paragraph',
 *   content: [
 *     'Click ',
 *     { type: 'link', text: 'here', url: 'https://example.com' },
 *     ' to continue'
 *   ]
 * }, getRelId);
 */
export function createParagraph(parent: any, paragraph: ParagraphElement, getRelId: (url: string) => string) {
  const p = parent.ele('w:p');

  // Apply paragraph styles if defined
  if (paragraph.style) {
    const pPr = p.ele('w:pPr');
    const style = paragraph.style;

    // Create run properties for paragraph-level text styling
    const rPr = pPr.ele('w:rPr');
    
    // Text color
    if (style.color) 
      rPr.ele('w:color', { 'w:val': style.color });
    
    // Bold
    if (style.bold) 
      rPr.ele('w:b');
    
    // Italic
    if (style.italic) 
      rPr.ele('w:i');
    
    // Underline (single line)
    if (style.underline) 
      rPr.ele('w:u', { 'w:val': 'single' });

    // Paragraph alignment (convert 'justify' to 'both')
    if (style.align) {
      const wordAlign = style.align === 'justify' ? 'both' : style.align;
      pPr.ele('w:jc', { 'w:val': wordAlign });
    }

    // Font size (convert points to half-points)
    if (style.fontSize) {
      const sizeVal = style.fontSize * 2;
      rPr.ele('w:sz', { 'w:val': sizeVal });
    }

    // Line spacing (convert multiplier to twips: 240 twips per line unit)
    if (style.lineSpacing) {
      const spacingValue = Math.round(style.lineSpacing * 240);
      pPr.ele('w:spacing', {
        'w:line': spacingValue,
        'w:lineRule': 'auto' // 'auto' = proportional spacing
      });
    }
  }

  // Process each content element in the paragraph
  for (const part of paragraph.content) {
    if (typeof part === 'string' || part.type === 'text') {
      // Handle both string literals and TextElement objects
      createText(p, part, paragraph.style);
    } else if (part.type === 'link') {
      // Generate relationship ID and create hyperlink
      const relId = getRelId(part.url);
      createlink(p, part, relId);
    }
  }
}