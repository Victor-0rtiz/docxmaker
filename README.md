# docxmaker (v0.0.4)

A powerful and flexible DOCX document generator for Node.js using JSON definitions.  
Supports text, paragraphs, links, tables, headers, footers, and images with automatic relationship management.

---

## ✨ What's New in v0.0.4

- 🧩 **Async Asset Resolution** — Images can now be loaded automatically from file paths (`{ path: '...' }`), `Buffer`, or base64 strings.
- � **Header & Footer Support** — Add headers and footers to your documents via `header` and `footer` sections in your definition.
- 💬 **Improved Developer Experience** — Errors now display colorful, structured output with the original cause and stack trace.
- ⚙️ **Typed Arrays Support** — `createImage()` now accepts `Uint8Array` and other typed views directly.
- 🧱 Internal refactors for cleaner modularity, and better error handling.

---

## 📦 Installation

```bash
npm install docxmaker
```

---

## 🚀 Basic Usage

```ts
import { DocxGenerator } from 'docxmaker';

// Basic document definition
const doc = {
  header: { content: [{ type: 'text', text: 'My Company', style: { align: 'center' } }] },
  footer: { content: ['Page Footer Example'] },
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
      type: 'table',
      rows: [
        { cells: [{ content: ['Cell 1'] }, { content: ['Cell 2'] }] }
      ]
    },
    {
      type: 'image',
      image: { path: './logo.png' }, // async read 
      width: 180,
      alt: 'Company Logo',
      align: 'center'
    }
  ]
};

const generator = new DocxGenerator(doc);
await generator.save('output.docx'); // ensures .docx extension

// Or generate directly as Buffer
const buffer = await DocxGenerator.toBuffer(doc);
```

---

## 📘 JSON Structure

### Supported Content Types

1. **Text**

   ```ts
   "Plain text"
   // or
   { 
     type: 'text',
     text: 'Styled text',
     style: { bold: true, color: 'FF0000', fontSize: 14 }
   }
   ```

2. **Paragraph**

   ```ts
   {
     type: 'paragraph',
     content: [
       'Some text ',
       { type: 'link', text: 'Link', url: 'https://example.com' },
       { type: 'image', image: { path: './img.png' }, width: 100 }
     ],
     style: { align: 'center', lineSpacing: 1.5 }
   }
   ```

3. **Table**

   ```ts
   {
     type: 'table',
     style: { columnWidths: [2000, 4000], backgroundColor: '#f0f0f0' },
     rows: [
       {
         cells: [
           { content: ['Header 1'], style: { backgroundColor: '#ddd' } },
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

4. **Image**

   ```ts
   {
     type: 'image',
     image: Buffer | base64String | { path: './logo.png' },
     width: 150,
     height: 100,
     alt: 'Description',
     align: 'center'
   }
   ```

5. **Header / Footer**

   ```ts
   {
     header: {
       content: [
         { type: 'text', text: 'Company Header', style: { align: 'center', bold: true } }
       ]
     },
     footer: {
       content: [
         { type: 'text', text: 'Confidential', style: { align: 'right', color: '999999' } }
       ]
     }
   }
   ```

---

## 🛠 API Reference

### `new DocxGenerator(definition)`

Creates an instance of the generator using a structured JSON definition.

### `save(outputPath: string): Promise<void>`

Generates and saves the DOCX file.

* Automatically appends `.docx` if missing.
* Throws a formatted `DocxGenerationError` for invalid paths or write issues.

### `generateDocxBuffer(): Promise<Buffer>`

Generates the DOCX and returns it as a Node.js `Buffer`.

### `DocxGenerator.toBuffer(definition): Promise<Buffer>`

Static shortcut for generating a DOCX buffer from a definition.

---

## 🧩 Image Input Options

| Input Type    | Example                            | Description                          |
| ------------- | ---------------------------------- | ------------------------------------ |
| **File Path** | `{ path: './logo.png' }`           | Automatically read  |
| **Buffer**    | `fs.readFileSync('logo.png')`      | Manually handled image data          |
| **Base64**    | `'data:image/png;base64,iVBOR...'` | Inline base64 or Data URI            |

---

## ⚠️ Error Handling

All generation issues throw a `DocxGenerationError`, which includes:

* A readable message
* The original error cause (if any)
* A colorized stack trace in development

Example output:

```
 DOCX Generation Error
→ Failed to save DOCX file.
└─ Caused by: Error: ENOENT: no such file or directory, open '/invalid/path.docx'
```

---

## 🖼️ Example with Header, Footer, and Image

```ts
import { DocxGenerator } from 'docxmaker';

const def = {
  header: { content: [{ type: 'text', text: 'My Company', style: { align: 'center' } }] },
  footer: { content: ['© 2025 My Company - All rights reserved'] },
  content: [
    'Hello!',
    { type: 'image', image: { path: './logo.png' }, width: 200, align: 'center' }
  ]
};

await new DocxGenerator(def).save('company-profile.docx');
```

---

## 📚 Advanced Example — Mixed Content Table

```ts
const tableDoc = {
  content: [
    {
      type: 'table',
      style: { columnWidths: [3000, 5000] },
      rows: [
        {
          cells: [
            { content: ['Product'] },
            { content: ['Description'] }
          ]
        },
        {
          cells: [
            { content: ['DocxMaker'], style: { backgroundColor: '#e6f7ff' } },
            { content: [
              'A powerful DOCX generator ',
              { type: 'link', text: 'GitHub', url: 'https://github.com/Victor-0rtiz/docxmaker' }
            ]}
          ]
        }
      ]
    }
  ]
};
```

---

## 🧾 License

MIT

---

## ✍️ Author

**@oss-dev** — Creator and maintainer
Inspired by the simplicity of libraries like [pdfmake](https://www.npmjs.com/package/pdfmake).

---

## ⚙️ Dependencies

Special thanks to:

* [xmlbuilder2](https://www.npmjs.com/package/xmlbuilder2) — XML construction
* [jszip](https://www.npmjs.com/package/jszip) — DOCX packaging engine

Contributions are welcome!