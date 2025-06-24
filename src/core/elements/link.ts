import { LinkElement } from "../types/types.js";

/**
 * Creates a hyperlink element in WordprocessingML format
 * 
 * This function:
 * 1. Creates a `<w:hyperlink>` element with relationship reference
 * 2. Applies default link styling (blue color + underline)
 * 3. Handles custom styling options (color, bold, italic, font size)
 * 4. Preserves whitespace in link text
 * 5. Marks links as visited in Word's history
 * 
 * @param {object} p - Parent XML element (from xmlbuilder2)
 * @param {LinkElement} link - Hyperlink definition object
 * @param {string} relId - Relationship ID for the hyperlink reference
 * 
 * @example
 * // Basic link
 * createlink(p, {
 *   type: 'link',
 *   text: 'Visit us',
 *   url: 'https://example.com'
 * }, 'rId2');
 * 
 * @example
 * // Styled link with custom formatting
 * createlink(p, {
 *   type: 'link',
 *   text: 'Important Link',
 *   url: 'https://example.com',
 *   style: {
 *     color: 'FF0000',    // Red color
 *     bold: true,
 *     italic: true,
 *     fontSize: 14        // Points
 *   }
 * }, 'rId3');
 */
export function createlink(p: any, link: LinkElement, relId: string) {
    // --- HYPERLINK ELEMENT CREATION ---
    // Create hyperlink element with relationship reference
    const hyperlink = p.ele('w:hyperlink', {
        'r:id': relId,      // Relationship ID reference
        'w:history': '1',   // Mark as visited in Word's history
    });

    // Create text run for the link content
    const run = hyperlink.ele('w:r');
    const style = link.style;

    // --- STYLING APPLICATIONS ---
    // Create run properties container
    const rPr = run.ele('w:rPr');
    
    // Set link color (default: Word's blue-ish color if not specified)
    rPr.ele('w:color', { 'w:val': style?.color ?? '306A7C' });
    
    // Apply underline (always applied to links by default)
    rPr.ele('w:u', { 'w:val': 'single' });

    // Apply bold style if requested
    if (style?.bold) 
        rPr.ele('w:b');
    
    // Apply italic style if requested
    if (style?.italic) 
        rPr.ele('w:i');

    // Handle font size conversion
    // Word uses half-points (so 14pt = 28 half-points)
    if (style?.fontSize) {
        const sizeVal = style.fontSize * 2;
        rPr.ele('w:sz', { 'w:val': sizeVal });
    }

    // --- TEXT CONTENT ---
    // Create text element with whitespace preservation
    // xml:space="preserve" ensures spaces in link text are maintained
    run.ele('w:t', { 'xml:space': 'preserve' }).txt(link.text);
}