import { create } from 'xmlbuilder2';

export interface NumberingDef {
  numId: number;
  variant: 'unordered' | 'ordered';
  indentTwips: number;
  hangingTwips: number;
}

export class NumberingManager {
  private nextAbstractNumId = 0;
  private nextNumId = 1;
  private definitions: NumberingDef[] = [];

  addList(variant: 'unordered' | 'ordered', indentTwips = 720, hangingTwips = 360): number {
    const abstractNumId = this.nextAbstractNumId++;
    const numId = this.nextNumId++;

    this.definitions.push({
      numId,
      variant,
      indentTwips,
      hangingTwips,
    });

    this.definitions.sort((a, b) => a.numId - b.numId);

    return numId;
  }

  hasDefinitions(): boolean {
    return this.definitions.length > 0;
  }

  generateXml(): string {
    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('w:numbering', {
        'xmlns:w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
        'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
      });

    for (const def of this.definitions) {
      const abstractNumId = def.numId - 1;
      const isOrdered = def.variant === 'ordered';

      const abstractNum = root.ele('w:abstractNum', { 'w:abstractNumId': abstractNumId });
      abstractNum.ele('w:multiLevelType', { 'w:val': 'hybridMultilevel' });

      const lvl = abstractNum.ele('w:lvl', { 'w:ilvl': '0' });
      lvl.ele('w:start', { 'w:val': '1' });
      lvl.ele('w:numFmt', { 'w:val': isOrdered ? 'decimal' : 'bullet' });
      lvl.ele('w:lvlText', { 'w:val': isOrdered ? '%1.' : '•' });
      lvl.ele('w:lvlJc', { 'w:val': 'left' });

      const pPr = lvl.ele('w:pPr');
      pPr.ele('w:ind', {
        'w:left': def.indentTwips.toString(),
        'w:hanging': def.hangingTwips.toString(),
      });
    }

    for (const def of this.definitions) {
      const abstractNumId = def.numId - 1;
      const num = root.ele('w:num', { 'w:numId': def.numId });
      num.ele('w:abstractNumId', { 'w:val': abstractNumId });
    }

    return root.end({ prettyPrint: true });
  }

  reset(): void {
    this.nextAbstractNumId = 0;
    this.nextNumId = 1;
    this.definitions = [];
  }
}
