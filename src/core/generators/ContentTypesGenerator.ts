export function generateContentTypesXml(opts?: {
  hasHeader?: boolean;
  hasFooter?: boolean;
  hasNumbering?: boolean;
}): string {
  const { hasHeader, hasFooter, hasNumbering } = opts ?? {};

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`);

  lines.push(`  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`);
  lines.push(`  <Default Extension="xml" ContentType="application/xml"/>`);
  lines.push(`  <Default Extension="png" ContentType="image/png"/>`);
  lines.push(`  <Default Extension="jpg" ContentType="image/jpeg"/>`);
  lines.push(`  <Default Extension="jpeg" ContentType="image/jpeg"/>`);
  lines.push(`  <Default Extension="gif" ContentType="image/gif"/>`);
  lines.push(`  <Default Extension="bmp" ContentType="image/bmp"/>`);

  lines.push(`  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>`);
  if (hasHeader) {
    lines.push(`  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>`);
  }
  if (hasFooter) {
    lines.push(`  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`);
  }
  if (hasNumbering) {
    lines.push(`  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>`);
  }

  lines.push(`</Types>`);
  return lines.join('\n');
}
