import { create } from 'xmlbuilder2';

/**
 * Manages document relationships for DOCX generation
 * 
 * Handles:
 * - Hyperlink relationships
 * - Image relationships
 * - Relationship ID generation
 * - Relationship XML generation
 * 
 * @example
 * // Basic usage
 * const relManager = new RelationshipsManager();
 * 
 * // Add hyperlink
 * const hyperlinkId = relManager.addHyperlink('https://example.com');
 * 
 * // Add image
 * const imageId = relManager.addImage('image1.png');
 * 
 * // Generate relationships XML
 * const relsXml = relManager.generateDocumentRelsXml();
 * 
 * @example
 * // Full document integration
 * const relManager = new RelationshipsManager();
 * const imageManager = new ImageManager();
 * 
 * // Process content...
 * 
 * if (relManager.hasRelationships()) {
 *   zip.folder('word/_rels')?.file('document.xml.rels', relManager.generateDocumentRelsXml());
 * }
 */
export class RelationshipsManager {
    private nextRelId = 1;
    private relationships: Array<{ id: string; type: string; target: string; isExternal?: boolean }> = [];

    /**
     * Adds a hyperlink relationship
     * @param {string} url - Target URL for the hyperlink
     * @returns {string} Relationship ID (e.g., "rId1")
     * 
     * @example
     * const relId = relManager.addHyperlink('https://google.com');
     * // Returns: "rId1"
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
     * 
     * @example
     * // After registering an image
     * const filename = imageManager.registerImage(buffer, 'png');
     * const relId = relManager.addImage(filename);
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
     * 
     * @example
     * if (relManager.hasRelationships()) {
     *   // Generate relationship file
     * }
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
     * 
     * @example
     * const relsXml = relManager.generateDocumentRelsXml();
     * fs.writeFileSync('document.xml.rels', relsXml);
     */
    generateDocumentRelsXml(): string {
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('Relationships', {
                xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships',
            });

        // Add each relationship to the XML
        for (const rel of this.relationships) {
            const attrs: any = {
                Id: rel.id,
                Type: rel.type,
                Target: rel.target
            };

            // Add TargetMode for external links
            if (rel.isExternal) {
                attrs.TargetMode = 'External';
            }

            root.ele('Relationship', attrs);
        }

        return root.end({ prettyPrint: true });
    }

    /**
     * Generates the main package relationships XML (_rels/.rels)
     * @static
     * @returns {string} Static XML string for package relationships
     * 
     * @example
     * const mainRels = RelationshipsManager.generateMainRelsXml();
     * zip.folder('_rels')?.file('.rels', mainRels);
     */
    static generateMainRelsXml(): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
    }
}