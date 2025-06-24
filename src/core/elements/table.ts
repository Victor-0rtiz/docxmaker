import { TableElement } from "../types/types.js";
import { createText } from "./text.js";
import { createlink } from "./link.js";
import { createImage } from "./image.js";

/**
 * Creates a WordprocessingML table element with rows, cells, and content
 * 
 * This function:
 * 1. Creates a `<w:tbl>` element with borders and properties
 * 2. Handles table-level styling (alignment, column widths, background)
 * 3. Processes rows and cells with individual styling
 * 4. Handles mixed content types within cells:
 *    - Plain text
 *    - Formatted text
 *    - Hyperlinks
 *    - Images
 * 5. Applies cell-level styling (width, background, alignment)
 * 
 * @param {object} parent - Parent XML element (from xmlbuilder2)
 * @param {TableElement} table - Table definition object
 * @param {function} getHyperlinkRelId - Callback to get relationship ID for hyperlinks
 * @param {function} registerImage - Callback to register images
 * @param {function} getImageRelId - Callback to get relationship ID for images
 * 
 * @example
 * // Basic table
 * createTable(root, {
 *   type: 'table',
 *   rows: [
 *     { cells: [{ content: ['Header'] }] },
 *     { cells: [{ content: ['Data'] }] }
 *   ],
 *   style: { columnWidths: [2000] }
 * }, getRelId, registerImage, getImageRelId);
 * 
 * @example
 * // Styled table with mixed content
 * createTable(root, {
 *   type: 'table',
 *   style: {
 *     backgroundColor: '#f0f0f0',
 *     verticalAlign: 'center',
 *     columnWidths: [3000, 4000]
 *   },
 *   rows: [
 *     {
 *       cells: [
 *         { 
 *           content: ['Name'], 
 *           style: { backgroundColor: '#e0e0e0', width: 3000 } 
 *         },
 *         { 
 *           content: ['Description'],
 *           style: { backgroundColor: '#e0e0e0', width: 4000 } 
 *         }
 *       ]
 *     },
 *     {
 *       cells: [
 *         { 
 *           content: ['Product A'],
 *           style: { align: 'center' }
 *         },
 *         { 
 *           content: [
 *             { 
 *               type: 'link', 
 *               text: 'Documentation', 
 *               url: 'https://example.com/docs' 
 *             },
 *             ' - ',
 *             { 
 *               type: 'image',
 *               image: fs.readFileSync('icon.png'),
 *               width: 20
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }, getRelId, registerImage, getImageRelId);
 */
export function createTable(
    parent: any,
    table: TableElement,
    getHyperlinkRelId: (url: string) => string,
    registerImage: (data: Buffer, extension: string) => string,
    getImageRelId: (filename: string) => string
) {
    // --- TABLE CREATION ---
    // Create table root element
    const tbl = parent.ele('w:tbl');

    // --- TABLE PROPERTIES ---
    // Create table properties container
    const tblPr = tbl.ele('w:tblPr');

    // Create table borders with default settings
    const borders = tblPr.ele('w:tblBorders');
    const borderSettings = { 
        'w:val': 'single',   // Border style
        'w:sz': '4',         // Border size (1/8 point)
        'w:space': '0',      // Border spacing
        'w:color': 'auto'    // Automatic color
    };
    
    // Apply borders to all sides
    borders.ele('w:top', borderSettings).up()
        .ele('w:left', borderSettings).up()
        .ele('w:bottom', borderSettings).up()
        .ele('w:right', borderSettings).up()
        .ele('w:insideH', borderSettings).up()   // Inside horizontal borders
        .ele('w:insideV', borderSettings);        // Inside vertical borders

    // --- COLUMN DEFINITIONS ---
    // Create column grid if widths are specified
    if (table.style?.columnWidths) {
        const grid = tbl.ele('w:tblGrid');
        for (const width of table.style.columnWidths) {
            // Column width in twips (1/20 of a point)
            grid.ele('w:gridCol', { 'w:w': width });
        }
    }

    // --- TABLE ALIGNMENT ---
    // Horizontal table alignment (convert 'justify' to 'both')
    if (table.style?.align) {
        const jc = table.style.align === 'justify' ? 'both' : table.style.align;
        tblPr.ele('w:jc', { 'w:val': jc });
    }

    // --- ROW PROCESSING ---
    for (const row of table.rows) {
        const tr = tbl.ele('w:tr');  // Table row

        // --- CELL PROCESSING ---
        for (const cell of row.cells) {
            const tc = tr.ele('w:tc');  // Table cell
            const tcPr = tc.ele('w:tcPr');  // Cell properties

            // --- CELL WIDTH ---
            // Width in twips (dxa = 1/20 point)
            if (cell.style?.width) {
                tcPr.ele('w:tcW', {
                    'w:w': cell.style.width,
                    'w:type': 'dxa'
                });
            }

            // --- CELL BACKGROUND ---
            // Precedence: cell style > table style
            const background = cell.style?.backgroundColor || table.style?.backgroundColor;
            if (background) {
                tcPr.ele('w:shd', {
                    'w:val': 'clear',     // No pattern
                    'w:color': 'auto',    // Automatic foreground
                    'w:fill': background, // Background color
                });
            }

            // --- VERTICAL ALIGNMENT ---
            // Precedence: cell style > table style
            const verticalAlign = cell.style?.verticalAlign || table.style?.verticalAlign;
            if (verticalAlign) {
                tcPr.ele('w:vAlign', { 'w:val': verticalAlign });
            }

            // --- CELL CONTENT CONTAINER ---
            // Each cell requires at least one paragraph
            const p = tc.ele('w:p');  // Paragraph container
            const pPr = p.ele('w:pPr');  // Paragraph properties

            // --- CELL CONTENT ALIGNMENT ---
            if (cell.style?.align) {
                const jc = cell.style.align === 'justify' ? 'both' : cell.style.align;
                pPr.ele('w:jc', { 'w:val': jc });
            }

            // --- CELL CONTENT PROCESSING ---
            for (const content of cell.content) {
                // Handle plain text or text elements
                if (typeof content === 'string' || content.type === 'text') {
                    createText(p, content, cell.style);
                } 
                
                // Handle hyperlinks
                else if (content.type === 'link') {
                    const relId = getHyperlinkRelId(content.url);
                    createlink(p, content, relId);
                } 
                
                // Handle images
                else if (content.type === 'image') {
                    createImage(
                        p,
                        content,
                        registerImage,
                        getImageRelId
                    );
                }
            }
        }
    }
}