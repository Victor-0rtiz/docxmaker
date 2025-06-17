import { TableElement } from "../types/types.js";
import { createText } from "./text.js";
import { createlink } from "./link.js";

/**
 * Creates a WordprocessingML table (`<w:tbl>`) element with rows, cells, and content
 * 
 * @param {object} parent - Parent XML element from xmlbuilder2
 * @param {TableElement} table - Table definition object
 * @param {function} getRelId - Function to generate relationship IDs for hyperlinks
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
 * }, getRelId);
 * 
 * @example
 * // Styled table with links
 * createTable(root, {
 *   type: 'table',
 *   rows: [
 *     {
 *       cells: [{
 *         content: [{ 
 *           type: 'link', 
 *           text: 'Docs', 
 *           url: 'https://example.com/docs' 
 *         }],
 *         style: { backgroundColor: '#f0f0f0' }
 *       }]
 *     }
 *   ]
 * }, getRelId);
 */
export function createTable(parent: any, table: TableElement, getRelId: (url: string) => string) {
    // Create table root element
    const tbl = parent.ele('w:tbl');

    // Table properties and borders
    const tblPr = tbl.ele('w:tblPr');
    const borders = tblPr.ele('w:tblBorders');
    
    // Apply default borders to all sides
    const borderSettings = { 'w:val': 'single', 'w:sz': '4', 'w:space': '0', 'w:color': 'auto' };
    borders.ele('w:top', borderSettings).up()
        .ele('w:left', borderSettings).up()
        .ele('w:bottom', borderSettings).up()
        .ele('w:right', borderSettings).up()
        .ele('w:insideH', borderSettings).up()
        .ele('w:insideV', borderSettings);

    // Column width definitions
    if (table.style?.columnWidths) {
        const grid = tbl.ele('w:tblGrid');
        for (const width of table.style.columnWidths) {
            // Column width in twips (1/20 of a point)
            grid.ele('w:gridCol', { 'w:w': width });
        }
    }

    // Table alignment (horizontal)
    if (table.style?.align) {
        const jc = table.style.align === 'justify' ? 'both' : table.style.align;
        tblPr.ele('w:jc', { 'w:val': jc });
    }

    // Process each row
    for (const row of table.rows) {
        const tr = tbl.ele('w:tr');

        // Process each cell in the row
        for (const cell of row.cells) {
            const tc = tr.ele('w:tc');
            const tcPr = tc.ele('w:tcPr');

            // Cell width (in twips)
            if (cell.style?.width) {
                tcPr.ele('w:tcW', { 
                    'w:w': cell.style.width, 
                    'w:type': 'dxa' // dxa = twips (1/20 point)
                });
            }

            // Background color (cell or table-level)
            const background = cell.style?.backgroundColor || table.style?.backgroundColor;
            if (background) {
                tcPr.ele('w:shd', {
                    'w:val': 'clear',
                    'w:color': 'auto',
                    'w:fill': background,
                });
            }

            // Vertical alignment (cell or table-level)
            const verticalAlign = cell.style?.verticalAlign || table.style?.verticalAlign;
            if (verticalAlign) {
                tcPr.ele('w:vAlign', { 'w:val': verticalAlign });
            }

            // Create paragraph container for cell content
            const p = tc.ele('w:p');
            const pPr = p.ele('w:pPr');

            // Horizontal alignment for cell content
            if (cell.style?.align) {
                const jc = cell.style.align === 'justify' ? 'both' : cell.style.align;
                pPr.ele('w:jc', { 'w:val': jc });
            }

            // Process cell content
            for (const content of cell.content) {
                // Handle text elements (string or TextElement)
                if (typeof content === 'string' || content.type === 'text') {
                    createText(p, content, cell.style);
                } 
                // Handle links
                else if (content.type === 'link') {
                    const relId = getRelId(content.url);
                    createlink(p, content, relId);
                }
            }
        }
    }
}