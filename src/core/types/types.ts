export type HorizontalAlign = 'left' | 'right' | 'center' | 'justify';

export type VerticalAlign = 'top' | 'center' | 'bottom';

export type PageSizeName = 'A3' | 'A4' | 'A5' | 'Letter' | 'Legal' | 'Tabloid';

export interface StyleText {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: HorizontalAlign;
  fontSize?: number;
  lineSpacing?: number;
}

export interface DocxStyle {
  id: string;
  name?: string;
  type?: 'paragraph' | 'character';
  basedOn?: string;
  style: StyleText;
}

export interface PageConfig {
  size?: PageSizeName;
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface TextElement {
  type: 'text';
  text: string;
  style?: StyleText;
}

export interface LinkElement {
  type: 'link';
  text: string;
  url: string;
  style?: StyleText;
}

export interface ParagraphElement {
  type: 'paragraph';
  content: ParagraphContent[];
  style?: StyleText | string;
}

export interface TableCell {
  content: ParagraphContent[];
  colspan?: number;
  rowspan?: number;
  style?: StyleText & {
    width?: number;
    backgroundColor?: string;
    align?: HorizontalAlign;
    verticalAlign?: VerticalAlign;
  };
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableElement {
  type: 'table';
  rows: TableRow[];
  style?: {
    width?: number;
    columnWidths?: number[];
    align?: HorizontalAlign;
    verticalAlign?: VerticalAlign;
    backgroundColor?: string;
  };
}

export type ImageInput =
  | string
  | Uint8Array
  | ArrayBuffer
  | Blob
  | File
  | { path: string }
  | { url: string };

export interface ImageElement {
  type: 'image';
  image: ImageInput;
  width?: number;
  height?: number;
  alt?: string;
  align?: 'left' | 'center' | 'right';
}

export interface FieldElement {
  type: 'field';
  field: 'PAGE' | 'NUMPAGES';
}

export interface ListElement {
  type: 'list';
  variant?: 'unordered' | 'ordered';
  items: ParagraphContent[][];
  style?: StyleText & {
    indentTwips?: number;
    hangingTwips?: number;
  };
}

export type HeaderFooterType = 'default';

export interface HeaderFooterDefinition {
  type?: HeaderFooterType;
  content: DocumentElement[];
}

export type ParagraphContent = string | TextElement | LinkElement | ImageElement | FieldElement;

export type DocumentElement = string | ParagraphElement | TextElement | LinkElement | TableElement | ImageElement | ListElement | FieldElement;

export interface DocxDefinition {
  content: DocumentElement[];
  header?: HeaderFooterDefinition;
  footer?: HeaderFooterDefinition;
  styles?: DocxStyle[];
  page?: PageConfig;
}
