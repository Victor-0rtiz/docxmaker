import { create } from 'xmlbuilder2';
import type { DocxStyle } from '../types/types.js';

export class StylesManager {
  private styles: Map<string, DocxStyle> = new Map();

  addStyle(style: DocxStyle): void {
    this.styles.set(style.id, style);
  }

  getStyle(id: string): DocxStyle | undefined {
    return this.styles.get(id);
  }

  hasStyles(): boolean {
    return this.styles.size > 0;
  }

  generateXml(): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('w:styles', {
        'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      });

    root.ele('w:docDefaults')
      .ele('w:rPrDefault')
        .ele('w:rPr')
          .ele('w:sz', { 'w:val': '22' }).up()
          .ele('w:szCs', { 'w:val': '22' }).up()
        .up()
      .up()
      .ele('w:pPrDefault')
        .ele('w:pPr')
          .ele('w:spacing', { 'w:after': '160', 'w:line': '360', 'w:lineRule': 'auto' }).up()
        .up()
      .up();

    for (const style of this.styles.values()) {
      const sty = root.ele('w:style', {
        'w:type': style.type ?? 'paragraph',
        'w:styleId': style.id,
      });

      if (style.name) {
        sty.ele('w:name', { 'w:val': style.name });
      }

      if (style.basedOn) {
        sty.ele('w:basedOn', { 'w:val': style.basedOn });
      }

      const s = style.style;
      if (s.fontSize || s.bold || s.italic || s.underline || s.color) {
        const rPr = sty.ele('w:rPr');
        if (s.color) rPr.ele('w:color', { 'w:val': s.color });
        if (s.bold) rPr.ele('w:b');
        if (s.italic) rPr.ele('w:i');
        if (s.underline) rPr.ele('w:u', { 'w:val': 'single' });
        if (s.fontSize) rPr.ele('w:sz', { 'w:val': (s.fontSize * 2).toString() });
      }

      if (s.align || s.lineSpacing) {
        const pPr = sty.ele('w:pPr');
        if (s.align) {
          const wordAlign = s.align === 'justify' ? 'both' : s.align;
          pPr.ele('w:jc', { 'w:val': wordAlign });
        }
        if (s.lineSpacing) {
          pPr.ele('w:spacing', { 'w:line': Math.round(s.lineSpacing * 240).toString(), 'w:lineRule': 'auto' });
        }
      }
    }

    return root.end({ prettyPrint: true });
  }

  reset(): void {
    this.styles.clear();
  }
}
