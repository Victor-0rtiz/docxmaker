import { TableElement } from "../types/types.js";
import { createText } from "./text.js";
import { createlink } from "./link.js";
import { createImage } from "./image.js";
import { createField } from "./field.js";

/**
 * Creates a WordprocessingML table (`<w:tbl>`) with cells, rows, colspan, and rowspan.
 *
 * Handles:
 * - Table alignment (`w:jc`)
 * - Default borders for all cells
 * - Column widths via `w:tblGrid` and `w:gridCol`
 * - Cell merging with `w:gridSpan` (colspan) and `w:vMerge` (rowspan)
 * - Background colors via `w:shd`
 * - Vertical alignment via `w:vAlign`
 * - Cell content: text, links, fields, and images
 *
 * @param parent - Parent XML element (from xmlbuilder2)
 * @param table - Table element definition
 * @param getHyperlinkRelId - Callback to register hyperlinks
 * @param registerImage - Callback to register images
 * @param getImageRelId - Callback to get image relationship Id
 */
export function createTable(
    parent: any,
    table: TableElement,
    getHyperlinkRelId: (url: string) => string,
    registerImage: (data: Uint8Array, extension: string) => string,
    getImageRelId: (filename: string) => string
) {
    const tbl = parent.ele('w:tbl');

    const tblPr = tbl.ele('w:tblPr');

    if (table.style?.align) {
        const jc = table.style.align === 'justify' ? 'both' : table.style.align;
        tblPr.ele('w:jc', { 'w:val': jc });
    }

    const borders = tblPr.ele('w:tblBorders');
    const borderSettings = {
        'w:val': 'single',
        'w:sz': '4',
        'w:space': '0',
        'w:color': 'auto'
    };

    borders.ele('w:top', borderSettings).up()
        .ele('w:left', borderSettings).up()
        .ele('w:bottom', borderSettings).up()
        .ele('w:right', borderSettings).up()
        .ele('w:insideH', borderSettings).up()
        .ele('w:insideV', borderSettings);

    if (table.style?.columnWidths) {
        const grid = tbl.ele('w:tblGrid');
        for (const width of table.style.columnWidths) {
            grid.ele('w:gridCol', { 'w:w': width });
        }
    }

    const rowspanTracker: number[] = [];
    let totalCols = table.style?.columnWidths?.length ?? 0;

    if (totalCols === 0) {
        for (const row of table.rows) {
            let cols = 0;
            for (const cell of row.cells) {
                cols += cell.colspan ?? 1;
            }
            totalCols = Math.max(totalCols, cols);
        }
    }

    for (const row of table.rows) {
        const tr = tbl.ele('w:tr');
        let colIndex = 0;

        for (const cell of row.cells) {
            while (rowspanTracker[colIndex]) {
                rowspanTracker[colIndex]--;
                const emptyTc = tr.ele('w:tc');
                const emptyTcPr = emptyTc.ele('w:tcPr');
                if (table.style?.columnWidths?.[colIndex]) {
                    emptyTcPr.ele('w:tcW', { 'w:w': table.style.columnWidths[colIndex], 'w:type': 'dxa' });
                }
                emptyTcPr.ele('w:vMerge');
                emptyTc.ele('w:p');
                colIndex++;
            }

            const tc = tr.ele('w:tc');
            const tcPr = tc.ele('w:tcPr');
            const colspan = cell.colspan ?? 1;
            const rowspan = cell.rowspan ?? 1;

            if (table.style?.columnWidths?.[colIndex]) {
                let width = 0;
                for (let i = 0; i < colspan; i++) {
                    width += table.style.columnWidths[colIndex + i] ?? 0;
                }
                tcPr.ele('w:tcW', { 'w:w': width.toString(), 'w:type': 'dxa' });
            }

            if (cell.style?.width) {
                tcPr.ele('w:tcW', { 'w:w': cell.style.width, 'w:type': 'dxa' });
            }

            if (colspan > 1) {
                tcPr.ele('w:gridSpan', { 'w:val': colspan.toString() });
            }

            if (rowspan > 1) {
                tcPr.ele('w:vMerge', { 'w:val': 'restart' });
                rowspanTracker[colIndex] = rowspan - 1;
            }

            const background = cell.style?.backgroundColor || table.style?.backgroundColor;
            if (background) {
                tcPr.ele('w:shd', {
                    'w:val': 'clear',
                    'w:color': 'auto',
                    'w:fill': background,
                });
            }

            const verticalAlign = cell.style?.verticalAlign || table.style?.verticalAlign;
            if (verticalAlign) {
                tcPr.ele('w:vAlign', { 'w:val': verticalAlign });
            }

            const p = tc.ele('w:p');
            const pPr = p.ele('w:pPr');

            if (cell.style?.align) {
                const jc = cell.style.align === 'justify' ? 'both' : cell.style.align;
                pPr.ele('w:jc', { 'w:val': jc });
            }

            for (const content of cell.content) {
                if (typeof content === 'string' || content.type === 'text') {
                    createText(p, content, cell.style);
                } else if (content.type === 'link') {
                    const relId = getHyperlinkRelId(content.url);
                    createlink(p, content, relId);
                } else if (content.type === 'field') {
                    createField(p, content, cell.style);
                } else if (content.type === 'image') {
                    createImage(p, content, registerImage, getImageRelId);
                }
            }

            colIndex += colspan;
        }

        for (let i = colIndex; i < rowspanTracker.length; i++) {
            if (rowspanTracker[i]) {
                rowspanTracker[i]--;
                const emptyTc = tr.ele('w:tc');
                const emptyTcPr = emptyTc.ele('w:tcPr');
                if (table.style?.columnWidths?.[i]) {
                    emptyTcPr.ele('w:tcW', { 'w:w': table.style.columnWidths[i], 'w:type': 'dxa' });
                }
                emptyTcPr.ele('w:vMerge');
                emptyTc.ele('w:p');
            }
        }
    }
}
