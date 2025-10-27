# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

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
