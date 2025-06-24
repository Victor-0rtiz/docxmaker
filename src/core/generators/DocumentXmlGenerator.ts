import { create } from 'xmlbuilder2';
import { DocxDefinition } from '../types/types.js';
import { createText } from '../elements/text.js';
import { createTable } from '../elements/table.js';
import { createImage } from '../elements/image.js';
import { ImageManager } from './ImageManager.js';
import { RelationshipsManager } from './RelationshipsGenerator.js';
import { createParagraph } from '../elements/paragrahp.js';

/**
 * Generates the main document.xml content for a DOCX file
 * 
 * This function:
 * 1. Creates the root document structure with required namespaces
 * 2. Processes each content element in the document definition
 * 3. Delegates to specialized element creators (text, paragraph, table, image)
 * 4. Manages relationships and images through provided managers
 * 5. Handles paragraph styling and formatting
 * 6. Adds required section properties at the end
 * 
 * @param {DocxDefinition} definition - Document structure definition
 * @param {RelationshipsManager} relManager - Manages document relationships
 * @param {ImageManager} imageManager - Manages image registration and storage
 * @returns {string} XML string for word/document.xml
 * 
 * @example
 * // Basic usage
 * const xml = generateDocumentXml(
 *   {
 *     content: [
 *       "Hello World",
 *       { type: 'paragraph', content: ["A paragraph"] },
 *       { type: 'image', image: fs.readFileSync('logo.png') }
 *     ]
 *   },
 *   new RelationshipsManager(),
 *   new ImageManager()
 * );
 * 
 * @example
 * // With advanced styling
 * const xml = generateDocumentXml(
 *   {
 *     content: [
 *       {
 *         type: 'text',
 *         text: 'Formatted Text',
 *         style: {
 *           align: 'center',
 *           lineSpacing: 1.5
 *         }
 *       },
 *       {
 *         type: 'table',
 *         rows: [
 *           { cells: [{ content: ["Cell 1"] }] 
 *         ]
 *       }
 *     ]
 *   },
 *   relManager,
 *   imageManager
 * );
 */
export function generateDocumentXml(
    definition: DocxDefinition,
    relManager: RelationshipsManager,
    imageManager: ImageManager
): string {
    // Create root document element with required namespaces
    const root = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('w:document', {
            'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
            'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
            'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
            'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
            'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
        })
        .ele('w:body');

    // Process each content item in the document definition
    for (const item of definition.content) {
        // Handle string content (simple text)
        if (typeof item === 'string') {
            const p = root.ele('w:p');
            createText(p, item);
        } 
        
        // Handle formatted text elements
        else if (item.type === 'text') {
            const p = root.ele('w:p');
            
            // Apply paragraph styling if specified
            if (item.style) {
                const pPr = p.ele('w:pPr');
                
                // Handle text alignment
                if (item.style.align) {
                    const wordAlign = item.style.align === 'justify' ? 'both' : item.style.align;
                    pPr.ele('w:jc', { 'w:val': wordAlign });
                }
                
                // Handle line spacing
                if (item.style.lineSpacing) {
                    const spacingValue = Math.round(item.style.lineSpacing * 240);
                    pPr.ele('w:spacing', { 
                        'w:line': spacingValue, 
                        'w:lineRule': 'auto' 
                    });
                }
            }
            createText(p, item);
        } 
        
        // Handle paragraph elements
        else if (item.type === 'paragraph') {
            createParagraph(
                root,
                item,
                // Hyperlink registration callback
                (url) => relManager.addHyperlink(url),
                // Image registration callback
                (data, ext) => imageManager.registerImage(data, ext),
                // Image relationship ID callback
                (filename) => relManager.addImage(filename)
            );
        } 
        
        // Handle table elements
        else if (item.type === 'table') {
            createTable(
                root,
                item,
                // Hyperlink registration callback
                (url) => relManager.addHyperlink(url),
                // Image registration callback
                (data, ext) => imageManager.registerImage(data, ext),
                // Image relationship ID callback
                (filename) => relManager.addImage(filename)
            );
        } 
        
        // Handle image elements
        else if (item.type === 'image') {
            createImage(
                root,
                item,
                // Image registration callback
                (data, ext) => imageManager.registerImage(data, ext),
                // Image relationship ID callback
                (filename) => relManager.addImage(filename)
            );
        }
    }

    // Add required section properties to the document
    root.ele('w:sectPr');
    
    // Return formatted XML string
    return root.end({ prettyPrint: true });
}