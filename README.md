# docxmaker (v0.0.3)

A powerful and flexible DOCX document generator for Node.js using JSON definitions. Supports text, paragraphs, links, tables, and now images with automatic relationship management.

## ✨ Enhanced Features in v0.0.3

- 🖼️ **Image Support** - Add images from Buffer or base64 strings
- 🧩 **Decoupled Architecture** - Refactored implementation for better maintainability
- 🧬 **Relationship Management** - Automatic handling of hyperlinks and images
- 🎨 **Advanced Styling** - Comprehensive text and paragraph formatting options
- 📊 **Table Enhancements** - Cell styling and column width control
- 📦 **Zero Native Dependencies** - Works cross-platform

## 📦 Installation

```bash
npm install docxmaker
```

## 🚀 Basic Usage

```ts
import { DocxGenerator } from 'docxmaker';
import fs from 'fs';

// Document definition
const doc = {
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
    },
    {
      type: 'image',
      image: fs.readFileSync('logo.png'),
      width: 200,
      alt: 'Company Logo'
    }
  ]
};

// Using class instance
const generator = new DocxGenerator(doc);
await generator.save('document.docx');

// Or use static method for quick generation
const buffer = await DocxGenerator.toBuffer(doc);
fs.writeFileSync('document-static.docx', buffer);
```

## 📘 JSON Structure

### Supported Content Types

1. **Text**:
   ```ts
   "Plain text string"
   // or
   { 
     type: 'text',
     text: 'Styled text',
     style: { 
       bold: true, 
       color: 'FF0000',
       fontSize: 14
     }
   }
   ```

2. **Paragraph** (supports mixed content):
   ```ts
   {
     type: 'paragraph',
     content: [
       "Text ",
       { type: 'link', text: 'Link', url: 'https://example.com' },
       { type: 'image', image: buffer }
     ],
     style: {
       align: 'center',
       lineSpacing: 1.5
     }
   }
   ```

3. **Table**:
   ```ts
   {
     type: 'table',
     style: {
       columnWidths: [2000, 4000], // in twips (1/20 point)
       backgroundColor: '#f0f0f0'
     },
     rows: [
       {
         cells: [
           { 
             content: ["Header 1"],
             style: { width: 2000, backgroundColor: '#e0e0e0' }
           },
           { content: ["Header 2"] }
         ]
       }
     ]
   }
   ```

4. **Image**:
   ```ts
   {
     type: 'image',
     image: Buffer | base64String, // Image data
     width: 150,                   // Width in pixels
     height: 100,                  // Height in pixels (optional)
     alt: 'Description',           // Alternative text
     align: 'center'               // Alignment
   }
   ```

## 🛠 Enhanced API

### `new DocxGenerator(definition)`
Creates an instance from a document definition. The implementation is now more modular and maintainable.

### `save(outputPath: string): Promise<void>`
Saves the DOCX to a file.

### `generateDocxBuffer(): Promise<Buffer>`
Returns the DOCX as a Node.js `Buffer`.

### `DocxGenerator.toBuffer(definition): Promise<Buffer>`
Static method to quickly generate a buffer without creating an instance.

## 🆕 What's New in v0.0.3

### Image Support
Easily add images to your documents from various sources:
```ts
// From file buffer
{ 
  type: 'image',
  image: fs.readFileSync('logo.png')
}

// From base64 string
{
  type: 'image',
  image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
}
```

### Refactored Architecture
The core implementation has been completely refactored:
- 🧩 Decoupled relationship management
- 🖼️ Separate image handling
- 🧬 Modular XML generators
- 🔄 Improved state management



## ⚠️ Error Handling

All errors throw a `DocxGenerationError` which includes an optional `originalError` property.

## 🖼️ Image Example

```ts
import fs from 'fs';

const docWithImage = {
  content: [
    {
      type: 'paragraph',
      content: [
        "Our Company Logo: ",
        {
          type: 'image',
          image: fs.readFileSync('logo.png'),
          width: 150,
          alt: 'Company Logo',
          align: 'center'
        }
      ]
    }
  ]
};

await new DocxGenerator(docWithImage).save('with-image.docx');
```

## 📚 Advanced Usage

### Using Default Styles
```ts
const styledDoc = {
  content: [
    {
      type: 'paragraph',
      content: [
        "Default text ",
        { 
          type: 'text', 
          text: 'Bold red text',
          style: { bold: true, color: 'FF0000' }
        }
      ],
      style: {
        fontSize: 12, // Applies to all text in paragraph
        align: 'center'
      }
    }
  ]
};
```

### Mixed Content Table
```ts
const tableDoc = {
  content: [
    {
      type: 'table',
      style: { columnWidths: [3000, 5000] },
      rows: [
        {
          cells: [
            { content: ["Product"] },
            { content: ["Description"] }
          ]
        },
        {
          cells: [
            { 
              content: ["DocxMaker"],
              style: { backgroundColor: '#e6f7ff' }
            },
            { 
              content: [
                "A powerful DOCX generator ",
                { 
                  type: 'link', 
                  text: 'GitHub', 
                  url: 'https://github.com/your-repo'
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
```

## License
MIT

## ✍️ Authors
@oss-dev - Creator and maintainer

Inspired by the simplicity of libraries like [pdfmake](https://www.npmjs.com/package/pdfmake).

## Dependencies
Special thanks to:
- [xmlbuilder2](https://www.npmjs.com/package/xmlbuilder2) - XML construction
- [jszip](https://www.npmjs.com/package/jszip) - DOCX package generation

Contributions are welcome!