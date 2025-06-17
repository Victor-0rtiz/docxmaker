
# docxmaker

A simple and flexible DOCX document generator for Node.js using JSON definitions. Supports text, paragraphs, links, and tables with automatic relationship management.

## ✨ Features

- Generate `.docx` files from simple JSON structure
- Supports plain text, styled paragraphs, hyperlinks, and tables
- Hyperlink relationships handled automatically
- Outputs as file or buffer
- Zero native dependencies – works cross-platform

## 📦 Installation

```bash
npm install docxmaker
```

## 🚀 Usage

```ts
import { DocxGenerator } from 'docxmaker';

const definition = {
  content: [
    "Hello World!",
    {
      type: "paragraph",
      content: [
        "Visit ",
        { type: "link", text: "Google", url: "https://google.com" }
      ]
    },
    {
      type: "table",
      rows: [
        { cells: [{ content: ["Cell 1"] }, { content: ["Cell 2"] }] }
      ]
    }
  ]
};

const generator = new DocxGenerator(definition);

// Save to file
await generator.save('document.docx');

// Or get as buffer
const buffer = await generator.generateDocxBuffer();
```

## 📘 JSON Structure

Supported content types:

* `"text"`: Plain or styled text
* `"paragraph"`: Paragraph with mixed content (text and links)
* `"table"`: Tables with rows and cells

You can nest and combine types as needed.

## 🛠 API

### `new DocxGenerator(definition)`

Creates an instance from a definition.

### `save(outputPath: string): Promise<void>`

Saves the DOCX to a file.

### `generateDocxBuffer(): Promise<Buffer>`

Returns the DOCX as a Node.js `Buffer`.

### `DocxGenerator.toBuffer(definition): Promise<Buffer>`

Static method to quickly generate a buffer without creating an instance.

## ⚠️ Errors

All errors throw a `DocxGenerationError` which includes an optional `originalError`.

## License
MIT


## ✍️ Authors
@oss-dev – Creator and maintainer

Inspired by the simplicity and declarative structure of libraries like ([pdfmake](https://www.npmjs.com/package/pdfmake)).

Thanks to the open source community and tools like:

([xmlbuilder2](https://www.npmjs.com/package/xmlbuilder2)) – for building well-structured XML

([jszip](https://www.npmjs.com/package/jszip)) – for generating ZIP-based DOCX packages

Contributions are welcome!