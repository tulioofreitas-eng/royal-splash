import type {
  Evidence,
  SiteCase,
} from "../../domains/cases/index.ts";

export interface RoyalCasePublicationInput {
  cases: readonly SiteCase[];
  evidence: readonly Evidence[];
}

/**
 * Reference Implementation policy for Royal Splash.
 *
 * This is intentionally stricter than the generic Case domain.
 * The generic domain keeps verification and publication as
 * independent dimensions.
 *
 * Royal currently exposes a Case only when:
 * - publication is explicitly "published";
 * - Case verification is complete;
 * - at least one Evidence item supports the Case;
 * - every referenced Evidence item exists and is verified.
 */
export function selectRoyalPublicCases(
  input: RoyalCasePublicationInput,
): readonly SiteCase[] {
  const evidenceById = new Map(
    input.evidence.map(
      (item) => [
        item.id,
        item,
      ] as const,
    ),
  );

  return input.cases.filter(
    (siteCase) => {
      if (
        siteCase.publicationState !== "published" ||
        siteCase.verificationState !== "verified" ||
        siteCase.evidenceRefs.length === 0
      ) {
        return false;
      }

      return siteCase.evidenceRefs.every(
        (evidenceRef) => {
          const evidence =
            evidenceById.get(
              evidenceRef,
            );

          return (
            evidence !== undefined &&
            evidence.verificationState ===
              "verified"
          );
        },
      );
    },
  );
}
