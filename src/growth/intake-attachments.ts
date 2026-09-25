import { validateRoyalAttachmentSet } from "../domain/attachments/policy.ts";

export interface IntakeAttachmentController {
  hasFiles(): boolean;
  validate(): boolean;
  reset(): void;
  upload(caseId: string, submissionRef: string): Promise<boolean>;
}

function selectedFiles(input: HTMLInputElement): File[] {
  return input.files ? Array.from(input.files) : [];
}

function formatBytes(value: number): string {
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(0)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

async function postJson(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error("attachment_step_failed");
  return payload;
}

export function setupIntakeAttachmentField(
  form: HTMLFormElement,
): IntakeAttachmentController {
  const input = form.querySelector<HTMLInputElement>("[data-attachment-input]");
  const list = form.querySelector<HTMLElement>("[data-attachment-list]");
  const error = form.querySelector<HTMLElement>("[data-attachment-error]");

  const showError = (message = "") => {
    if (error) error.textContent = message;
    if (input) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  };

  const renderSelection = () => {
    if (!input || !list) return;
    const files = selectedFiles(input);

    if (files.length === 0) {
      list.textContent = "";
      showError("");
      return;
    }

    const validation = validateRoyalAttachmentSet(files);
    if (!validation.valid) {
      showError(validation.error ?? "Revise os arquivos selecionados.");
      list.textContent = "";
      input.value = "";
      return;
    }

    showError("");
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    list.textContent =
      `${files.length} ${files.length === 1 ? "arquivo selecionado" : "arquivos selecionados"} · ${formatBytes(totalBytes)}`;
  };

  input?.addEventListener("change", renderSelection);

  return {
    hasFiles() {
      return Boolean(input && selectedFiles(input).length > 0);
    },

    validate() {
      if (!input) return true;
      const validation = validateRoyalAttachmentSet(selectedFiles(input));
      showError(validation.valid ? "" : validation.error ?? "Revise os arquivos selecionados.");
      return validation.valid;
    },

    reset() {
      if (input) input.value = "";
      if (list) list.textContent = "";
      showError("");
    },

    async upload(caseId: string, submissionRef: string) {
      if (!input) return true;
      const files = selectedFiles(input);
      if (files.length === 0) return true;

      try {
        const session = await postJson("/api/site-lead/attachments/session", {
          intakeId: caseId,
          idempotencyKey: `attachments-session:${submissionRef}`,
        });
        const sessionId = session.sessionId as string;
        const fileIds: string[] = [];

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          const authorization = await postJson("/api/site-lead/attachments/authorize", {
            sessionId,
            fileName: file.name,
            size: file.size,
            mime: file.type || null,
            idempotencyKey: `attachments-file:${submissionRef}:${index}`,
          });

          const fileId = authorization.fileId as string;
          const state = authorization.state as string | undefined;

          if (state !== "already_confirmed" && state !== "already_bound") {
            if (state !== "upload_already_exists") {
              if (!authorization.token) throw new Error("attachment_token_missing");

              const uploadResponse = await fetch("/api/site-lead/attachments/upload", {
                method: "POST",
                headers: {
                  "x-atlas-upload-session-id": sessionId,
                  "x-atlas-upload-file-id": fileId,
                  "x-atlas-upload-token": authorization.token,
                  "x-atlas-upload-bucket": authorization.bucket ?? "",
                  "x-atlas-upload-path": authorization.path ?? "",
                  "content-type": file.type || "application/octet-stream",
                },
                body: file,
              });

              if (!uploadResponse.ok) throw new Error("attachment_upload_failed");
            }

            await postJson("/api/site-lead/attachments/confirm", {
              sessionId,
              fileId,
              idempotencyKey: `attachments-confirm:${submissionRef}:${index}`,
            });
          }

          fileIds.push(fileId);
        }

        await postJson("/api/site-lead/attachments/finalize", {
          sessionId,
          idempotencyKey: `attachments-finalize:${submissionRef}`,
        });

        await postJson("/api/site-lead/attachments/associate", {
          sessionId,
          intakeId: caseId,
          idempotencyKey: `attachments-associate:${submissionRef}`,
        });

        if (fileIds.length > 0) {
          await postJson("/api/site-lead/attachments/bind", {
            sessionId,
            intakeId: caseId,
            fileIds,
            idempotencyKey: `attachments-bind:${submissionRef}`,
          });
        }

        return true;
      } catch {
        console.error("royal_attachment_upload_failed");
        return false;
      }
    },
  };
}
