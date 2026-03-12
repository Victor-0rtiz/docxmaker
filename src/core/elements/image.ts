import { ImageElement } from "../types/types.js";

/**
 * Creates an image element in DOCX document XML structure
 *
 * This function handles:
 * 1. Image data processing (base64 strings, Buffer, Uint8Array, ArrayBuffer)
 * 2. Image format detection (magic number)
 * 3. Image registration in the document
 * 4. Relationship ID assignment
 * 5. Dimension calculation (px to EMU conversion)
 * 6. XML structure generation for the image element
 *
 * @param {object} parent - XML parent element to append the image to
 * @param {ImageElement} image - Image element definition
 * @param {function} registerImage - Callback to register image in document package
 * @param {function} getImageRelId - Callback to get relationship ID for an image
 */
export function createImage(
  parent: any,
  image: ImageElement,
  registerImage: (data: Uint8Array, extension: string) => string,
  getImageRelId: (filename: string) => string
) {
  // --- IMAGE DATA PROCESSING ---
  let bytes: Uint8Array;
  let extension = "png"; // Default extension

  const hasBuffer =
    typeof globalThis !== "undefined" &&
    (globalThis as any).Buffer &&
    typeof (globalThis as any).Buffer.from === "function";

  const BufferCtor: any = hasBuffer ? (globalThis as any).Buffer : undefined;

  const toUint8Array = (input: any): Uint8Array | undefined => {
    // Node Buffer (only if exists)
    if (hasBuffer && BufferCtor?.isBuffer?.(input)) {
      return new Uint8Array(input); // view over Buffer
    }

    // Uint8Array
    if (input instanceof Uint8Array) return input;

    // ArrayBuffer
    if (input instanceof ArrayBuffer) return new Uint8Array(input);

    // TypedArray (Uint8ClampedArray, etc.)
    if (input?.buffer instanceof ArrayBuffer && typeof input?.byteOffset === "number") {
      return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    }

    return undefined;
  };

  const detectExt = (u8: Uint8Array): string => {
    // Need at least a few bytes
    if (u8.length < 4) return "png";

    // PNG: 89 50 4E 47
    if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return "png";

    // JPEG: FF D8 FF
    if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return "jpg";

    // GIF: 47 49 46 38
    if (u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x38) return "gif";

    // BMP: 42 4D
    if (u8[0] === 0x42 && u8[1] === 0x4d) return "bmp";

    return "png";
  };

  if (typeof image.image === "string") {
    // data URI o base64
    const matches = image.image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (matches) {
      extension = matches[1] === "jpeg" ? "jpg" : matches[1];
      const b64 = matches[2];

      if (hasBuffer) {
        bytes = new Uint8Array(BufferCtor.from(b64, "base64"));
      } else {
        // Browser-safe base64 decode
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        bytes = arr;
      }
    } else {
      // plain base64
      const b64 = image.image;
      if (hasBuffer) {
        bytes = new Uint8Array(BufferCtor.from(b64, "base64"));
      } else {
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        bytes = arr;
      }
    }

    
    extension = extension || detectExt(bytes);
  } else if (image.image && typeof image.image === "object" && "path" in (image.image as any)) {
   
    throw new Error('Image with { path } must be resolved before createImage()');
  } else if (image.image && typeof image.image === "object" && "url" in (image.image as any)) {
    
    throw new Error('Image with { url } must be resolved before createImage()');
  } else {
    const u8 = toUint8Array(image.image);
    if (!u8) throw new Error("Unsupported image input");
    bytes = u8;
    extension = detectExt(bytes);
  }

  // --- IMAGE REGISTRATION ---
  const filename = registerImage(bytes, extension);

  // --- RELATIONSHIP MANAGEMENT ---
  const relId = getImageRelId(filename);

  // --- DIMENSION CALCULATION ---
  const widthPx = image.width || 100;
  const heightPx = image.height || 100;
  const widthEmu = Math.round(widthPx * 9525);
  const heightEmu = Math.round(heightPx * 9525);

  // --- XML STRUCTURE GENERATION ---
  const p = parent.ele("w:p");

  if (image.align) {
    const pPr = p.ele("w:pPr");
    pPr.ele("w:jc", { "w:val": image.align });
  }

  const run = p.ele("w:r");
  const drawing = run.ele("w:drawing");

  const inline = drawing.ele("wp:inline", { distT: "0", distB: "0", distL: "0", distR: "0" });

  inline.ele("wp:extent", { cx: widthEmu.toString(), cy: heightEmu.toString() });

  inline.ele("wp:docPr", {
    id: "1",
    name: image.alt || "Imagen",
    descr: image.alt || "",
  });

  const graphic = inline.ele("a:graphic");
  const graphicData = graphic.ele("a:graphicData", {
    uri: "http://schemas.openxmlformats.org/drawingml/2006/picture",
  });

  const pic = graphicData.ele("pic:pic");

  const nvPicPr = pic.ele("pic:nvPicPr");
  nvPicPr.ele("pic:cNvPr", { id: "0", name: image.alt || "Imagen", descr: image.alt || "" });
  nvPicPr.ele("pic:cNvPicPr");

  const blipFill = pic.ele("pic:blipFill");
  blipFill.ele("a:blip", { "r:embed": relId });
  blipFill.ele("a:stretch").ele("a:fillRect");

  const spPr = pic.ele("pic:spPr");
  const xfrm = spPr.ele("a:xfrm");
  xfrm.ele("a:off", { x: "0", y: "0" });
  xfrm.ele("a:ext", { cx: widthEmu.toString(), cy: heightEmu.toString() });

  spPr.ele("a:prstGeom", { prst: "rect" }).ele("a:avLst");
}
