# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [0.0.3] - 2025-06-23

### Added
- 🖼️ **Image support**: Add images to documents using either `Buffer` or base64 strings.
- 📐 Supports image customization: `width`, `height`, `alt`, and `align`.
- 🧾 Images can now be used both as standalone content and inline within `paragraph` elements.
- 🔗 Automatic relationship management for images using internal `RelationshipsManager`.
- 💾 `ImageManager` module handles registration, storage, and ZIP inclusion of images.
- ♻️ Refactored main generator class to decouple image and relationship responsibilities.
- 📘 Updated `README.md` with full examples of image usage.
- 🧪 Tests verified that generated DOCX is valid with inline and block images.

### Changed
- Major internal refactor: Split responsibilities into `ImageManager`, `RelationshipsManager`, and content XML generators.
- Improved XML structure clarity and maintainability.

### Fixed
- Paragraph alignment and spacing inconsistencies.
- Image format detection from binary buffers or data URLs.

---

## [0.0.2] - 2024-12-xx

### Added
- 🔗 Support for `link` elements with automatic relationship generation.
- 🔡 Text styles including `bold`, `italic`, `underline`, `fontSize`, `color`, and `lineSpacing`.
- 📃 Paragraph-level styling with alignment and spacing options.
- 📊 Basic table generation with row and cell definitions.

### Changed
- Improved type definitions (`TextElement`, `ParagraphElement`, etc.) for better type safety.
- Better XML generation for paragraphs and links.

---

## [0.0.1] - 2024-11-xx

### Added
- 🎉 Initial release!
- 📝 Generate DOCX files from JSON-based definitions.
- ✅ Supports basic text and paragraph content.
- 🧱 Internal XML generation using `xmlbuilder2`.
- 📦 Package creation using `jszip`.
- 📘 Basic README with getting started examples.
