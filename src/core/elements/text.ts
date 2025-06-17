import { TextElement, StyleText } from "../types/types.js";

/**
 * Creates a WordprocessingML text run (`<w:r>`) element with optional styling
 * 
 * @param {object} p - Parent XML element from xmlbuilder2
 * @param {string | TextElement} input - Text content or TextElement object
 * @param {StyleText} [defaultStyle] - Default styles to apply if not overridden
 * 
 * @example
 * // Simple string
 * createText(p, "Hello World");
 * 
 * @example
 * // TextElement with styling
 * createText(p, {
 *   type: 'text',
 *   text: 'Important',
 *   style: { bold: true, color: 'FF0000' }
 * });
 * 
 * @example
 * // With default style
 * createText(p, "Default styled", { fontSize: 12 });
 */
export function createText(p: any, input: string | TextElement, defaultStyle?: StyleText) {
  const text = typeof input === 'string' ? input : input.text;

  const style = typeof input === 'string'
    ? defaultStyle
    : input.style || defaultStyle;

  const run = p.ele('w:r');

  if (style) {
    const rPr = run.ele('w:rPr');
    
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
    
    // Font size (converts points to half-points)
    if (style.fontSize) {
      const sizeVal = style.fontSize * 2;
      rPr.ele('w:sz', { 'w:val': sizeVal });
    }
  }

  // Create text element with whitespace preservation
  run.ele('w:t', { 'xml:space': 'preserve' }).txt(text);
}