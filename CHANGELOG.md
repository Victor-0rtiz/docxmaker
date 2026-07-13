
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2026-07-12

### Added
- 🧩 **colspan y rowspan en tablas** — Ahora podés combinar celdas horizontal y verticalmente.
- 📋 **Listas numeradas y con viñetas (reales)** — Usan `<w:numPr>` con `numbering.xml`, no viñetas falsas.
- 🔢 **Campos dinámicos `PAGE` y `NUMPAGES`** — Para numeración de páginas en header/footer.
- 🌐 **Browser build autónomo** — El archivo `docxmaker.browser.js` funciona sin CDNs, importmaps ni scripts externos. Solo 428 KB.
- 📐 **Configuración de página** — `page.size` (A4, Letter, etc.), `page.orientation` y `page.margins` personalizables.
- 🧪 **Suite de pruebas** — 12 escenarios en Node.js más página interactiva de prueba en navegador.

### Changed
- ⬆️ **Versión estable 1.0.0** — API estable para los casos actualmente soportados y verificada en Node.js y navegador.
- 🧼 **xmlbuilder2 ya no es peer dependency** — El browser build lo incluye internamente.
- 🎨 **Estilos registrados** — Podés definir estilos reutilizables con `styles: [{ id: 'MiEstilo', style: {...} }]` y aplicarlos con `style: 'MiEstilo'`.
- 🔗 **Hipervínculos en el mismo párrafo que texto plano** — Ahora podés mezclar links con texto normal en una sola línea.

### Fixed
- 🐛 **Documentos abriéndose correctamente en Word** — Se corrigió el valor inválido `w:vAlign="middle"` (debe ser `"center"`) y el orden de los elementos `<w:sectPr>` y `<w:tblPr>` que Word exige estrictamente.
- 🧼 **XML más limpio** — Se evitó generar `<w:rPr/>` cuando no existen propiedades de texto, reduciendo marcado innecesario.

---

## [0.1.0] - 2026-03-12

### Added
- 🧪 **Cross-runtime smoke verification**:
  - Added `npm run test:smoke` to validate Node.js and browser outputs from built artifacts.
  - Added `npm run verify` as a release-ready check (`build` + `test:smoke`).
- 🧩 **Unified runtime API**:
  - Added `generateDocxBlob()` to the Node.js generator.
  - Added `generateDocxBuffer()` and static `toBuffer()` to the browser generator.

### Changed
- 🌐 **Single-import experience**:
  - Package usage now supports the same import path in Node.js and browser (`docxmaker`) with consistent typing.
- 📦 **Type consistency across environments**:
  - `toBuffer()` and `generateDocxBuffer()` now return `Uint8Array` in both runtimes.
  - Public image input types now prefer `Uint8Array`/`ArrayBuffer` as cross-platform binary primitives.
- 📝 **Documentation refresh**:
  - Updated README examples and API reference for the unified import and unified method behavior.

### Fixed
- 🔒 **Browser compatibility hardening**:
  - Removed Node-only dependency usage from shared `DocxGenerationError` formatting.
  - Prevented accidental Node utility imports from leaking into browser bundles.

---

## [0.0.5] - 2025-12-27

### Added
- 🌐 **Browser support**: DOCX generation now works natively in the browser.
  - Automatic file download via `save('file.docx')`.
  - New static helper `DocxGenerator.toBlob()` for browser usage.
- 📋 **List support**:
  - Added `list` element with `ordered` and `unordered` variants.
  - List items support mixed content (`text`, `link`, `image`, `field`).
  - Customizable indentation via `indentTwips` and `hangingTwips`.
- 🔢 **Dynamic Word fields**:
  - Added `field` element with support for `PAGE` and `NUMPAGES`.
  - Designed for page numbering in headers and footers.
- 🧩 **Unified document definition**:
  - The same JSON structure now works in both Node.js and browser environments.
- 🖼️ **Expanded image input support**:
  - Browser: `Blob`, `File`, `ArrayBuffer`, `{ url }`.
  - Node.js: `Buffer`, `Uint8Array`, `{ path }`.
- 📦 **Conditional exports**:
  - Added `browser` export entry to support bundlers like Vite and Webpack.

### Changed
- ⚙️ **Environment-specific generators**:
  - Introduced separate `DocxGenerator` implementations for Node.js and browser.
  - Shared core XML and ZIP logic to avoid duplication.
- 🔒 **Dependency stability**:
  - Pinned `xmlbuilder2` to `v3.1.1` due to browser incompatibilities in `v4.x`.
- 🧱 Internal refactors to support multi-platform asset resolution (`resolveAssets.node` / `resolveAssets.web`).

### Fixed
- 🐛 Fixed browser runtime crash caused by `xmlbuilder2@4.x` when bundled with Vite.
- 🖼️ Ensured image buffers are normalized (`Uint8Array`) across environments.
- 📄 Improved header/footer relationship handling for browser builds.

### Developer Notes
Version `0.0.5` is a **feature release** focused on **cross-platform support** and **document structure parity**  
between Node.js and browser environments, while preserving backward compatibility with `v0.0.4`.

---

## [0.0.4] - 2025-10-26

### Added
- 🧩 **Async asset resolution**: images can now be provided as `{ path: '...' }`, `Buffer`, or base64 string.  
  - Works seamlessly across Windows, macOS, and Linux.
- 🧠 **Header and footer support**: define `header` and `footer` sections in your `DocxDefinition` for consistent document layout.  
  - Automatically appends `.docx` if missing.  
  - Throws a descriptive error if another extension (e.g., `.zip`) is used.
- 💬 **Enhanced developer experience**: `DocxGenerationError` now prints colored, structured error messages with original causes and partial stack traces.
- 🧰 **Type improvements**:  
  - Added `imageInput` type supporting `{ path }`, `Buffer`, or base64.  
  - Extended `DocxDefinition` with `header` and `footer`.

### Changed
- ⚙️ `createImage` now supports `Uint8Array` and other `TypedArray` inputs.
- 🔧 Switched all file I/O to promises for modern async consistency.
- ♻️ Minor internal restructuring for better modularity and maintainability.

### Fixed
- 🖼️ Images loaded as raw binary (`readFile` without encoding) now render correctly.
- 🧩 Prevented invalid extensions (e.g., `.zip`) from being used for DOCX output.
- 🪶 Improved XML generation for new header and footer sections.

### Developer Notes
This release focuses on **robust image handling**, **document consistency**, and **developer-friendly feedback**.  
Version `0.0.4` remains fully backward-compatible with previous definitions.

---

## [0.0.3] - 2025-06-23

### Added
- 🖼️ **Image support**: add images to documents using either `Buffer` or base64 strings.
- 📐 Supports image customization: `width`, `height`, `alt`, and `align`.
- 🧾 Images can now appear both as standalone content and inline inside `paragraph` elements.
- 🔗 Automatic relationship management for images through internal `RelationshipsManager`.
- 💾 `ImageManager` module handles image registration, storage, and ZIP inclusion.
- ♻️ Refactored main generator to decouple image and relationship logic.
- 📘 Updated `README.md` with image usage examples.
- 🧪 Verified DOCX validity with inline and block image tests.

### Changed
- Major internal refactor: responsibilities split into `ImageManager`, `RelationshipsManager`, and dedicated XML generators.
- Improved XML structure readability and maintainability.

### Fixed
- Fixed paragraph alignment and spacing inconsistencies.
- Fixed image format detection for both binary buffers and base64 data URLs.

---

## [0.0.2] - 2024-12-xx

### Added
- 🔗 Support for `link` elements with automatic relationship generation.
- 🔡 Text styling: `bold`, `italic`, `underline`, `fontSize`, `color`, and `lineSpacing`.
- 📃 Paragraph-level styling with alignment and spacing options.
- 📊 Basic table generation with row and cell definitions.

### Changed
- Improved type definitions (`TextElement`, `ParagraphElement`, etc.) for stronger type safety.
- Enhanced paragraph and link XML generation.

---

## [0.0.1] - 2024-11-xx

### Added
- 🎉 Initial release!
- 📝 Generate DOCX files from JSON-based definitions.
- ✅ Supports basic text and paragraph content.
- 🧱 Internal XML generation powered by `xmlbuilder2`.
- 📦 ZIP packaging handled via `jszip`.
- 📘 Basic `README.md` with getting-started examples.

