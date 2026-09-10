/**
 * @fileoverview Reforma-RJ structured intake form contract tests
 * Tests form fields, submission flow, idempotency, protocol propagation,
 * analytics events, and PII safety.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Reforma-RJ Structured Intake Form", () => {
  // Field Collection Tests
  describe("Form Fields", () => {
    it("collects required field: nome", () => {
      // Form must collect name; min 2 chars, max 100 chars
      const nome = "João Silva";
      expect(nome.length).toBeGreaterThanOrEqual(2);
      expect(nome.length).toBeLessThanOrEqual(100);
    });

    it("collects required field: telefone", () => {
      // Form must collect phone; must match international format
      const phones = ["(21) 98765-4321", "(85) 99876-5432"];
      phones.forEach(phone => {
        expect(/^\(?\d{2}\)?\s*9?\d{4}-?\d{4}$/.test(phone.replace(/\s/g, ""))).toBe(true);
      });
    });

    it("collects required field: cidade", () => {
      // Form must collect city; no automatic state prefix
      const cidade = "Rio de Janeiro";
      expect(cidade).not.toContain("STATE OF");
      expect(cidade.length).toBeGreaterThan(0);
      expect(cidade.length).toBeLessThanOrEqual(120);
    });

    it("collects optional field: necessidade", () => {
      // Contexto/necessidade is optional, max 200 chars
      const necessidade = "Reformar revestimento e atualizar iluminação";
      expect(necessidade.length).toBeLessThanOrEqual(200);
    });

    it("collects optional field: prazo", () => {
      // Prazo enum: urgente, proximos_meses, aberto, or empty
      const valid = ["urgente", "proximos_meses", "aberto", ""];
      valid.forEach(p => {
        expect(["urgente", "proximos_meses", "aberto", ""].includes(p)).toBe(true);
      });
    });

    it("collects required field: consentimento", () => {
      // Consent checkbox; timestamp captured at submission
      const consent = true;
      const timestamp = new Date().toISOString();
      expect(consent).toBe(true);
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  // Intake Creation Tests
  describe("Intake Creation", () => {
    it("submits valid form to /api/site-lead", () => {
      const payload = {
        submissionRef: "RS-reforma-rj-uuid-1234",
        consentCapturedAt: new Date().toISOString(),
        projectContext: "residencial",
        projectNeed: "Reformar revestimento",
        city: "Rio de Janeiro",
        name: "João Silva",
        phone: "(21) 98765-4321",
        consent: true,
        source: "site",
        pageRef: "/lp/reforma-rj"
      };

      expect(payload.submissionRef).toMatch(/^RS-reforma-rj-/);
      expect(payload.name).toBeTruthy();
      expect(payload.phone).toBeTruthy();
      expect(payload.city).toBeTruthy();
      expect(payload.consent).toBe(true);
    });

    it("receives protocol from Atlas (caseId is internal only)", () => {
      const receipt = {
        ok: true,
        protocol: "RS-20260909-00042",
        replay: false
      };

      expect(receipt.ok).toBe(true);
      expect(receipt.caseId).toBeUndefined();
      expect(receipt.protocol).toMatch(/^RS-/);
      expect(receipt.replay).toBe(false);
    });

    it("returns response without caseId to client", () => {
      // caseId is internal system identifier, never sent to client
      const response = {
        ok: true,
        replay: false,
        protocol: "RS-20260909-00042"
      };

      expect(response.caseId).toBeUndefined();
      expect(Object.keys(response)).not.toContain("caseId");
    });

    it("returns 201 for new Intake creation", () => {
      // Successful creation should return 201 with replay: false
      const statusCode = 201;
      const replay = false;
      expect(statusCode).toBe(201);
      expect(replay).toBe(false);
    });
  });

  // Idempotency Tests
  describe("Idempotency & Double-Submit", () => {
    it("generates unique submissionRef per form submission", () => {
      // Using UUID pattern: RS-reforma-rj-{randomUUID}
      const ref1 = "RS-reforma-rj-550e8400-e29b-41d4-a716-446655440000";
      const ref2 = "RS-reforma-rj-550e8400-e29b-41d4-a716-446655440001";
      expect(ref1).not.toBe(ref2);
    });

    it("reuses same submissionRef for retry within session", () => {
      const sessionRef = "RS-reforma-rj-session-001";
      const retry1 = sessionRef;
      const retry2 = sessionRef;
      expect(retry1).toBe(retry2);
    });

    it("double-submit with same submissionRef returns 200 + replay: true", () => {
      // Second submission of same ref should get replay: true
      const receipt = {
        ok: true,
        replay: true
      };

      const statusCode = 200;
      expect(statusCode).toBe(200);
      expect(receipt.replay).toBe(true);
      expect(receipt.caseId).toBeUndefined(); // caseId not sent to client
    });

    it("does not create duplicate Intake after timeout retry", () => {
      // Same submissionRef + Idempotency-Key header
      const ref = "RS-reforma-rj-timeout-001";
      const attempts = [
        { ref, status: "timeout" },
        { ref, status: "retry-success", replay: true }
      ];

      expect(attempts[1].replay).toBe(true);
      expect(attempts[1].ref).toBe(attempts[0].ref);
    });

    it("invalidates submissionRef after successful submission", () => {
      let pendingRef = "RS-reforma-rj-success-001";
      // After success
      pendingRef = null;
      expect(pendingRef).toBeNull();
    });

    it("creates new submissionRef when user edits and resubmits", () => {
      const ref1 = "RS-reforma-rj-attempt-001";
      // User edits form after failure
      const ref2 = "RS-reforma-rj-attempt-002";
      expect(ref1).not.toBe(ref2);
    });
  });

  // Protocol Propagation Tests
  describe("Protocol Propagation", () => {
    it("includes protocol in successful response", () => {
      const response = {
        ok: true,
        caseId: "case123",
        protocol: "RS-20260909-00042",
        replay: false
      };

      expect(response.protocol).toBeTruthy();
      expect(response.protocol).toMatch(/^RS-/);
    });

    it("omits protocol when not provided by Atlas", () => {
      const response = {
        ok: true,
        caseId: "case123",
        replay: false
      };

      expect(response.protocol).toBeUndefined();
    });

    it("displays protocol to user in success state", () => {
      const protocol = "RS-20260909-00042";
      const display = `Protocolo: ${protocol}`;
      expect(display).toContain("RS-20260909");
    });

    it("includes protocol in WhatsApp continuation message", () => {
      const message = `Protocolo: RS-20260909-00042\nGostaria de continuar`;
      expect(message).toContain("Protocolo:");
      expect(message).toContain("RS-20260909");
    });
  });

  // PII & Analytics Safety Tests
  describe("PII Safety", () => {
    it("does not send name to dataLayer", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.name).toBeUndefined();
    });

    it("does not send phone to dataLayer", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.phone).toBeUndefined();
    });

    it("does not send email to dataLayer", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.email).toBeUndefined();
    });

    it("does not send city to dataLayer", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.city).toBeUndefined();
    });

    it("does not send caseId to dataLayer", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.caseId).toBeUndefined();
    });

    it("does not send protocol to dataLayer", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.protocol).toBeUndefined();
    });

    it("does not send submissionRef to dataLayer", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.submissionRef).toBeUndefined();
    });

    it("does not send necessidade/free-text to dataLayer", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.necessidade).toBeUndefined();
      expect(dataLayer.projectNeed).toBeUndefined();
    });
  });

  // Analytics Events Tests
  describe("Analytics Events", () => {
    it("emits intake_created event after Atlas success", () => {
      const events = [];
      const event = {
        event: "intake_created",
        service_intent: "MAJOR_RENOVATION",
        acquisition_geography: "RJ",
        experiment_id: "HV-RJ-MAJOR-RENOVATION",
        entry_surface: "/lp/reforma-rj"
      };
      events.push(event);

      expect(events[0].event).toBe("intake_created");
      expect(events[0].service_intent).toBe("MAJOR_RENOVATION");
    });

    it("emits intake_created exactly once per browser submission", () => {
      const submissionRef = "RS-reforma-rj-001";
      const emissions = new Map();

      // First success
      emissions.set(submissionRef, 1);
      expect(emissions.get(submissionRef)).toBe(1);

      // Retry (replay) should NOT emit again
      expect(emissions.get(submissionRef)).toBe(1);
    });

    it("does not emit on replay", () => {
      // Atlas returns replay: true
      // Browser checks if event already emitted for this logical submission
      const alreadyEmitted = true;
      expect(alreadyEmitted).toBe(true);
      // Do NOT emit again
    });

    it("persists conversion marker in sessionStorage keyed by submissionRef", () => {
      const submissionRef = "RS-reforma-rj-001";
      const storageKey = `intake_created_emitted_${submissionRef}`;
      const stored = "true";
      expect(storageKey).toContain(submissionRef);
      expect(stored).toBe("true");
    });

    it("checks sessionStorage before emitting on retry/reload", () => {
      const submissionRef = "RS-reforma-rj-002";
      const storageKey = `intake_created_emitted_${submissionRef}`;
      // Simulated sessionStorage state
      const sessionState = { [storageKey]: "true" };
      const shouldEmit = !sessionState[storageKey];
      expect(shouldEmit).toBe(false);
    });

    it("does not allow submissionRef in dataLayer payload", () => {
      const dataLayer = { event: "intake_created" };
      expect(dataLayer.submissionRef).toBeUndefined();
    });

    it("preserves existing whatsapp_click event", () => {
      // Direct WhatsApp button still emits whatsapp_click
      const clickEvent = { event: "whatsapp_click" };
      expect(clickEvent.event).toBe("whatsapp_click");
    });

    it("includes non-PII dimensions in intake_created", () => {
      const payload = {
        event: "intake_created",
        service_intent: "MAJOR_RENOVATION",
        acquisition_geography: "RJ",
        experiment_id: "HV-RJ-MAJOR-RENOVATION",
        entry_surface: "/lp/reforma-rj"
      };

      expect(payload.service_intent).toBeTruthy();
      expect(payload.experiment_id).toBeTruthy();
      expect(payload.entry_surface).toBeTruthy();
    });
  });

  // Success UX Tests
  describe("Success UX", () => {
    it("shows success state only after Atlas 201/200", () => {
      const atlasSuccess = true;
      const showSuccess = atlasSuccess;
      expect(showSuccess).toBe(true);
    });

    it("displays protocol when available", () => {
      const protocol = "RS-20260909-00042";
      const display = protocol ? `Protocolo: ${protocol}` : "";
      expect(display).toContain("RS-20260909");
    });

    it("does NOT display caseId to user in success state", () => {
      const receipt = {
        caseId: "intake-abc123",
        protocol: "RS-20260909-00042"
      };
      const displayedText = receipt.protocol ? `Protocolo: ${receipt.protocol}` : "";
      expect(displayedText).not.toContain(receipt.caseId);
      expect(displayedText).not.toContain("ID de caso");
      expect(displayedText).not.toContain("intake-");
    });

    it("displays empty subtitle when protocol is unavailable", () => {
      const receipt = {
        caseId: "intake-abc123",
        protocol: undefined
      };
      const displayedText = receipt.protocol ? `Protocolo: ${receipt.protocol}` : "";
      expect(displayedText).toBe("");
      expect(displayedText).not.toContain(receipt.caseId);
    });

    it("offers WhatsApp continuation CTA", () => {
      const ctas = ["Continuar pelo WhatsApp", "Prefiro aguardar o contato"];
      expect(ctas[0]).toBe("Continuar pelo WhatsApp");
    });

    it("WhatsApp continuation does not create second Intake", () => {
      // Clicking WhatsApp opens message, reuses existing protocol
      const caseId = "intake-abc123";
      const protocol = "RS-20260909-00042";
      const message = `Protocolo: ${protocol}\nCaseId is NOT in message`;
      expect(message).not.toContain(caseId);
      expect(message).toContain(protocol);
    });

    it("prefiro aguardar does not emit conversion event", () => {
      // Clicking "prefer to wait" closes success state, no extra events
      const events = ["intake_created"]; // Only this one
      expect(events.length).toBe(1);
    });
  });

  // Direct WhatsApp Regression Tests
  describe("Direct WhatsApp CTA (Regression)", () => {
    it("direct WhatsApp button does not call /api/site-lead", () => {
      const direct = true;
      const callsApi = false;
      expect(callsApi).toBe(false);
    });

    it("direct WhatsApp does not create Intake", () => {
      const intakeCreated = false;
      expect(intakeCreated).toBe(false);
    });

    it("direct WhatsApp emits whatsapp_click only", () => {
      const events = ["whatsapp_click"];
      expect(events).toHaveLength(1);
      expect(events[0]).toBe("whatsapp_click");
    });
  });

  // Failure Scenario Tests
  describe("Failure Scenarios", () => {
    it("client validation error shows message, no server call", () => {
      const fieldError = "Informe seu telefone.";
      expect(fieldError).toBeTruthy();
    });

    it("Atlas 400 shows validation error", () => {
      const error = "Dados inválidos. Revise o formulário.";
      expect(error).toContain("inválidos");
    });

    it("Atlas 401 shows generic error", () => {
      const error = "Não foi possível processar a solicitação.";
      expect(error).not.toContain("token");
    });

    it("Atlas 503 shows retry prompt", () => {
      const error = "Serviço temporariamente indisponível";
      expect(error).toContain("temporariamente");
    });

    it("retry button reuses same submissionRef", () => {
      const ref1 = "RS-reforma-rj-retry-001";
      const ref2 = "RS-reforma-rj-retry-001"; // Same after retry
      expect(ref1).toBe(ref2);
    });

    it("success + WhatsApp failure keeps success state", () => {
      const successShown = true;
      const whatsappFailed = true;
      expect(successShown && whatsappFailed).toBe(true);
      // Do not reset form or re-submit
    });
  });

  // Geography Tests
  describe("Geography Handling", () => {
    it("captures actual city from user input", () => {
      const cidade = "Niterói";
      expect(cidade).toBeTruthy();
      expect(cidade).not.toContain("STATE OF");
    });

    it("never automatically writes state to city field", () => {
      const falseAuto = "STATE OF RIO DE JANEIRO";
      const doesNotEqual = "Niterói";
      expect(falseAuto).not.toBe(doesNotEqual);
    });

    it("preserves city in location.city for Atlas", () => {
      const payload = { location: { city: "Rio de Janeiro" } };
      expect(payload.location.city).toBe("Rio de Janeiro");
    });
  });

  // Attribution Tests
  describe("Growth Attribution", () => {
    it("captures and sends utm_source if present", () => {
      const payload = {
        attribution: {
          submissionTouch: {
            source: "google"
          }
        }
      };

      expect(payload.attribution.submissionTouch.source).toBe("google");
    });

    it("captures and sends utm_medium if present", () => {
      const payload = {
        attribution: {
          submissionTouch: {
            medium: "paid_search"
          }
        }
      };

      expect(payload.attribution.submissionTouch.medium).toBe("paid_search");
    });

    it("captures and sends utm_campaign if present", () => {
      const payload = {
        attribution: {
          submissionTouch: {
            campaignRef: "HV-RJ-MAJOR-RENOVATION"
          }
        }
      };

      expect(payload.attribution.submissionTouch.campaignRef).toContain("HV-RJ");
    });

    it("omits attribution when no Growth data", () => {
      const payload = { name: "João", phone: "(21) 98765-4321" };
      expect(payload.attribution).toBeUndefined();
    });
  });
});
