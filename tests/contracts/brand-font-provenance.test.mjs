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

const expectedFonts = [
  {
    family: "Hanken Grotesk",
    cssWeight: 400,
    path: "/brand/fonts/hanken-grotesk/HankenGrotesk-Regular.woff2",
    sha256: "26b5916fb21d03a94f2e4295e7f559451ec36368bdf8798726a5cad5e15694b6",
    bytes: 31972,
    blob: "123bc3f96f9cbac8eb743d24bc93f2294c01ccef",
    commit: "665f7bdc9f95123f4677bb306018e39d25e3f4b6",
    versionRaw: 197526,
  },
  {
    family: "Hanken Grotesk",
    cssWeight: 500,
    path: "/brand/fonts/hanken-grotesk/HankenGrotesk-Medium.woff2",
    sha256: "56c8ee628a1d6e0f6ebf31191fe53e9de59d1428b14a33fcd86eb2f69f110f82",
    bytes: 32604,
    blob: "0c745f96003adf2853b1c5681c22c043430e0aa5",
    commit: "665f7bdc9f95123f4677bb306018e39d25e3f4b6",
    versionRaw: 197526,
  },
  {
    family: "Hanken Grotesk",
    cssWeight: 600,
    path: "/brand/fonts/hanken-grotesk/HankenGrotesk-SemiBold.woff2",
    sha256: "d8c64a14618c9d0f14f9099e7346e53110a57522569709cd2f663844f23e2574",
    bytes: 32536,
    blob: "3b700cb8699a0f55a1562e50b190c91d1ff07b69",
    commit: "665f7bdc9f95123f4677bb306018e39d25e3f4b6",
    versionRaw: 197526,
  },
  {
    family: "Hanken Grotesk",
    cssWeight: 700,
    path: "/brand/fonts/hanken-grotesk/HankenGrotesk-Bold.woff2",
    sha256: "c81f2a4d9e02c032d87ebabe4e61b4945b3eb7c939fe1e77205159bfaab9f58d",
    bytes: 33136,
    blob: "97b62044c2dd0f4d2c0a060c7673c209360d50c7",
    commit: "665f7bdc9f95123f4677bb306018e39d25e3f4b6",
    versionRaw: 197526,
  },
  {
    family: "Cormorant Garamond",
    cssWeight: 500,
    path: "/brand/fonts/cormorant-garamond/CormorantGaramond-Medium.woff2",
    sha256: "b1886b29c2277554e0f2136258a3eea784fb8b4c65c5ab6ce02d19d5c3340356",
    bytes: 206516,
    blob: "e5f5ba69a9c3223d65b7ae37f7a3b9f20c542121",
    commit: "9719e26aa8e26d7a30e736667427b9e05b5db059",
    versionRaw: 262275,
  },
];

const expectedLicenses = [
  {
    family: "Hanken Grotesk",
    path: "/brand/fonts/hanken-grotesk/OFL.txt",
    sha256: "e02ccb89a86839b22feff7872ff5cc355cc0f58318d29eee20e2cf83a612f16d",
    bytes: 4402,
    blob: "9c8185d846e13882e03bdd700743e717e67189dc",
  },
  {
    family: "Cormorant Garamond",
    path: "/brand/fonts/cormorant-garamond/OFL.txt",
    sha256: "60700d351cac4650c51f3f9db318d2a420f8b45052dba2715eb5fec41f0f6956",
    bytes: 4387,
    blob: "507d70f4565352dbfcf2dfc9b42eb092b57c0be8",
  },
];

function sha256(bytes) {
  return createHash("sha256")
    .update(bytes)
    .digest("hex");
}

function gitBlobSha1(bytes) {
  const header = Buffer.from(
    `blob ${bytes.length}\0`,
    "utf8"
  );

  return createHash("sha1")
    .update(header)
    .update(bytes)
    .digest("hex");
}

function fsPath(publicPath) {
  return path.join(
    ROOT,
    "public",
    publicPath.replace(/^\/+/, "")
  );
}

test(
  "font provenance manifest is controlled and self-hosted",
  async () => {
    const manifest = JSON.parse(
      await readFile(
        path.join(
          ROOT,
          "src/brand/brand-provenance.json"
        ),
        "utf8"
      )
    );

    assert.equal(manifest.schemaVersion, 1);
    assert.equal(
      manifest.identityFoundationCheckpoint,
      "1d7ef09228c1123c0dcdf6570ab72e705d41fc38"
    );

    assert.equal(
      manifest.fontPolicy.delivery,
      "SELF_HOSTED_WOFF2"
    );

    assert.equal(
      manifest.fontPolicy.externalRuntimeFetch,
      false
    );

    assert.equal(
      manifest.fontPolicy.license,
      "SIL_OFL_1_1"
    );

    assert.equal(manifest.fonts.length, 5);
    assert.equal(manifest.licenses.length, 2);

    for (const expected of expectedFonts) {
      const entry = manifest.fonts.find(
        (font) =>
          font.publicPath === expected.path
      );

      assert.ok(entry, expected.path);

      assert.equal(
        entry.family,
        expected.family
      );

      assert.equal(
        entry.cssWeight,
        expected.cssWeight
      );

      assert.equal(
        entry.style,
        "normal"
      );

      assert.equal(
        entry.sha256,
        expected.sha256
      );

      assert.equal(
        entry.bytes,
        expected.bytes
      );

      assert.equal(
        entry.upstreamGitBlobSha1,
        expected.blob
      );

      assert.equal(
        entry.upstreamCommit,
        expected.commit
      );

      assert.equal(
        entry.internalFontVersionRaw,
        expected.versionRaw
      );
    }
  }
);

test(
  "all self-hosted font binaries remain byte-pinned",
  async () => {
    for (const expected of expectedFonts) {
      const bytes = await readFile(
        fsPath(expected.path)
      );

      assert.equal(
        bytes.length,
        expected.bytes,
        expected.path
      );

      assert.equal(
        sha256(bytes),
        expected.sha256,
        expected.path
      );

      assert.equal(
        gitBlobSha1(bytes),
        expected.blob,
        expected.path
      );

      assert.equal(
        bytes.subarray(0, 4).toString("ascii"),
        "wOF2",
        expected.path
      );
    }
  }
);

test(
  "OFL files remain upstream-pinned and distributable",
  async () => {
    const manifest = JSON.parse(
      await readFile(
        path.join(
          ROOT,
          "src/brand/brand-provenance.json"
        ),
        "utf8"
      )
    );

    for (const expected of expectedLicenses) {
      const bytes = await readFile(
        fsPath(expected.path)
      );

      assert.equal(
        bytes.length,
        expected.bytes,
        expected.path
      );

      assert.equal(
        sha256(bytes),
        expected.sha256,
        expected.path
      );

      assert.equal(
        gitBlobSha1(bytes),
        expected.blob,
        expected.path
      );

      assert.match(
        bytes.toString("utf8"),
        /SIL OPEN FONT LICENSE Version 1\.1/
      );

      const entry = manifest.licenses.find(
        (license) =>
          license.publicPath === expected.path
      );

      assert.ok(entry, expected.path);

      assert.equal(
        entry.sha256,
        expected.sha256
      );
    }
  }
);

test(
  "public Brand font inventory is exactly the approved five WOFF2 plus two OFL files",
  async () => {
    const root = path.join(
      ROOT,
      "public/brand/fonts"
    );

    const files = [];

    async function walk(dir) {
      for (const entry of await readdir(
        dir,
        { withFileTypes: true }
      )) {
        const absolute = path.join(
          dir,
          entry.name
        );

        if (entry.isDirectory()) {
          await walk(absolute);
        } else {
          files.push(
            path.relative(root, absolute)
              .replaceAll("\\", "/")
          );
        }
      }
    }

    await walk(root);

    assert.deepEqual(
      files.sort(),
      [
        "cormorant-garamond/CormorantGaramond-Medium.woff2",
        "cormorant-garamond/OFL.txt",
        "hanken-grotesk/HankenGrotesk-Bold.woff2",
        "hanken-grotesk/HankenGrotesk-Medium.woff2",
        "hanken-grotesk/HankenGrotesk-Regular.woff2",
        "hanken-grotesk/HankenGrotesk-SemiBold.woff2",
        "hanken-grotesk/OFL.txt",
      ].sort()
    );
  }
);

test(
  "new Brand font foundation contains no Poppins or runtime Google Fonts dependency",
  async () => {
    const provenance = await readFile(
      path.join(
        ROOT,
        "src/brand/brand-provenance.json"
      ),
      "utf8"
    );

    assert.doesNotMatch(
      provenance,
      /Poppins/i
    );

    assert.doesNotMatch(
      provenance,
      /fonts\.googleapis\.com/i
    );

    assert.doesNotMatch(
      provenance,
      /fonts\.gstatic\.com/i
    );
  }
);
