import type { FieldElement, StyleText } from '../types/types.js';

/**
 * Creates a Word field using <w:fldSimple>.
 *
 * Used for page numbering:
 * - PAGE: current page number
 * - NUMPAGES: total pages
 *
 * @param {object} p - Parent XML element (usually a <w:p>)
 * @param {FieldElement} fieldEl - Field element definition
 * @param {StyleText} [defaultStyle] - Optional style for the field run
 *
 * @example
 * createField(p, { type: 'field', field: 'PAGE' })
 * createField(p, { type: 'field', field: 'NUMPAGES' })
 */
export function createField(p: any, fieldEl: FieldElement, defaultStyle?: StyleText) {
  // fldSimple is the easiest way to emit fields
  // Word will update the field value when opening / updating fields.
  const fld = p.ele('w:fldSimple', { 'w:instr': fieldEl.field });

  // Field result run (empty; Word computes it)
  const run = fld.ele('w:r');

  if (defaultStyle) {
    const rPr = run.ele('w:rPr');

    if (defaultStyle.color) rPr.ele('w:color', { 'w:val': defaultStyle.color });
    if (defaultStyle.bold) rPr.ele('w:b');
    if (defaultStyle.italic) rPr.ele('w:i');
    if (defaultStyle.underline) rPr.ele('w:u', { 'w:val': 'single' });
    if (defaultStyle.fontSize) rPr.ele('w:sz', { 'w:val': defaultStyle.fontSize * 2 });
  }

  run.ele('w:t', { 'xml:space': 'preserve' }).txt('');
}
