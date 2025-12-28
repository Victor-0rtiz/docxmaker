import { readFile } from 'node:fs/promises';
import type { DocxDefinition } from '../types/types.js';

/**
 * Deeply resolves file-system backed assets for Node.js environments.
 *
 * - Clones the provided definition to avoid mutating caller data.
 * - Converts every `{ image: { path } }` into a Uint8Array read via fs/promises.
 * - Leaves Buffers/base64 strings untouched.
 * - Recursively traverses paragraphs, tables, headers, and footers.
 *
 * @param {DocxDefinition} def Original document definition supplied by the consumer.
 * @returns {Promise<DocxDefinition>} New definition where all file-based images are binary blobs.
 */
export async function resolveAssetsNode(def: DocxDefinition): Promise<DocxDefinition> {
  const clone: DocxDefinition =
    typeof structuredClone === 'function'
      ? structuredClone(def)
      : JSON.parse(JSON.stringify(def));

  const processItem = async (item: any): Promise<any> => {
    if (typeof item === 'string') return item;

    if (item?.type === 'image') {
      const img = item.image;

      // { path } -> Buffer
      if (img && typeof img === 'object' && 'path' in img && typeof img.path === 'string') {
        const data = await readFile(img.path);
        return { ...item, image: new Uint8Array(data) };
      }

      // Buffer/base64 stays as-is
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
