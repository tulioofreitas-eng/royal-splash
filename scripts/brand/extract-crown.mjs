import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";

import { createHash } from "node:crypto";
import path from "node:path";

const ROOT = process.cwd();

const CANONICAL_PATH_SHA256 =
  "752d3914b4184f167f4e589b19dc51b96a62c1230196ff69921e01a73797483a";

const signatures = [
  {
    name: "h1-black",
    file: "public/brand/identity/signatures/royal-splash-signature-h1-black.svg",
    fill: "#12171C",
    family: "h1",
  },
  {
    name: "h1-gold",
    file: "public/brand/identity/signatures/royal-splash-signature-h1-gold.svg",
    fill: "#D9B746",
    family: "h1",
  },
  {
    name: "h1-white",
    file: "public/brand/identity/signatures/royal-splash-signature-h1-white.svg",
    fill: "#FFFFFF",
    family: "h1",
  },
  {
    name: "p2-black",
    file: "public/brand/identity/signatures/royal-splash-signature-p2-black.svg",
    fill: "#12171C",
    family: "p2",
  },
  {
    name: "p2-gold",
    file: "public/brand/identity/signatures/royal-splash-signature-p2-gold.svg",
    fill: "#D9B746",
    family: "p2",
  },
  {
    name: "p2-white",
    file: "public/brand/identity/signatures/royal-splash-signature-p2-white.svg",
    fill: "#FFFFFF",
    family: "p2",
  },
];

const crownVariants = [
  {
    file: "royal-splash-crown-black.svg",
    fill: "#12171C",
  },
  {
    file: "royal-splash-crown-gold.svg",
    fill: "#D9B746",
  },
  {
    file: "royal-splash-crown-white.svg",
    fill: "#FFFFFF",
  },
];

function sha256(value) {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function attr(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}="([^"]*)"`)
  );

  if (!match) {
    throw new Error(`Missing ${name} attribute`);
  }

  return match[1];
}

function extractDirectCrown(svg, sourceName) {
  const groupIndex = svg.indexOf("<g ");
  const pathIndex = svg.indexOf("<path ");

  if (pathIndex === -1) {
    throw new Error(`${sourceName}: no crown path found`);
  }

  if (groupIndex === -1) {
    throw new Error(`${sourceName}: wordmark group not found`);
  }

  if (pathIndex > groupIndex) {
    throw new Error(
      `${sourceName}: first path is not the direct crown path`
    );
  }

  const pathEnd = svg.indexOf("/>", pathIndex);

  if (pathEnd === -1 || pathEnd > groupIndex) {
    throw new Error(
      `${sourceName}: direct crown path structure invalid`
    );
  }

  const tag = svg.slice(pathIndex, pathEnd + 2);

  return {
    d: attr(tag, "d"),
    fill: attr(tag, "fill"),
    transform: attr(tag, "transform"),
  };
}

function computeSiteOwnedViewBox(d) {
  /*
   * Canonical crown path currently uses only absolute:
   * M, C, L and z.
   *
   * No geometric transformation is performed here.
   *
   * The viewport is a SITE_SPECIFIC wrapper derived from
   * the canonical control-point coordinate envelope.
   */

  const commands = [
    ...new Set(d.match(/[A-Za-z]/g) ?? []),
  ].sort();

  const expectedCommands = ["C", "L", "M", "z"];

  if (
    JSON.stringify(commands) !==
    JSON.stringify(expectedCommands)
  ) {
    throw new Error(
      `Unexpected canonical crown path commands: ${commands.join(",")}`
    );
  }

  const numberPattern =
    /[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/g;

  const numbers = (d.match(numberPattern) ?? [])
    .map(Number);

  if (numbers.length === 0 || numbers.length % 2 !== 0) {
    throw new Error(
      "Canonical crown path coordinate stream is invalid"
    );
  }

  const xs = [];
  const ys = [];

  for (let i = 0; i < numbers.length; i += 2) {
    xs.push(numbers[i]);
    ys.push(numbers[i + 1]);
  }

  const minX = Math.floor(Math.min(...xs));
  const minY = Math.floor(Math.min(...ys));
  const maxX = Math.ceil(Math.max(...xs));
  const maxY = Math.ceil(Math.max(...ys));

  return [
    minX,
    minY,
    maxX - minX,
    maxY - minY,
  ].join(" ");
}

const extracted = [];

for (const signature of signatures) {
  const source = await readFile(
    path.join(ROOT, signature.file),
    "utf8",
  );

  const crown = extractDirectCrown(
    source,
    signature.name,
  );

  if (crown.fill !== signature.fill) {
    throw new Error(
      `${signature.name}: unexpected crown fill ${crown.fill}`
    );
  }

  extracted.push({
    ...signature,
    ...crown,
  });
}

const canonicalD = extracted[0].d;

for (const item of extracted) {
  if (item.d !== canonicalD) {
    throw new Error(
      `${item.name}: crown path geometry differs from canonical path`
    );
  }
}

const pathHash = sha256(canonicalD);

if (pathHash !== CANONICAL_PATH_SHA256) {
  throw new Error(
    `Canonical crown path SHA mismatch: ${pathHash}`
  );
}

const h1Transforms = [
  ...new Set(
    extracted
      .filter((item) => item.family === "h1")
      .map((item) => item.transform)
  ),
];

const p2Transforms = [
  ...new Set(
    extracted
      .filter((item) => item.family === "p2")
      .map((item) => item.transform)
  ),
];

if (h1Transforms.length !== 1) {
  throw new Error(
    "H1 crown composition transforms are inconsistent"
  );
}

if (p2Transforms.length !== 1) {
  throw new Error(
    "P2 crown composition transforms are inconsistent"
  );
}

const viewBox = computeSiteOwnedViewBox(canonicalD);

const outputDir = path.join(
  ROOT,
  "public/brand/identity/crown",
);

await mkdir(outputDir, {
  recursive: true,
});

for (const variant of crownVariants) {
  /*
   * IMPORTANT:
   *
   * - canonical path d is copied byte-for-byte;
   * - H1/P2 composition transforms are NOT propagated;
   * - no redraw;
   * - no simplification;
   * - no point mutation;
   * - no transform baking.
   *
   * viewBox is SITE_SPECIFIC presentation metadata.
   */

  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  <path d="${canonicalD}" fill="${variant.fill}"/>
</svg>
`;

  await writeFile(
    path.join(outputDir, variant.file),
    svg,
    "utf8",
  );
}

console.log(
  `CANONICAL_CROWN_PATH_SHA256=${pathHash}`
);
console.log(
  `SITE_OWNED_CROWN_VIEWBOX=${viewBox}`
);
console.log(
  `H1_COMPOSITION_TRANSFORM=${h1Transforms[0]}`
);
console.log(
  `P2_COMPOSITION_TRANSFORM=${p2Transforms[0]}`
);
console.log(
  "COMPOSITION_TRANSFORMS_PROPAGATED=NO"
);
console.log(
  "CROWN_PATH_MUTATION=NO"
);
console.log(
  "CROWN_EXTRACTION=PASS"
);
