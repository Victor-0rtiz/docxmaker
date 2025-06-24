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
 * Image element
 */
export interface ImageElement {
  type: 'image';
  /** Buffer binario o string base64 (el contenido de la imagen) */
  image: Buffer | string;
  /** ancho en píxeles (opcional) */
  width?: number;
  /** alto en píxeles (opcional) */
  height?: number;
  /** texto alternativo para accesibilidad */
  alt?: string;
  /** alineación (opcional) */
  align?: 'left' | 'center' | 'right';
}


/**
 * Content allowed inside a paragraph
 */
export type ParagraphContent = string | TextElement | LinkElement | ImageElement;

/**
 * All possible top-level elements in a document
 */
export type DocumentElement = string | ParagraphElement | TextElement | LinkElement | TableElement | ImageElement;

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
}
