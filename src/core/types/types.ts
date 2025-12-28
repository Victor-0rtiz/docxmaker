/**
 * Common horizontal alignment values
 */
export type HorizontalAlign = 'left' | 'right' | 'center' | 'justify';

/**
 * Common vertical alignment values
 */
export type VerticalAlign = 'top' | 'middle' | 'bottom';

/**
 * Common text styling applicable to multiple elements
 */
export interface StyleText {
  /** Text color in hexadecimal format (e.g., 'FF0000' for red) */
  color?: string;

  /** Bold text */
  bold?: boolean;

  /** Italic text */
  italic?: boolean;

  /** Underlined text */
  underline?: boolean;

  /** Horizontal alignment of the text within a paragraph or cell */
  align?: HorizontalAlign;

  /**
   * Font size in points
   * @example 12
   */
  fontSize?: number;

  /**
   * Line spacing multiplier (e.g., 1.0 for single spacing, 1.5 for 1.5 spacing)
   * @example 1.5
   */
  lineSpacing?: number;
}

/**
 * Basic text element
 */
export interface TextElement {
  type: 'text';

  /** Text content */
  text: string;

  /** Style applied to this text fragment */
  style?: StyleText;
}

/**
 * Hyperlink element
 */
export interface LinkElement {
  type: 'link';

  /** Display text for the link */
  text: string;

  /** Target URL */
  url: string;

  /** Optional link text styling */
  style?: StyleText;
}

/**
 * Paragraph element containing multiple content fragments
 */
export interface ParagraphElement {
  type: 'paragraph';

  /** Paragraph content (text and/or links) */
  content: ParagraphContent[];

  /** Paragraph-wide styling */
  style?: StyleText;
}

/**
 * A table cell containing formatted content
 */
export interface TableCell {
  /** Content within the cell (text, links, etc.) */
  content: ParagraphContent[];

  /** Optional styling specific to this cell */
  style?: StyleText & {
    /**
     * Cell width in twips (1/20 of a point)
     * @example 2400
     */
    width?: number;

    /** Background color in hexadecimal (e.g., 'CCCCCC' for gray) */
    backgroundColor?: string;

    /** Horizontal content alignment within the cell */
    align?: HorizontalAlign;

    /** Vertical content alignment within the cell */
    verticalAlign?: VerticalAlign;
  };
}

/**
 * A table row composed of multiple cells
 */
export interface TableRow {
  /** Array of table cells */
  cells: TableCell[];
}

/**
 * A table element for displaying structured data
 */
export interface TableElement {
  type: 'table';

  /** Rows comprising the table */
  rows: TableRow[];

  /** Optional table-wide styles */
  style?: {
    /**
     * Total table width in twips (1/20 of a point)
     * @example 9000
     */
    width?: number;

    /**
     * Column widths in twips
     * @example [3000, 3000, 3000]
     */
    columnWidths?: number[];

    /** Horizontal alignment of the table */
    align?: HorizontalAlign;

    /** Vertical alignment of the table (applies to all cells) */
    verticalAlign?: VerticalAlign;

    /** Background color of all cells unless overridden */
    backgroundColor?: string;
  };
}
/**
 * Image input supported by docxmaker (Node + Browser).
 *
 * ✅ Node.js:
 * - Buffer
 * - base64 string / data URI string
 * - { path: string } (resolved via fs/promises)
 *
 * ✅ Browser:
 * - base64 string / data URI string
 * - Blob / File
 * - Uint8Array / ArrayBuffer
 * - { url: string } (resolved via fetch; requires CORS if remote)
 *
 * Notes:
 * - `{ path }` is Node-only (no filesystem in browsers).
 * - `{ url }` is Browser-friendly; in Node you can still fetch manually and pass Buffer if you want.
 */
export type ImageInput =
  | Buffer
  | string
  | Uint8Array
  | ArrayBuffer
  | Blob
  | File
  | { path: string }
  | { url: string };


/**
 * Image element
 */
export interface ImageElement {
  type: 'image';

  /**
   * Image data source.
   *
   * @example Node (recommended)
   * image: { path: './logo.png' }
   *
   * @example Node (buffer)
   * image: fs.readFileSync('./logo.png')
   *
   * @example Browser (File input)
   * image: file
   *
   * @example Browser (URL)
   * image: { url: 'https://example.com/logo.png' }
   *
   * @example Any (data URI)
   * image: 'data:image/png;base64,iVBORw0K...'
   */
  image: ImageInput;

  /** Width in pixels (optional) */
  width?: number;

  /** Height in pixels (optional) */
  height?: number;

  /** Alternative text for accessibility */
  alt?: string;

  /** Alignment (optional) */
  align?: 'left' | 'center' | 'right';
}


/**
 * Field element (PAGE / NUMPAGES) for Word field codes
 */
export interface FieldElement {
  type: 'field';
  /**
   * Word field instruction.
   * - PAGE: current page number
   * - NUMPAGES: total pages
   */
  field: 'PAGE' | 'NUMPAGES';
}

/**
 * List element (simple list without numbering.xml)
 * Renders each item as its own paragraph with bullet or numeric prefix.
 */
export interface ListElement {
  type: 'list';

  /** 'unordered' -> bullets, 'ordered' -> 1.,2.,3. */
  variant?: 'unordered' | 'ordered';

  /**
   * List items. Each item is a "paragraph-like" content array
   * so it can include text/link/image/field mixed.
   */
  items: ParagraphContent[][];

  /**
   * Optional list style.
   * - indentTwips: left indent for list block
   * - hangingTwips: hanging indent for prefix width
   */
  style?: StyleText & {
    indentTwips?: number;   // default 720 (0.5")
    hangingTwips?: number;  // default 360 (0.25")
  };
}


export type HeaderFooterType = 'default';

export interface HeaderFooterDefinition {
  type?: HeaderFooterType;                 // futuro: 'first' | 'even'
  content: DocxDefinition['content'];      // reutiliza el mismo formato que body
}

/**
 * Content allowed inside a paragraph
 */
export type ParagraphContent = string | TextElement | LinkElement | ImageElement | FieldElement;

/**
 * All possible top-level elements in a document
 */
export type DocumentElement = string | ParagraphElement | TextElement | LinkElement | TableElement | ImageElement | ListElement;

/**
 * Complete structure used to define a DOCX document
 */
export interface DocxDefinition {
  /**
   * Main document content
   * @example
   * {
   *   content: [
   *     { type: 'text', text: 'Hello world', style: { bold: true } },
   *     {
   *       type: 'table',
   *       rows: [
   *         { cells: [{ content: ['Row 1 Col 1'] }, { content: ['Row 1 Col 2'] }] },
   *         { cells: [{ content: ['Row 2 Col 1'] }, { content: ['Row 2 Col 2'] }] }
   *       ]
   *     }
   *   ]
   * }
   */
  content: DocumentElement[];
  header?: HeaderFooterDefinition;         // header definition
  footer?: HeaderFooterDefinition;         // footer definition
}
