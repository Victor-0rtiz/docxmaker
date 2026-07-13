import type { PageSizeName } from '../core/types/types.js';

export const PAGE_SIZES: Record<PageSizeName, { width: number; height: number }> = {
  A3:       { width: 16838, height: 23818 },
  A4:       { width: 11906, height: 16838 },
  A5:       { width: 8391,  height: 11906 },
  Letter:   { width: 12240, height: 15840 },
  Legal:    { width: 12240, height: 20160 },
  Tabloid:  { width: 15840, height: 24480 },
};

export function getPageSize(name: PageSizeName, orientation?: 'portrait' | 'landscape'): { width: number; height: number } {
  const size = PAGE_SIZES[name];
  if (orientation === 'landscape') {
    return { width: size.height, height: size.width };
  }
  return size;
}

export const DEFAULT_MARGINS = { top: 1440, right: 1440, bottom: 1440, left: 1440 };
