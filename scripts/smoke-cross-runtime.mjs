import assert from "node:assert/strict";
import { access, readFile, stat, unlink } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DocxGenerator as NodeDocxGenerator } from "../dist/index.js";
import { DocxGenerator as BrowserDocxGenerator } from "../dist/browser/index.browser.js";

function assertDocxSignature(bytes) {
  // DOCX is a ZIP package and should begin with PK\x03\x04.
  assert.equal(bytes[0], 0x50, "Invalid DOCX signature byte 1");
  assert.equal(bytes[1], 0x4b, "Invalid DOCX signature byte 2");
  assert.equal(bytes[2], 0x03, "Invalid DOCX signature byte 3");
  assert.equal(bytes[3], 0x04, "Invalid DOCX signature byte 4");
}

async function run() {
  const definition = {
    header: { content: ["docxmaker"] },
    footer: { content: [{ type: "field", field: "PAGE" }, " / ", { type: "field", field: "NUMPAGES" }] },
    content: [
      "Smoke test document",
      {
        type: "paragraph",
        content: [
          "Visit ",
          { type: "link", text: "example", url: "https://example.com" }
        ]
      }
    ]
  };

  // Node.js path: Buffer generation + file save
  const nodeBuffer = await NodeDocxGenerator.toBuffer(definition);
  assert(nodeBuffer.length > 4, "Node buffer should not be empty");
  assertDocxSignature(nodeBuffer);

  const tempPath = join(tmpdir(), `docxmaker-smoke-${Date.now()}.docx`);
  await new NodeDocxGenerator(definition).save(tempPath);
  await access(tempPath, fsConstants.F_OK);
  const nodeFileStat = await stat(tempPath);
  assert(nodeFileStat.size > 0, "Saved DOCX file should not be empty");
  await unlink(tempPath);

  // Browser path: Blob generation from browser build
  const browserBlob = await BrowserDocxGenerator.toBlob(definition);
  assert(browserBlob instanceof Blob, "Browser build should return a Blob");
  assert(browserBlob.size > 4, "Browser blob should not be empty");
  const browserBytes = new Uint8Array(await browserBlob.arrayBuffer());
  assertDocxSignature(browserBytes);

  // Ensure browser bundle does not depend on Node util.
  const browserBundle = await readFile(new URL("../dist/browser/index.browser.js", import.meta.url), "utf8");
  assert(!/from\s+["']node:util["']/.test(browserBundle), "Browser bundle should not import node:util");
  assert(!/from\s+["']util["']/.test(browserBundle), "Browser bundle should not import util");

  console.log("Smoke checks passed: Node + Browser builds are healthy.");
}

run().catch((error) => {
  console.error("Smoke checks failed.");
  console.error(error);
  process.exit(1);
});
