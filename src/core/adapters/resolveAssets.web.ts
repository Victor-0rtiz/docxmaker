import type { DocxDefinition } from '../types/types.js';

/**
 * Normalizes various browser binary inputs (Blob/File/ArrayBuffer/TypedArray)
 * into a Uint8Array so the downstream XML generators can treat all images
 * uniformly.
 *
 * @param {any} input Potential binary-like value supplied by consumers.
 * @returns {Promise<Uint8Array | null>} Uint8Array when conversion succeeds, otherwise null.
 */
async function toUint8Array(input: any): Promise<Uint8Array | null> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);

  // Blob / File
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return new Uint8Array(await input.arrayBuffer());
  }

  return null;
}

/**
 * Resolves browser-friendly assets before XML generation.
 *
 * - Clones the definition to keep the public object immutable.
 * - Fetches `{ image: { url } }` and stores them as Uint8Array.
 * - Converts Blob/File/ArrayBuffer/TypedArray inputs with `toUint8Array`.
 * - Recursively visits paragraphs, tables, headers, and footers.
 *
 * @param {DocxDefinition} def Original definition with potential remote or structured assets.
 * @returns {Promise<DocxDefinition>} Definition where every image is a Uint8Array or base64 string.
 */
export async function resolveAssetsWeb(def: DocxDefinition): Promise<DocxDefinition> {
  const clone: DocxDefinition =
    typeof structuredClone === 'function'
      ? structuredClone(def)
      : JSON.parse(JSON.stringify(def));

  const processItem = async (item: any): Promise<any> => {
    if (typeof item === 'string') return item;

    if (item?.type === 'image') {
      const img = item.image;

      // { url } -> fetch -> Uint8Array
      if (img && typeof img === 'object' && 'url' in img && typeof img.url === 'string') {
        const res = await fetch(img.url, { mode: 'cors' });
        if (!res.ok) throw new Error(`Failed to fetch image: ${img.url}`);
        const u8 = new Uint8Array(await res.arrayBuffer());
        return { ...item, image: u8 };
      }

      // Blob/File/ArrayBuffer/Uint8Array -> Uint8Array
      const u8 = await toUint8Array(img);
      if (u8) return { ...item, image: u8 };

      // base64 stays as string
      return item;
    }

    if (item?.type === 'paragraph' && Array.isArray(item.content)) {
      return { ...item, content: await Promise.all(item.content.map(processItem)) };
    }

    if (item?.type === 'table' && Array.isArray(item.rows)) {
      const rows = [];
      for (const row of item.rows ?? []) {
        const cells = [];
        for (const cell of row.cells ?? []) {
          const content = await Promise.all((cell.content ?? []).map(processItem));
          cells.push({ ...cell, content });
        }
        rows.push({ ...row, cells });
      }
      return { ...item, rows };
    }

    if (Array.isArray(item?.content)) {
      return { ...item, content: await Promise.all(item.content.map(processItem)) };
    }

    return item;
  };

  const content = await Promise.all((clone.content ?? []).map(processItem));

  let header = clone.header;
  let footer = clone.footer;

  if (header?.content) header = { ...header, content: await Promise.all(header.content.map(processItem)) };
  if (footer?.content) footer = { ...footer, content: await Promise.all(footer.content.map(processItem)) };

  return { ...clone, content, header, footer };
}
