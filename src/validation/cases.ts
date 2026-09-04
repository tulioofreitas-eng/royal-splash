import type {
  Evidence,
  ProvenanceRef,
  SiteCase,
} from "../domains/cases/index.ts";

export type CaseContentValidationIssueCode =
  | "required_identifier"
  | "invalid_slug"
  | "duplicate_identifier"
  | "invalid_cross_reference"
  | "missing_provenance"
  | "publication_conflict"
  | "verification_conflict";

export interface CaseContentValidationIssue {
  code: CaseContentValidationIssueCode;
  path: string;
  message: string;
}

export interface ValidateCaseContentInput {
  cases: readonly SiteCase[];
  evidence: readonly Evidence[];
  knownServiceRefs?: readonly string[];
}

export interface CaseContentValidationResult {
  valid: boolean;
  issues: readonly CaseContentValidationIssue[];
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function addIssue(
  issues: CaseContentValidationIssue[],
  code: CaseContentValidationIssueCode,
  path: string,
  message: string,
): void {
  issues.push({
    code,
    path,
    message,
  });
}

function validateRequiredIdentifier(
  issues: CaseContentValidationIssue[],
  value: unknown,
  path: string,
): void {
  if (!isNonEmptyString(value)) {
    addIssue(
      issues,
      "required_identifier",
      path,
      `${path} must be a non-empty string`,
    );
  }
}

function validateProvenance(
  issues: CaseContentValidationIssue[],
  provenance: readonly ProvenanceRef[],
  path: string,
): void {
  if (provenance.length === 0) {
    addIssue(
      issues,
      "missing_provenance",
      path,
      `${path} must contain at least one provenance reference`,
    );
    return;
  }

  const seenIds = new Set<string>();

  provenance.forEach((ref, index) => {
    const refPath = `${path}[${index}]`;

    validateRequiredIdentifier(
      issues,
      ref.id,
      `${refPath}.id`,
    );

    validateRequiredIdentifier(
      issues,
      ref.sourceRef,
      `${refPath}.sourceRef`,
    );

    if (isNonEmptyString(ref.id)) {
      if (seenIds.has(ref.id)) {
        addIssue(
          issues,
          "duplicate_identifier",
          `${refPath}.id`,
          `duplicate provenance id "${ref.id}"`,
        );
      } else {
        seenIds.add(ref.id);
      }
    }
  });
}

function validateDuplicateCaseIdentifiers(
  cases: readonly SiteCase[],
  issues: CaseContentValidationIssue[],
): void {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  cases.forEach((siteCase, index) => {
    if (isNonEmptyString(siteCase.id)) {
      if (seenIds.has(siteCase.id)) {
        addIssue(
          issues,
          "duplicate_identifier",
          `cases[${index}].id`,
          `duplicate case id "${siteCase.id}"`,
        );
      } else {
        seenIds.add(siteCase.id);
      }
    }

    if (isNonEmptyString(siteCase.slug)) {
      if (seenSlugs.has(siteCase.slug)) {
        addIssue(
          issues,
          "duplicate_identifier",
          `cases[${index}].slug`,
          `duplicate case slug "${siteCase.slug}"`,
        );
      } else {
        seenSlugs.add(siteCase.slug);
      }
    }
  });
}

function validateDuplicateEvidenceIdentifiers(
  evidence: readonly Evidence[],
  issues: CaseContentValidationIssue[],
): void {
  const seenIds = new Set<string>();

  evidence.forEach((item, index) => {
    if (!isNonEmptyString(item.id)) {
      return;
    }

    if (seenIds.has(item.id)) {
      addIssue(
        issues,
        "duplicate_identifier",
        `evidence[${index}].id`,
        `duplicate evidence id "${item.id}"`,
      );
    } else {
      seenIds.add(item.id);
    }
  });
}

function validateCaseConflicts(
  cases: readonly SiteCase[],
  issues: CaseContentValidationIssue[],
): void {
  const publicationById = new Map<string, SiteCase["publicationState"]>();
  const verificationById = new Map<string, SiteCase["verificationState"]>();

  cases.forEach((siteCase, index) => {
    if (!isNonEmptyString(siteCase.id)) {
      return;
    }

    const knownPublication = publicationById.get(siteCase.id);

    if (
      knownPublication !== undefined &&
      knownPublication !== siteCase.publicationState
    ) {
      addIssue(
        issues,
        "publication_conflict",
        `cases[${index}].publicationState`,
        `case "${siteCase.id}" has conflicting publication states`,
      );
    } else if (knownPublication === undefined) {
      publicationById.set(
        siteCase.id,
        siteCase.publicationState,
      );
    }

    const knownVerification = verificationById.get(siteCase.id);

    if (
      knownVerification !== undefined &&
      knownVerification !== siteCase.verificationState
    ) {
      addIssue(
        issues,
        "verification_conflict",
        `cases[${index}].verificationState`,
        `case "${siteCase.id}" has conflicting verification states`,
      );
    } else if (knownVerification === undefined) {
      verificationById.set(
        siteCase.id,
        siteCase.verificationState,
      );
    }
  });
}

function validateEvidenceConflicts(
  evidence: readonly Evidence[],
  issues: CaseContentValidationIssue[],
): void {
  const verificationById = new Map<
    string,
    Evidence["verificationState"]
  >();

  evidence.forEach((item, index) => {
    if (!isNonEmptyString(item.id)) {
      return;
    }

    const knownVerification = verificationById.get(item.id);

    if (
      knownVerification !== undefined &&
      knownVerification !== item.verificationState
    ) {
      addIssue(
        issues,
        "verification_conflict",
        `evidence[${index}].verificationState`,
        `evidence "${item.id}" has conflicting verification states`,
      );
    } else if (knownVerification === undefined) {
      verificationById.set(
        item.id,
        item.verificationState,
      );
    }
  });
}

export function validateCaseContent(
  input: ValidateCaseContentInput,
): CaseContentValidationResult {
  const issues: CaseContentValidationIssue[] = [];

  const knownEvidenceIds = new Set(
    input.evidence
      .map((item) => item.id)
      .filter(isNonEmptyString),
  );

  const knownServiceRefs =
    input.knownServiceRefs === undefined
      ? undefined
      : new Set(input.knownServiceRefs);

  validateDuplicateCaseIdentifiers(
    input.cases,
    issues,
  );

  validateDuplicateEvidenceIdentifiers(
    input.evidence,
    issues,
  );

  validateCaseConflicts(
    input.cases,
    issues,
  );

  validateEvidenceConflicts(
    input.evidence,
    issues,
  );

  input.evidence.forEach((item, evidenceIndex) => {
    validateRequiredIdentifier(
      issues,
      item.id,
      `evidence[${evidenceIndex}].id`,
    );

    validateProvenance(
      issues,
      item.provenance,
      `evidence[${evidenceIndex}].provenance`,
    );
  });

  input.cases.forEach((siteCase, caseIndex) => {
    validateRequiredIdentifier(
      issues,
      siteCase.id,
      `cases[${caseIndex}].id`,
    );

    validateRequiredIdentifier(
      issues,
      siteCase.slug,
      `cases[${caseIndex}].slug`,
    );

    if (
      isNonEmptyString(siteCase.slug) &&
      !SLUG_PATTERN.test(siteCase.slug)
    ) {
      addIssue(
        issues,
        "invalid_slug",
        `cases[${caseIndex}].slug`,
        `case slug "${siteCase.slug}" must use lowercase kebab-case`,
      );
    }

    validateProvenance(
      issues,
      siteCase.provenance,
      `cases[${caseIndex}].provenance`,
    );

    siteCase.evidenceRefs.forEach(
      (evidenceRef, evidenceRefIndex) => {
        validateRequiredIdentifier(
          issues,
          evidenceRef,
          `cases[${caseIndex}].evidenceRefs[${evidenceRefIndex}]`,
        );

        if (
          isNonEmptyString(evidenceRef) &&
          !knownEvidenceIds.has(evidenceRef)
        ) {
          addIssue(
            issues,
            "invalid_cross_reference",
            `cases[${caseIndex}].evidenceRefs[${evidenceRefIndex}]`,
            `unknown evidence reference "${evidenceRef}"`,
          );
        }
      },
    );

    siteCase.serviceRefs.forEach(
      (serviceRef, serviceRefIndex) => {
        validateRequiredIdentifier(
          issues,
          serviceRef,
          `cases[${caseIndex}].serviceRefs[${serviceRefIndex}]`,
        );

        if (
          knownServiceRefs !== undefined &&
          isNonEmptyString(serviceRef) &&
          !knownServiceRefs.has(serviceRef)
        ) {
          addIssue(
            issues,
            "invalid_cross_reference",
            `cases[${caseIndex}].serviceRefs[${serviceRefIndex}]`,
            `unknown service reference "${serviceRef}"`,
          );
        }
      },
    );

    const seenMediaIds = new Set<string>();

    siteCase.media.forEach((media, mediaIndex) => {
      validateRequiredIdentifier(
        issues,
        media.id,
        `cases[${caseIndex}].media[${mediaIndex}].id`,
      );

      if (isNonEmptyString(media.id)) {
        if (seenMediaIds.has(media.id)) {
          addIssue(
            issues,
            "duplicate_identifier",
            `cases[${caseIndex}].media[${mediaIndex}].id`,
            `duplicate media id "${media.id}"`,
          );
        } else {
          seenMediaIds.add(media.id);
        }
      }

      if (
        media.evidenceRef !== undefined &&
        isNonEmptyString(media.evidenceRef) &&
        !knownEvidenceIds.has(media.evidenceRef)
      ) {
        addIssue(
          issues,
          "invalid_cross_reference",
          `cases[${caseIndex}].media[${mediaIndex}].evidenceRef`,
          `unknown evidence reference "${media.evidenceRef}"`,
        );
      }
    });
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}
