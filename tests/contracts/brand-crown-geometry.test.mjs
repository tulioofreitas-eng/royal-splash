import test from "node:test";
import assert from "node:assert/strict";

import {
  readFile,
  readdir,
} from "node:fs/promises";

import {
  createHash,
} from "node:crypto";

import path from "node:path";

const ROOT = process.cwd();

const CANONICAL_CROWN_PATH_SHA256 =
  "752d3914b4184f167f4e589b19dc51b96a62c1230196ff69921e01a73797483a";

const EXPECTED_CROWN_VIEWBOX =
  "1 154 1025 676";

const signatureAssets = [
  [
    "royal-splash-signature-h1-black.svg",
    "579f5f42a408c7143171cec72274d38829a009157500fc4e393ca5f809e19100",
  ],
  [
    "royal-splash-signature-h1-gold.svg",
    "77e9bfcfa0141dd85624371f417f469152652a861846651438442f965060c55a",
  ],
  [
    "royal-splash-signature-h1-white.svg",
    "a7196efac022e0795b4eb4ad99826c645a2484de950e932fe5f34f4da1591116",
  ],
  [
    "royal-splash-signature-p2-black.svg",
    "dfd8c01f8916f1eb4726f0833f7a4a725ea51e216dfa71a8681e0b32689484f6",
  ],
  [
    "royal-splash-signature-p2-gold.svg",
    "69f4e571be04c27392ca703e48298e68b7fa6d5986970add8fd06cf30ebaf92b",
  ],
  [
    "royal-splash-signature-p2-white.svg",
    "78903e5e4b32c50806e7db808211607b491d14663aefcd34005f6241c5f9559a",
  ],
];

const sourceWordmarks = [
  [
    "royal-splash-wordmark-b-black.svg",
    "2de2c54728366d857c2ae01c4b99e14d40a15f9680d24e01b1edbf18597e2f9c",
  ],
  [
    "royal-splash-wordmark-b-gold.svg",
    "78eafd6bdf0ea3ff3e9cea8aad772bd99877404d45543e19c01159401fb48fbf",
  ],
  [
    "royal-splash-wordmark-b-master.svg",
    "2de2c54728366d857c2ae01c4b99e14d40a15f9680d24e01b1edbf18597e2f9c",
  ],
  [
    "royal-splash-wordmark-b-white.svg",
    "276da653ffa54369577b42f5cf5773c9734bac6a25b7fcf8a4cb0c31f67537c2",
  ],
];

const crownAssets = [
  [
    "royal-splash-crown-black.svg",
    "#12171C",
  ],
  [
    "royal-splash-crown-gold.svg",
    "#D9B746",
  ],
  [
    "royal-splash-crown-white.svg",
    "#FFFFFF",
  ],
];

function sha256(value) {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function firstPathTag(svg) {
  const start = svg.indexOf("<path ");

  assert.notEqual(
    start,
    -1,
    "SVG must contain a path"
  );

  const end = svg.indexOf("/>", start);

  assert.notEqual(
    end,
    -1,
    "SVG path must be self-closing"
  );

  return svg.slice(start, end + 2);
}

function attr(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}="([^"]*)"`)
  );

  assert.ok(
    match,
    `Expected ${name} attribute`
  );

  return match[1];
}

test(
  "approved H1/P2 signature files remain byte-pinned",
  async () => {
    const dir = path.join(
      ROOT,
      "public/brand/identity/signatures"
    );

    for (const [file, expectedHash] of signatureAssets) {
      const bytes = await readFile(
        path.join(dir, file)
      );

      assert.equal(
        sha256(bytes),
        expectedHash,
        file
      );
    }
  }
);

test(
  "Wordmark B remains source-only and byte-pinned",
  async () => {
    const sourceDir = path.join(
      ROOT,
      "src/brand/source-only/wordmark-b"
    );

    for (const [file, expectedHash] of sourceWordmarks) {
      const bytes = await readFile(
        path.join(sourceDir, file)
      );

      assert.equal(
        sha256(bytes),
        expectedHash,
        file
      );
    }

    const publicIdentity = path.join(
      ROOT,
      "public/brand/identity"
    );

    const publicEntries = [];

    async function walk(dir) {
      for (const entry of await readdir(dir, {
        withFileTypes: true,
      })) {
        const absolute = path.join(
          dir,
          entry.name
        );

        if (entry.isDirectory()) {
          await walk(absolute);
        } else {
          publicEntries.push(absolute);
        }
      }
    }

    await walk(publicIdentity);

    assert.equal(
      publicEntries.some(
        (file) =>
          file.toLowerCase().includes("wordmark-b")
      ),
      false
    );
  }
);

test(
  "all approved signatures expose the exact same canonical crown path",
  async () => {
    const dir = path.join(
      ROOT,
      "public/brand/identity/signatures"
    );

    let canonicalD = null;

    for (const [file] of signatureAssets) {
      const svg = await readFile(
        path.join(dir, file),
        "utf8"
      );

      const groupIndex = svg.indexOf("<g ");
      const pathIndex = svg.indexOf("<path ");

      assert.ok(
        pathIndex >= 0 &&
        groupIndex >= 0 &&
        pathIndex < groupIndex,
        `${file}: crown must be direct path before wordmark group`
      );

      const d = attr(
        firstPathTag(svg),
        "d"
      );

      canonicalD ??= d;

      assert.equal(
        d,
        canonicalD,
        `${file}: canonical crown geometry changed`
      );
    }

    assert.equal(
      sha256(Buffer.from(canonicalD, "utf8")),
      CANONICAL_CROWN_PATH_SHA256
    );
  }
);

test(
  "standalone crown variants preserve exact canonical geometry",
  async () => {
    const signatureSvg = await readFile(
      path.join(
        ROOT,
        "public/brand/identity/signatures/royal-splash-signature-h1-black.svg"
      ),
      "utf8"
    );

    const canonicalD = attr(
      firstPathTag(signatureSvg),
      "d"
    );

    const crownDir = path.join(
      ROOT,
      "public/brand/identity/crown"
    );

    const files = (
      await readdir(crownDir)
    ).sort();

    assert.deepEqual(
      files,
      crownAssets
        .map(([file]) => file)
        .sort()
    );

    for (const [file, expectedFill] of crownAssets) {
      const svg = await readFile(
        path.join(crownDir, file),
        "utf8"
      );

      assert.match(
        svg,
        new RegExp(
          `viewBox="${EXPECTED_CROWN_VIEWBOX}"`
        )
      );

      assert.doesNotMatch(
        svg,
        /\btransform=/
      );

      assert.doesNotMatch(
        svg,
        /<text\b|<script\b|href=|xlink:href=|<foreignObject\b|<image\b|url\(/
      );

      const tag = firstPathTag(svg);

      const d = attr(tag, "d");
      const fill = attr(tag, "fill");

      assert.equal(
        d,
        canonicalD,
        `${file}: path d mutated`
      );

      assert.equal(
        sha256(Buffer.from(d, "utf8")),
        CANONICAL_CROWN_PATH_SHA256
      );

      assert.equal(
        fill,
        expectedFill
      );

      assert.equal(
        (svg.match(/<path\b/g) ?? []).length,
        1,
        `${file}: standalone crown must have exactly one path`
      );
    }
  }
);
