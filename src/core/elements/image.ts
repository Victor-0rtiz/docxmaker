import { ImageElement } from "../types/types.js";

/**
 * Creates an image element in DOCX document XML structure
 * 
 * This function handles:
 * 1. Image data processing (base64 strings, Buffers, Uint8Array)
 * 2. Image format detection
 * 3. Image registration in the document
 * 4. Relationship ID assignment
 * 5. Dimension calculation (px to EMU conversion)
 * 6. XML structure generation for the image element
 * 
 * @param {object} parent - XML parent element to append the image to
 * @param {ImageElement} image - Image element definition
 * @param {function} registerImage - Callback to register image in document package
 *        @param {Buffer} data - Image binary data
 *        @param {string} extension - File extension (png/jpg/etc)
 *        @returns {string} Registered filename
 * @param {function} getImageRelId - Callback to get relationship ID for an image
 *        @param {string} filename - Registered image filename
 *        @returns {string} Relationship ID for the image reference
 */
export function createImage(
  parent: any, 
  image: ImageElement,
  registerImage: (data: Buffer, extension: string) => string,
  getImageRelId: (filename: string) => string
) {
  // --- IMAGE DATA PROCESSING ---
  let imageBuffer: Buffer;
  let extension = 'png'; // Default extension

  // Helper: normaliza cualquier entrada binaria a Buffer
  const toBuffer = (input: any): Buffer | undefined => {
    if (Buffer.isBuffer(input)) return input;                // Buffer
    if (input instanceof Uint8Array) return Buffer.from(input); // Uint8Array / Node readFile
    if (input?.buffer instanceof ArrayBuffer) {
      // Cubre TypedArrays como Uint8ClampedArray, etc.
      return Buffer.from(input.buffer);
    }
    return undefined;
  };

  if (typeof image.image === 'string') {
    // Base64 o data URI
    const matches = image.image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      imageBuffer = Buffer.from(matches[2], 'base64');
    } else {
      imageBuffer = Buffer.from(image.image, 'base64');
    }
  } else if (image.image && typeof image.image === 'object' && 'path' in image.image) {
    // ⚠️ No debería llegar aquí si resolveAssets corrió antes
    throw new Error('Image with { path } must be resolved to Buffer before createImage()');
  } else {
    const buf = toBuffer(image.image);
    if (!buf) throw new Error('Unsupported image input');
    imageBuffer = buf;

    // Detecta formato por magic number
    const header = imageBuffer.subarray(0, 4);
    const headerHex = header.toString('hex').toUpperCase();
    if (headerHex.startsWith('89504E47')) extension = 'png';        // PNG
    else if (headerHex.startsWith('FFD8FF')) extension = 'jpg';     // JPEG
    else if (headerHex.startsWith('47494638')) extension = 'gif';   // GIF
    else if (headerHex.startsWith('424D')) extension = 'bmp';       // BMP
  }

  // --- IMAGE REGISTRATION ---
  const filename = registerImage(imageBuffer, extension);

  // --- RELATIONSHIP MANAGEMENT ---
  const relId = getImageRelId(filename);

  // --- DIMENSION CALCULATION ---
  const widthPx = image.width || 100;
  const heightPx = image.height || 100;
  const widthEmu = Math.round(widthPx * 9525);
  const heightEmu = Math.round(heightPx * 9525);

  // --- XML STRUCTURE GENERATION ---
  const p = parent.ele('w:p');

  if (image.align) {
    const pPr = p.ele('w:pPr');
    pPr.ele('w:jc', { 'w:val': image.align });
  }

  const run = p.ele('w:r');
  const drawing = run.ele('w:drawing');

  const inline = drawing.ele('wp:inline', { distT: "0", distB: "0", distL: "0", distR: "0" });

  inline.ele('wp:extent', { cx: widthEmu.toString(), cy: heightEmu.toString() });

  inline.ele('wp:docPr', {
    id: "1",
    name: image.alt || 'Imagen',
    descr: image.alt || ''
  });

  const graphic = inline.ele('a:graphic');
  const graphicData = graphic.ele('a:graphicData', {
    uri: "http://schemas.openxmlformats.org/drawingml/2006/picture"
  });

  const pic = graphicData.ele('pic:pic');

  const nvPicPr = pic.ele('pic:nvPicPr');
  nvPicPr.ele('pic:cNvPr', { id: "0", name: image.alt || 'Imagen', descr: image.alt || '' });
  nvPicPr.ele('pic:cNvPicPr');

  const blipFill = pic.ele('pic:blipFill');
  blipFill.ele('a:blip', { 'r:embed': relId });
  blipFill.ele('a:stretch').ele('a:fillRect');

  const spPr = pic.ele('pic:spPr');
  const xfrm = spPr.ele('a:xfrm');
  xfrm.ele('a:off', { x: "0", y: "0" });
  xfrm.ele('a:ext', { cx: widthEmu.toString(), cy: heightEmu.toString() });

  spPr.ele('a:prstGeom', { prst: "rect" }).ele('a:avLst');
}
