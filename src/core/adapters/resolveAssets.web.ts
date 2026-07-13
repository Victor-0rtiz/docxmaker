import { deepClone } from '../../utils/clone.js';
import type { DocxDefinition } from '../types/types.js';

async function toUint8Array(input: any): Promise<Uint8Array | null> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);

  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    return new Uint8Array(await input.arrayBuffer());
  }

  return null;
}

export async function resolveAssetsWeb(def: DocxDefinition): Promise<DocxDefinition> {
  const clone = deepClone(def);

  const processItem = async (item: any): Promise<any> => {
    if (typeof item === 'string') return item;

    if (item?.type === 'image') {
      const img = item.image;

      if (img && typeof img === 'object' && 'url' in img && typeof img.url === 'string') {
        const res = await fetch(img.url, { mode: 'cors' });
        if (!res.ok) throw new Error(`Failed to fetch image: ${img.url}`);
        const u8 = new Uint8Array(await res.arrayBuffer());
        return { ...item, image: u8 };
      }

      const u8 = await toUint8Array(img);
      if (u8) return { ...item, image: u8 };

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
