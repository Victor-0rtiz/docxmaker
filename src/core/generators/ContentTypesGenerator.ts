/**
 * Generates the [Content_Types].xml file for DOCX package
 * 
 * This file defines MIME types for all file extensions used in the document package.
 * Includes:
 * - Default types for common extensions (rels, xml, images)
 * - Override for the main document XML
 * 
 * @returns {string} XML string for [Content_Types].xml
 * 
 * @example
 * const contentTypesXml = generateContentTypesXml();
 * zip.file('[Content_Types].xml', contentTypesXml);
 * 
 * @example
 * // Resulting XML structure:
 * `<?xml version="1.0" encoding="UTF-8"?>
 * <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 *   <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 *   <Default Extension="xml" ContentType="application/xml"/>
 *   <Default Extension="png" ContentType="image/png"/>
 *   <!-- Additional image types -->
 *   <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
 * </Types>`
 */
export function generateContentTypesXml(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="gif" ContentType="image/gif"/>
  <Default Extension="bmp" ContentType="image/bmp"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
}