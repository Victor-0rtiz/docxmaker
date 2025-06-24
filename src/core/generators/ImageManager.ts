import JSZip from "jszip";

/**
 * Manages images for DOCX document generation
 * 
 * Handles:
 * - Image registration and naming
 * - Image storage in memory
 * - Image reset for document regeneration
 * - Saving images to DOCX ZIP archive
 * 
 * @example
 * // Basic usage
 * const imageManager = new ImageManager();
 * 
 * // Register an image
 * const buffer = fs.readFileSync('logo.png');
 * const filename = imageManager.registerImage(buffer, 'png');
 * 
 * // Save images to ZIP
 * const zip = new JSZip();
 * imageManager.saveImagesToZip(zip);
 * 
 * @example
 * // Full document integration
 * const imageManager = new ImageManager();
 * const relManager = new RelationshipsManager();
 * 
 * // When processing images:
 * const filename = imageManager.registerImage(imageData, 'png');
 * const relId = relManager.addImage(filename);
 * 
 * // After generating document XML:
 * imageManager.saveImagesToZip(zip);
 */
export class ImageManager {
    private nextImageId = 1;
    private images: Array<{ filename: string; data: Buffer }> = [];

    /**
     * Registers an image and returns its unique filename
     * @param {Buffer} data - Image binary data
     * @param {string} extension - File extension (png, jpg, etc)
     * @returns {string} Generated filename (e.g., "image1.png")
     * 
     * @example
     * // Register from file
     * const filename = imageManager.registerImage(
     *   fs.readFileSync('photo.jpg'), 
     *   'jpg'
     * );
     * 
     * @example
     * // Register base64 image
     * const base64Data = 'data:image/png;base64,iVBORw0KGgoAAA...';
     * const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
     * const buffer = Buffer.from(matches[2], 'base64');
     * const filename = imageManager.registerImage(buffer, matches[1]);
     */
    registerImage(data: Buffer, extension: string): string {
        const filename = `image${this.nextImageId++}.${extension}`;
        this.images.push({ filename, data });
        return filename;
    }

    /**
     * Gets all registered images
     * @returns {Array<{filename: string, data: Buffer}>} Array of registered images
     * 
     * @example
     * const images = imageManager.getImages();
     * console.log(`Managed ${images.length} images`);
     */
    getImages() {
        return this.images;
    }

    /**
     * Resets the image manager to initial state
     * 
     * @example
     * // Before generating a new document
     * imageManager.reset();
     */
    reset() {
        this.images = [];
        this.nextImageId = 1;
    }

    /**
     * Saves all registered images to the DOCX ZIP archive
     * @param {JSZip} zip - JSZip instance to add images to
     * 
     * @example
     * const zip = new JSZip();
     * imageManager.saveImagesToZip(zip);
     * 
     * // Then generate the final DOCX
     * zip.generateAsync({type: 'nodebuffer'}).then(buffer => {
     *   fs.writeFileSync('document.docx', buffer);
     * });
     */
    saveImagesToZip(zip: JSZip) {
        for (const img of this.images) {
            const path = `word/media/${img.filename}`;
            zip.file(path, img.data);
        }
    }
}