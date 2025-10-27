import { create } from 'xmlbuilder2';

/**
 * Manages document relationships for DOCX generation
 * 
 * Handles:
 * - Hyperlink relationships
 * - Image relationships
 * - Header/Footer relationships
 * - Relationship ID generation
 * - Relationship XML generation
 * 
 * @example
 * // Basic usage
 * const relManager = new RelationshipsManager();
 * const hyperlinkId = relManager.addHyperlink('https://example.com');
 * const imageId = relManager.addImage('image1.png');
 * const headerId = relManager.addHeader('header1.xml');
 * const footerId = relManager.addFooter('footer1.xml');
 * const relsXml = relManager.generateDocumentRelsXml();
 */
export class RelationshipsManager {
    private nextRelId = 1;
    private relationships: Array<{ id: string; type: string; target: string; isExternal?: boolean }> = [];

    /**
     * Adds a hyperlink relationship
     * @param {string} url - Target URL for the hyperlink
     * @returns {string} Relationship ID (e.g., "rId1")
     */
    addHyperlink(url: string): string {
        const relId = this.getNextRelId();
        this.relationships.push({
            id: relId,
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',
            target: url,
            isExternal: true
        });
        return relId;
    }

    /**
     * Adds an image relationship
     * @param {string} filename - Image filename in the media folder (e.g., "image1.png")
     * @returns {string} Relationship ID (e.g., "rId2")
     */
    addImage(filename: string): string {
        const relId = this.getNextRelId();
        this.relationships.push({
            id: relId,
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            target: `media/${filename}`
        });
        return relId;
    }

    /**
     * Adds a header relationship
     * @param {string} targetFilename - Part path relative to /word (e.g., "header1.xml")
     * @returns {string} Relationship ID
     */
    addHeader(targetFilename: string): string {
        const relId = this.getNextRelId();
        this.relationships.push({
            id: relId,
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header',
            target: targetFilename
        });
        return relId;
    }

    /**
     * Adds a footer relationship
     * @param {string} targetFilename - Part path relative to /word (e.g., "footer1.xml")
     * @returns {string} Relationship ID
     */
    addFooter(targetFilename: string): string {
        const relId = this.getNextRelId();
        this.relationships.push({
            id: relId,
            type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer',
            target: targetFilename
        });
        return relId;
    }

    /**
     * Generates the next sequential relationship ID
     * @private
     * @returns {string} Next relationship ID in format "rId{N}"
     */
    private getNextRelId(): string {
        return `rId${this.nextRelId++}`;
    }

    /**
     * Checks if any relationships exist
     * @returns {boolean} True if there are relationships, false otherwise
     */
    hasRelationships(): boolean {
        return this.relationships.length > 0;
    }

    /**
     * Gets all current relationships
     * @returns {Array<Object>} Array of relationship objects
     */
    getRelationships() {
        return this.relationships;
    }

    /**
     * Resets the manager to initial state
     * 
     * @example
     * // Before generating a new document
     * relManager.reset();
     */
    reset() {
        this.relationships = [];
        this.nextRelId = 1;
    }

    /**
     * Generates the document-level relationships XML (word/_rels/document.xml.rels)
     * @returns {string} XML string for relationships
     */
    generateDocumentRelsXml(): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('Relationships', {
                xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships',
            });

        for (const rel of this.relationships) {
            const attrs: any = {
                Id: rel.id,
                Type: rel.type,
                Target: rel.target
            };
            if (rel.isExternal) attrs.TargetMode = 'External';
            root.ele('Relationship', attrs);
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Generates the main package relationships XML (_rels/.rels)
     * @static
     * @returns {string} Static XML string for package relationships
     */
    static generateMainRelsXml(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    }
}
