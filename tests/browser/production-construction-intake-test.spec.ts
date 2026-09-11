import { test, expect } from "@playwright/test";

// PRODUCTION INTAKE TEST - GROWTH-ROYAL-CONSTRUCTION-INTAKE-03
// Single synthetic production intake to validate end-to-end flow
// Do NOT delete this test - it documents the production flow proof

test.describe("GROWTH-ROYAL-CONSTRUCTION-INTAKE-03 — Production Synthetic Intake", () => {
  test("Create one synthetic production intake on /lp/piscinas-rj", async ({
    page,
    context,
  }) => {
    // Track API responses
    const apiResponses: any[] = [];
    page.on("response", async (response) => {
      if (response.url().includes("/api/site-lead")) {
        try {
          const data = await response.json();
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            body: data,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            error: "Could not parse JSON",
          });
        }
      }
    });

    // Use production URL to match gate requirement
    const baseUrl = process.env.SC_R16_BASE_URL ?? "https://www.royalsplash.com.br";
    await page.goto(`${baseUrl}/lp/piscinas-rj`, {
      waitUntil: "networkidle",
    });

    // Verify structured form is present
    const form = page.locator("[data-piscinas-rj-intake-form]");
    await expect(form).toBeVisible();

    // Fill form with clearly marked test data
    await page.fill(
      "input[name='nome']",
      "TESTE PRODUÇÃO CONSTRUÇÃO ROYAL — NÃO CONTATAR"
    );
    await page.fill("input[name='telefone']", "(21) 9999-9999");
    await page.fill("input[name='cidade']", "Rio de Janeiro");
    await page.fill(
      "textarea[name='necessidade']",
      "GROWTH-ROYAL-CONSTRUCTION-INTAKE-03 — TESTE SINTÉTICO — NÃO É CLIENTE REAL"
    );

    // Select a timeline option
    await page.selectOption("select[name='prazo']", "proximos_meses");

    // Check consent
    await page.check("input[name='consentimento']");

    // Submit form
    await page.click("button[type='submit']");

    // Wait for success state to appear
    const successState = page.locator("[data-success-state]");
    await expect(successState).toBeVisible({ timeout: 10000 });

    // Capture protocol from success state
    const protocolLine = successState.locator("[data-protocol-line]");
    const protocolText = await protocolLine.textContent();
    expect(protocolText).toBeTruthy();
    expect(protocolText).toContain("Protocolo:");

    // Extract protocol value
    const protocolMatch = protocolText?.match(/Protocolo:\s*(\S+)/);
    const protocol = protocolMatch?.[1];
    expect(protocol).toBeTruthy();

    // Verify API response
    expect(apiResponses.length).toBeGreaterThan(0);
    const apiResponse = apiResponses[0];
    expect(apiResponse.status).toBe(201);
    expect(apiResponse.body.ok).toBe(true);
    expect(apiResponse.body.replay).toBe(false);
    expect(apiResponse.body.protocol).toBe(protocol);

    // Verify sensitive data is NOT exposed in response
    expect(apiResponse.body).not.toHaveProperty("submissionRef");
    expect(apiResponse.body).not.toHaveProperty("caseId");

    // Store test data for verification
    const testData = {
      submissionRef: "RS-piscinas-rj-[captured-from-request]",
      protocol: protocol,
      apiStatus: apiResponse.status,
      apiOk: apiResponse.body.ok,
      apiReplay: apiResponse.body.replay,
      timestamp: apiResponse.timestamp,
      notes:
        "Single production intake submitted to /lp/piscinas-rj - do NOT create additional production intakes",
    };

    console.log("\n=== PRODUCTION INTAKE TEST DATA ===");
    console.log(JSON.stringify(testData, null, 2));

    // Do NOT click WhatsApp button as per gate requirements
    // Instead, close the success dialog
    const closeBtn = successState.locator("[data-close-success]");
    await closeBtn.click();

    // Verify form is reset
    await expect(form).toBeVisible();
    const nameField = page.locator("input[name='nome']");
    await expect(nameField).toHaveValue("");
  });
});
