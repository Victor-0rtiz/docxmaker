import { TextElement, StyleText } from "../types/types.js";

/**
 * Creates a WordprocessingML text run (`<w:r>`) with optional styling
 * 
 * This function handles:
 * - Plain text strings
 * - TextElement objects with custom styling
 * - Style inheritance from default styles
 * - Text formatting (color, bold, italic, underline, font size)
 * - Whitespace preservation
 * 
 * @param {object} p - Parent XML element (from xmlbuilder2)
 * @param {string | TextElement} input - Text content or TextElement object
 * @param {StyleText} [defaultStyle] - Default styles to apply if not overridden
 * 
 * @example
 * // Simple string without styling
 * createText(p, "Hello World");
 * 
 * @example
 * // TextElement with custom styling
 * createText(p, {
 *   type: 'text',
 *   text: 'Important',
 *   style: { 
 *     bold: true, 
 *     color: 'FF0000',
 *     fontSize: 14
 *   }
 * });
 * 
 * @example
 * // With default style inheritance
 * createText(p, "Default styled text", { 
 *   fontSize: 12,
 *   color: '333333' 
 * });
 * 
 * @example
 * // Overriding default styles
 * createText(p, {
 *   type: 'text',
 *   text: 'Overridden',
 *   style: { color: '00FF00' } // Overrides default color
 * }, { 
 *   color: 'FF0000',
 *   bold: true
 * });
 */
export function createText(p: any, input: string | TextElement, defaultStyle?: StyleText) {
  // --- TEXT CONTENT EXTRACTION ---
  // Determine text content and styling source
  const text = typeof input === 'string' ? input : input.text;
  
  // Style precedence: 
  // 1. Element-specific styles (if input is TextElement)
  // 2. Default styles (if provided)
  const style = typeof input === 'string'
    ? defaultStyle
    : input.style || defaultStyle;

  // --- RUN CREATION ---
  // Create text run element
  const run = p.ele('w:r');

  // --- STYLING APPLICATION ---
  // Create run properties if styling is needed
  if (style) {
    const rPr = run.ele('w:rPr');
    
    // Text color (hex value without #)
    if (style.color) 
      rPr.ele('w:color', { 'w:val': style.color });
    
    // Bold formatting
    if (style.bold) 
      rPr.ele('w:b');
    
    // Italic formatting
    if (style.italic) 
      rPr.ele('w:i');
    
    // Underline (single line)
    if (style.underline) 
      rPr.ele('w:u', { 'w:val': 'single' });
    
    // Font size conversion (points → half-points)
    if (style.fontSize) {
      const sizeVal = style.fontSize * 2;
      rPr.ele('w:sz', { 'w:val': sizeVal });
    }
  }

  // --- TEXT CONTENT ---
  // Create text element with whitespace preservation
  // xml:space="preserve" ensures spaces are maintained
  run.ele('w:t', { 'xml:space': 'preserve' }).txt(text);
}