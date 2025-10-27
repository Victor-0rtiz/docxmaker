/**
 * Generates the [Content_Types].xml file for DOCX package
 * 
 * This file defines MIME types for all file extensions used in the document package.
 * Includes:
 * - Default types for common extensions (rels, xml, images)
 * - Override for the main document XML
 * - Conditional overrides for header/footer parts
 * 
 * @param {object} [opts]
 * @param {boolean} [opts.hasHeader] - Whether the document includes a header part
 * @param {boolean} [opts.hasFooter] - Whether the document includes a footer part
 * @returns {string} XML string for [Content_Types].xml
 */
export function generateContentTypesXml(opts?: { hasHeader?: boolean; hasFooter?: boolean }): string {
  const { hasHeader, hasFooter } = opts ?? {};

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`);

  // Defaults
  lines.push(`  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`);
  lines.push(`  <Default Extension="xml" ContentType="application/xml"/>`);
  lines.push(`  <Default Extension="png" ContentType="image/png"/>`);
  lines.push(`  <Default Extension="jpg" ContentType="image/jpeg"/>`);
  lines.push(`  <Default Extension="jpeg" ContentType="image/jpeg"/>`);
  lines.push(`  <Default Extension="gif" ContentType="image/gif"/>`);
  lines.push(`  <Default Extension="bmp" ContentType="image/bmp"/>`);

  // Overrides
  lines.push(`  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>`);
  if (hasHeader) {
    lines.push(`  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>`);
  }
  if (hasFooter) {
    lines.push(`  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`);
  }

  lines.push(`</Types>`);
  return lines.join('\n');
}
