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
 * Notes:
 * - Uses Uint8Array internally to be compatible with both Node.js and browsers.
 */
export class ImageManager {
  private nextImageId = 1;
  private images: Array<{ filename: string; data: Uint8Array }> = [];

  /**
   * Registers an image and returns its unique filename
   *
   * @param {Uint8Array} data - Image binary data
   * @param {string} extension - File extension (png, jpg, etc)
   * @returns {string} Generated filename (e.g., "image1.png")
   *
   * @example
   * // Node.js (Buffer -> Uint8Array)
   * const buf = await fs.promises.readFile('photo.jpg');
   * const filename = imageManager.registerImage(new Uint8Array(buf), 'jpg');
   *
   * @example
   * // Browser (already Uint8Array)
   * const u8 = new Uint8Array(await file.arrayBuffer());
   * const filename = imageManager.registerImage(u8, 'png');
   */
  registerImage(data: Uint8Array, extension: string): string {
    const filename = `image${this.nextImageId++}.${extension}`;
    this.images.push({ filename, data });
    return filename;
  }

  /**
   * Gets all registered images
   */
  getImages() {
    return this.images;
  }

  /**
   * Resets the image manager to initial state
   */
  reset() {
    this.images = [];
    this.nextImageId = 1;
  }

  /**
   * Saves all registered images to the DOCX ZIP archive
   *
   * @param {JSZip} zip - JSZip instance to add images to
   */
  saveImagesToZip(zip: JSZip) {
    for (const img of this.images) {
      const p = `word/media/${img.filename}`;
      zip.file(p, img.data); // JSZip supports Uint8Array in both Node & Browser
    }
  }
}
