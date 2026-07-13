
# docxmaker (v1.0.0)

A powerful yet lightweight DOCX document generator for **Node.js and the Browser**,  
using structured JSON definitions inspired by the simplicity of libraries like **pdfmake**.

Supports text, paragraphs, links, tables, images, headers, footers, lists, and dynamic fields  
with automatic relationship management.

---

## ✨ What's New in v1.0.0

- 🧩 **Table colspan & rowspan** — Merge cells horizontally and vertically.
- 📋 **Real numbered & bulleted lists** — Uses Word's native numbering system (`<w:numPr>`), not fake bullets.
- 🔢 **`PAGE` and `NUMPAGES` fields** — Page numbering in headers and footers.
- 📐 **Page configuration** — Size (A4, Letter...), orientation (portrait/landscape), and custom margins.
- 🎨 **Reusable styles** — Define styles by `id` and apply them with `style: 'myId'`.

---

## 📦 Installation

```bash
npm install docxmaker
```

---

## 🚀 Basic Usage (Node.js)

```ts
import { DocxGenerator } from 'docxmaker';

const doc = {
  header: {
    content: [
      { type: 'text', text: 'My Company', style: { align: 'center', bold: true } }
    ]
  },
  footer: {
    content: [
      { type: 'field', field: 'PAGE' },
      ' / ',
      { type: 'field', field: 'NUMPAGES' }
    ]
  },
  content: [
    'Hello World!',
    {
      type: 'paragraph',
      content: [
        'Visit ',
        { type: 'link', text: 'Google', url: 'https://google.com' }
      ]
    },
    {
      type: 'image',
      image: { path: './logo.png' },
      width: 180,
      align: 'center'
    }
  ]
};

await new DocxGenerator(doc).save('output.docx');

// Or generate directly as bytes
const bytes = await DocxGenerator.toBuffer(doc);
```

---

## 🌐 Basic Usage (Browser)

```ts
import { DocxGenerator } from 'docxmaker';

const doc = {
  content: [
    'Generated in the browser!',
    {
      type: 'image',
      image: { url: 'https://example.com/logo.png' },
      width: 120
    }
  ]
};

// Triggers a file download
await new DocxGenerator(doc).save('browser-doc.docx');
```

`docxmaker` resolves automatically to browser runtime code in modern bundlers.
If you want to force browser-only entrypoints, you can still use `docxmaker/browser`.

### Direct browser usage (no bundler)

Drop the pre-built browser bundle in your HTML:

```html
<script type="module">
  import { DocxGenerator } from './docxmaker.browser.js';
  const doc = new DocxGenerator({ content: ['Hello!'] });
  const blob = await doc.generateDocxBlob();
  // download or upload...
</script>
```

The file is available at `dist/browser/index.browser.js` after install or build.

---

## 📘 JSON Structure

### Supported Content Types

### 1. **Text**

```ts
"Plain text"
// or
{
  type: 'text',
  text: 'Styled text',
  style: { bold: true, color: 'FF0000', fontSize: 14 }
}
```

---

### 2. **Paragraph**

```ts
{
  type: 'paragraph',
  content: [
    'Some text ',
    { type: 'link', text: 'Link', url: 'https://example.com' }
  ],
  style: { align: 'center', lineSpacing: 1.5 }
}
```

---

### 3. **Table**

```ts
{
  type: 'table',
  style: { columnWidths: [2000, 4000] },
  rows: [
    {
      cells: [
        { content: ['Header 1'] },
        { content: ['Header 2'] }
      ]
    },
    {
      cells: [
        { content: ['Row 1'] },
        { content: ['Data'] }
      ]
    }
  ]
}
```

---

### 4. **Image**

```ts
{
  type: 'image',
  image: { path: './logo.png' }, // Node
  // image: file | blob | { url } // Browser
  width: 150,
  height: 100,
  alt: 'Description',
  align: 'center'
}
```

#### Supported Image Inputs

| Environment | Input Type                        |
| ----------- | --------------------------------- |
| Node.js     | `Uint8Array`/`Buffer`, `{ path }`, base64 |
| Browser     | `Blob`, `File`, `{ url }`, base64 |
| Both        | `Uint8Array`, `ArrayBuffer`       |

---

### 5. **Header / Footer**

```ts
{
  header: {
    content: [
      { type: 'text', text: 'Company Header', style: { align: 'center' } }
    ]
  },
  footer: {
    content: [
      { type: 'field', field: 'PAGE' },
      ' of ',
      { type: 'field', field: 'NUMPAGES' }
    ]
  }
}
```

---

### 6. **Fields (PAGE / NUMPAGES)**

```ts
{
  type: 'field',
  field: 'PAGE' // or 'NUMPAGES'
}
```

Useful for page numbering in headers and footers.

---

### 7. **Lists**

Simple list rendering without `numbering.xml`.

```ts
{
  type: 'list',
  variant: 'unordered', // or 'ordered'
  items: [
    ['First item'],
    ['Second item with ', { type: 'link', text: 'link', url: 'https://example.com' }],
    ['Third item']
  ],
  style: {
    indentTwips: 720,
    hangingTwips: 360
  }
}
```

---

## 🛠 API Reference

### `new DocxGenerator(definition)`

Creates a generator instance from a structured JSON definition.

---

### `save(filename: string): Promise<void>`

* **Node.js** → writes file to disk
* **Browser** → triggers file download
* Automatically enforces `.docx` extension

---

### `generateDocxBuffer(): Promise<Uint8Array>`

Returns the DOCX as bytes (`Uint8Array`) in both Node.js and browser runtimes.

---

### `generateDocxBlob(): Promise<Blob>`

Returns the DOCX as a `Blob` in both Node.js and browser runtimes.

---

### `DocxGenerator.toBuffer(definition): Promise<Uint8Array>`

Static shortcut to generate bytes (`Uint8Array`) in both runtimes.

---

### `DocxGenerator.toBlob(definition): Promise<Blob>`

Static shortcut to generate a `Blob` in both runtimes.

---

## ⚠️ Error Handling

All generation errors throw a `DocxGenerationError`, including:

* Friendly message
* Original error cause
* Clean stack trace (developer-friendly)

Example:

```
DOCX Generation Error
→ Failed to save DOCX file.
└─ Caused by: Error: Invalid output extension ".zip"
```

---

## 🧾 License

MIT

---

## ✍️ Author

**@oss-dev** — Creator and maintainer
Inspired by the simplicity of [pdfmake](https://www.npmjs.com/package/pdfmake).

---

## ⚙️ Dependencies

* **jszip** — DOCX packaging engine
* **xmlbuilder2** — XML generation (Node.js only; bundled with polyfills for browser)

---

Contributions, issues, and suggestions are welcome 🚀


