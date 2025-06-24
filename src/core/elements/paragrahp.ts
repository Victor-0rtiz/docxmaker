import { ParagraphElement } from "../types/types.js";
import { createImage } from "./image.js";
import { createlink } from "./link.js";
import { createText } from "./text.js";

/**
 * Creates a WordprocessingML paragraph element with content and styling
 * 
 * This function:
 * 1. Creates a `<w:p>` (paragraph) element
 * 2. Applies paragraph-level styling (alignment, line spacing)
 * 3. Applies run-level styling (text formatting)
 * 4. Handles mixed content types within the paragraph:
 *    - Plain text
 *    - Formatted text
 *    - Hyperlinks
 *    - Images
 * 
 * @param {object} parent - Parent XML element (from xmlbuilder2)
 * @param {ParagraphElement} paragraph - Paragraph definition object
 * @param {function} getHyperlinkRelId - Callback to get relationship ID for hyperlinks
 * @param {function} registerImage - Callback to register images
 * @param {function} getImageRelId - Callback to get relationship ID for images
 * 
 * @example
 * // Simple paragraph
 * createParagraph(root, {
 *   type: 'paragraph',
 *   content: ['Hello world'],
 *   style: { align: 'center', fontSize: 12 }
 * }, getRelId, registerImage, getImageRelId);
 * 
 * @example
 * // Mixed content paragraph
 * createParagraph(root, {
 *   type: 'paragraph',
 *   content: [
 *     'Click ',
 *     { 
 *       type: 'link', 
 *       text: 'here', 
 *       url: 'https://example.com',
 *       style: { color: 'FF0000', bold: true }
 *     },
 *     ' to see our ',
 *     { 
 *       type: 'image',
 *       image: fs.readFileSync('logo.png'),
 *       width: 100,
 *       alt: 'Company Logo'
 *     }
 *   ],
 *   style: {
 *     align: 'center',
 *     lineSpacing: 1.5,
 *     color: '333333'
 *   }
 * }, getRelId, registerImage, getImageRelId);
 */
export function createParagraph(
  parent: any,
  paragraph: ParagraphElement,
  getHyperlinkRelId: (url: string) => string,
  registerImage: (data: Buffer, extension: string) => string,
  getImageRelId: (filename: string) => string
) {
  // Create paragraph element
  const p = parent.ele('w:p');

  // Apply paragraph styles if defined
  if (paragraph.style) {
    const pPr = p.ele('w:pPr');
    const style = paragraph.style;

    // Create run properties for paragraph-level text styling
    const rPr = pPr.ele('w:rPr');

    // --- TEXT FORMATTING ---
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

    // --- PARAGRAPH FORMATTING ---
    // Paragraph alignment (convert 'justify' to Word's 'both')
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
    // Handle plain text or text elements
    if (typeof part === 'string' || part.type === 'text') {
      createText(p, part, paragraph.style);
    } 
    
    // Handle hyperlinks
    else if (part.type === 'link') {
      const relId = getHyperlinkRelId(part.url);
      createlink(p, part, relId);
    } 
    
    // Handle images
    else if (part.type === 'image') {
      createImage(
        p,
        part,
        registerImage,
        getImageRelId
      );
    }
  }
}