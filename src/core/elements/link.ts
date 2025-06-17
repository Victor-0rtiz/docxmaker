import { LinkElement } from "../types/types.js";

/**
 * Creates a WordprocessingML hyperlink (`<w:hyperlink>`) element
 * 
 * @param {object} p - Parent XML element from xmlbuilder2
 * @param {LinkElement} link - Hyperlink definition object
 * @param {string} relId - Relationship ID for the hyperlink (from getRelId)
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
 * // Styled link
 * createlink(p, {
 *   type: 'link',
 *   text: 'Click here',
 *   url: 'https://example.com',
 *   style: {
 *     color: 'FF0000',
 *     bold: true,
 *     fontSize: 14
 *   }
 * }, 'rId3');
 */
export function createlink(p: any, link: LinkElement, relId: string) {
    // Create hyperlink element with relationship reference
    const hyperlink = p.ele('w:hyperlink', {
        'r:id': relId,       // Relationship ID
        'w:history': '1',     // Mark as visited in Word's history
    });

    const run = hyperlink.ele('w:r');
    const style = link.style;

    // Apply link styling (defaults + custom styles)
    const rPr = run.ele('w:rPr');
    
    // Default link color (blue-ish) if not specified
    rPr.ele('w:color', { 'w:val': style?.color ?? '306A7C' });
    
    // Always underline links by default
    rPr.ele('w:u', { 'w:val': 'single' });

    // Optional bold style
    if (style?.bold) 
        rPr.ele('w:b');
    
    // Optional italic style
    if (style?.italic) 
        rPr.ele('w:i');

    // Font size conversion (points → half-points)
    if (style?.fontSize) {
        const sizeVal = style.fontSize * 2;
        rPr.ele('w:sz', { 'w:val': sizeVal });
    }

    // Create text element with whitespace preservation
    run.ele('w:t', { 'xml:space': 'preserve' }).txt(link.text);
}