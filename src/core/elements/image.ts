import { ImageElement } from "../types/types.js";

/**
 * Creates an image element in DOCX document XML structure
 * 
 * This function handles:
 * 1. Image data processing (base64 strings or Buffers)
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
 * 
 * @example
 * // Inside document generation
 * createImage(
 *   xmlParent, 
 *   { 
 *     type: 'image',
 *     image: fs.readFileSync('logo.png'),
 *     width: 200,
 *     height: 100,
 *     alt: 'Company Logo',
 *     align: 'center'
 *   },
 *   imageManager.registerImage.bind(imageManager),
 *   relManager.getImageRelId.bind(relManager)
 * );
 * 
 * @example
 * // With base64 image
 * createImage(
 *   xmlParent,
 *   {
 *     type: 'image',
 *     image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
 *     alt: 'Base64 Image'
 *   },
 *   registerFn,
 *   relIdFn
 * );
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
    
    if (typeof image.image === 'string') {
        // Handle base64 encoded images
        const matches = image.image.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
            // Extract from data URI format
            extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            imageBuffer = Buffer.from(matches[2], 'base64');
        } else {
            // Assume plain base64 string
            imageBuffer = Buffer.from(image.image, 'base64');
        }
    } else {
        // Handle Buffer input
        imageBuffer = image.image;
        
        // Detect image format from magic number
        const header = imageBuffer.subarray(0, 4);
        const headerHex = header.toString('hex').toUpperCase();
        
        if (headerHex.startsWith('89504E47')) extension = 'png';        // PNG
        else if (headerHex.startsWith('FFD8FF')) extension = 'jpg';     // JPEG
        else if (headerHex.startsWith('47494638')) extension = 'gif';   // GIF
        else if (headerHex.startsWith('424D')) extension = 'bmp';       // BMP
    }
    
    // --- IMAGE REGISTRATION ---
    // Register image in document package and get filename
    const filename = registerImage(imageBuffer, extension);
    
    // --- RELATIONSHIP MANAGEMENT ---
    // Get relationship ID for image reference
    const relId = getImageRelId(filename);
    
    // --- DIMENSION CALCULATION ---
    // Use provided dimensions or default to 100x100
    let widthPx = image.width || 100;
    let heightPx = image.height || 100;
    
    // Convert pixels to EMU (English Metric Units)
    // 1 pixel = 9525 EMU (DOCX standard)
    const widthEmu = Math.round(widthPx * 9525);
    const heightEmu = Math.round(heightPx * 9525);
    
    // --- XML STRUCTURE GENERATION ---
    // Create container paragraph
    const p = parent.ele('w:p');
    
    // Apply alignment if specified
    if (image.align) {
        const pPr = p.ele('w:pPr');
        pPr.ele('w:jc', { 'w:val': image.align });
    }

    // Create text run and drawing element
    const run = p.ele('w:r');
    const drawing = run.ele('w:drawing');

    // Inline container with positioning
    const inline = drawing.ele('wp:inline', {
        distT: "0",  // Top distance
        distB: "0",  // Bottom distance
        distL: "0",  // Left distance
        distR: "0"   // Right distance
    });

    // Set image dimensions
    inline.ele('wp:extent', {
        cx: widthEmu.toString(),  // Width in EMU
        cy: heightEmu.toString()  // Height in EMU
    });

    // Document properties (accessibility)
    inline.ele('wp:docPr', {
        id: "1",  // Unique identifier
        name: image.alt || 'Imagen',  // Image name
        descr: image.alt || ''        // Alternative text
    });

    // Graphic container
    const graphic = inline.ele('a:graphic');
    const graphicData = graphic.ele('a:graphicData', {
        uri: "http://schemas.openxmlformats.org/drawingml/2006/picture"
    });

    // Picture element
    const pic = graphicData.ele('pic:pic');

    // Non-visual properties
    const nvPicPr = pic.ele('pic:nvPicPr');
    nvPicPr.ele('pic:cNvPr', {
        id: "0",  // Non-visual ID
        name: image.alt || 'Imagen',  // Display name
        descr: image.alt || ''        // Description
    });
    nvPicPr.ele('pic:cNvPicPr');  // Non-visual picture properties

    // Image fill properties
    const blipFill = pic.ele('pic:blipFill');
    blipFill.ele('a:blip', {
        'r:embed': relId  // Relationship ID reference
    });
    blipFill.ele('a:stretch').ele('a:fillRect');  // Fill mode

    // Shape properties
    const spPr = pic.ele('pic:spPr');
    const xfrm = spPr.ele('a:xfrm');  // Transformation
    xfrm.ele('a:off', { x: "0", y: "0" });  // Position
    xfrm.ele('a:ext', {
        cx: widthEmu.toString(),  // Width
        cy: heightEmu.toString()  // Height
    });
    
    // Geometry (rectangle shape)
    spPr.ele('a:prstGeom', { prst: "rect" })
        .ele('a:avLst');  // Adjustment values list
}