import type {
  Evidence,
  ProvenanceRef,
  SiteCase,
} from "../../domains/cases/index.ts";
import {
  validateCaseContent,
} from "../../validation/cases.ts";
import {
  selectRoyalPublicCases,
} from "./publication.ts";

export const ROYAL_CASE_NARRATIVE_KINDS = [
  "context",
  "challenge",
  "reasoning",
  "royal_scope",
  "solution",
  "execution",
  "detail",
  "outcome",
] as const;

export type RoyalCaseNarrativeKind =
  (typeof ROYAL_CASE_NARRATIVE_KINDS)[number];

export interface RoyalCaseNarrativeBlock {
  id: string;
  kind: RoyalCaseNarrativeKind;
  body: string;
  evidenceRefs: readonly string[];
  provenance: readonly ProvenanceRef[];
}

export interface RoyalCaseDetailRecord {
  schemaVersion: "royal-case-detail.v1";
  caseRef: string;
  blocks: readonly RoyalCaseNarrativeBlock[];
  testimonialEvidenceRefs: readonly string[];
  metricEvidenceRefs: readonly string[];
}

export interface RoyalCaseDetailSelectionInput {
  cases: readonly SiteCase[];
  evidence: readonly Evidence[];
  details: readonly RoyalCaseDetailRecord[];
}

export interface RoyalPublicCaseDetail {
  siteCase: SiteCase;
  detail: RoyalCaseDetailRecord;
  evidence: readonly Evidence[];
}

function isNonEmptyString(
  value: unknown,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function hasValidProvenance(
  provenance: readonly ProvenanceRef[],
): boolean {
  return (
    provenance.length > 0 &&
    provenance.every(
      (ref) =>
        isNonEmptyString(ref.id) &&
        isNonEmptyString(ref.sourceRef),
    )
  );
}

function detailsByCaseRef(
  details: readonly RoyalCaseDetailRecord[],
): ReadonlyMap<
  string,
  readonly RoyalCaseDetailRecord[]
> {
  const grouped =
    new Map<
      string,
      RoyalCaseDetailRecord[]
    >();

  details.forEach((detail) => {
    if (!isNonEmptyString(detail.caseRef)) {
      return;
    }

    const existing =
      grouped.get(detail.caseRef) ?? [];

    existing.push(detail);
    grouped.set(
      detail.caseRef,
      existing,
    );
  });

  return grouped;
}

export function selectRoyalPublicCaseDetails(
  input: RoyalCaseDetailSelectionInput,
): readonly RoyalPublicCaseDetail[] {
  const baseValidation =
    validateCaseContent({
      cases: input.cases,
      evidence: input.evidence,
    });

  if (!baseValidation.valid) {
    return [];
  }

  const publicCases =
    selectRoyalPublicCases({
      cases: input.cases,
      evidence: input.evidence,
    });

  const evidenceById =
    new Map(
      input.evidence.map(
        (item) => [
          item.id,
          item,
        ] as const,
      ),
    );

  const groupedDetails =
    detailsByCaseRef(
      input.details,
    );

  const kindRank =
    new Map(
      ROYAL_CASE_NARRATIVE_KINDS.map(
        (kind, index) => [
          kind,
          index,
        ] as const,
      ),
    );

  const selected:
    RoyalPublicCaseDetail[] = [];

  publicCases.forEach((siteCase) => {
    const matchingDetails =
      groupedDetails.get(
        siteCase.id,
      ) ?? [];

    if (matchingDetails.length !== 1) {
      return;
    }

    const detail =
      matchingDetails[0];

    if (
      detail.schemaVersion !==
        "royal-case-detail.v1" ||
      detail.blocks.length === 0
    ) {
      return;
    }

    const caseEvidenceRefs =
      new Set(
        siteCase.evidenceRefs,
      );

    const seenBlockIds =
      new Set<string>();

    const seenKinds =
      new Set<RoyalCaseNarrativeKind>();

    let previousKindRank = -1;

    const blocksAreValid =
      detail.blocks.every(
        (block) => {
          const currentKindRank =
            kindRank.get(
              block.kind,
            );

          if (
            !isNonEmptyString(block.id) ||
            !isNonEmptyString(block.body) ||
            currentKindRank === undefined ||
            seenBlockIds.has(block.id) ||
            seenKinds.has(block.kind) ||
            currentKindRank <=
              previousKindRank ||
            !hasValidProvenance(
              block.provenance,
            )
          ) {
            return false;
          }

          const evidenceIsValid =
            block.evidenceRefs.every(
              (evidenceRef) => {
                const item =
                  evidenceById.get(
                    evidenceRef,
                  );

                return (
                  caseEvidenceRefs.has(
                    evidenceRef,
                  ) &&
                  item !== undefined &&
                  item.verificationState ===
                    "verified"
                );
              },
            );

          if (!evidenceIsValid) {
            return false;
          }

          seenBlockIds.add(
            block.id,
          );
          seenKinds.add(
            block.kind,
          );
          previousKindRank =
            currentKindRank;

          return true;
        },
      );

    if (!blocksAreValid) {
      return;
    }

    const testimonialRefsAreValid =
      detail.testimonialEvidenceRefs.every(
        (evidenceRef) => {
          const item =
            evidenceById.get(
              evidenceRef,
            );

          return (
            caseEvidenceRefs.has(
              evidenceRef,
            ) &&
            item !== undefined &&
            item.kind ===
              "testimonial" &&
            item.verificationState ===
              "verified"
          );
        },
      );

    if (!testimonialRefsAreValid) {
      return;
    }

    const metricRefsAreValid =
      detail.metricEvidenceRefs.every(
        (evidenceRef) => {
          const item =
            evidenceById.get(
              evidenceRef,
            );

          return (
            caseEvidenceRefs.has(
              evidenceRef,
            ) &&
            item !== undefined &&
            item.kind ===
              "metric" &&
            item.verificationState ===
              "verified"
          );
        },
      );

    if (!metricRefsAreValid) {
      return;
    }

    const caseEvidence =
      siteCase.evidenceRefs
        .map(
          (evidenceRef) =>
            evidenceById.get(
              evidenceRef,
            ),
        )
        .filter(
          (
            item,
          ): item is Evidence =>
            item !== undefined,
        );

    selected.push({
      siteCase,
      detail,
      evidence: caseEvidence,
    });
  });

  return selected;
}
