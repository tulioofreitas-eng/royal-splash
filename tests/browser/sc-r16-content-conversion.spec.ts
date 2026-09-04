import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const routes = [
  ["home", "/"], ["acervo", "/projetos"], ["residencial", "/servicos"],
  ["corporativo", "/corporativo"], ["metodo", "/metodo-royal"], ["a-royal", "/sobre"],
  ["contato", "/contato"], ["inicie-seu-projeto", "/inicie-seu-projeto"],
] as const;
const screenshotDir = path.resolve("artifacts/sc-r16-r1/screenshots");

test.beforeAll(async () => { await mkdir(screenshotDir, { recursive: true }); });

test("all eight public experiences render safely, accessibly, and responsively", async ({ page }) => {
  test.setTimeout(180_000);
  const consoleErrors: string[] = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", error => consoleErrors.push(error.message));
  let serious = 0;
  let critical = 0;

  for (const [name, route] of routes) {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.ok(), `${route} response`).toBeTruthy();
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /nofollow/i);
    await expect(page.locator("[data-persistent-whatsapp]")).toBeVisible();
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    expect(await page.locator("img").evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.getAttribute("src"))), `${route} broken images`).toEqual([]);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    serious += axe.violations.filter(v => v.impact === "serious").length;
    critical += axe.violations.filter(v => v.impact === "critical").length;
    expect(axe.violations.filter(v => v.impact === "serious" || v.impact === "critical"), `${route} serious/critical axe`).toEqual([]);
    await page.screenshot({ path: path.join(screenshotDir, `${name}-1440.png`), fullPage: true });

    for (const width of [390, 430, 768]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1024 });
      await page.reload({ waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} overflow at ${width}`).toBeLessThanOrEqual(1);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(screenshotDir, `${name}-390.png`), fullPage: true });
  }
  console.log(`SC_R16_AXE_CRITICAL=${critical} SC_R16_AXE_SERIOUS=${serious}`);
  expect(consoleErrors).toEqual([]);
});

test("project form validates and composes deterministic encoded WhatsApp messages without PII analytics", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __capturedWhatsApp?: string }).__capturedWhatsApp = "";
    window.open = ((url?: string | URL) => { (window as Window & { __capturedWhatsApp?: string }).__capturedWhatsApp = String(url ?? ""); return { closed: false } as Window; }) as typeof window.open;
  });
  await page.goto("/inicie-seu-projeto");
  await page.getByRole("button", { name: "Abrir WhatsApp com contexto" }).click();
  await expect(page.locator("[data-error-for=nome]")).toContainText("obrigatório");
  await expect(page.locator("[data-error-for=tipo_projeto]")).toContainText("obrigatório");
  await expect(page.locator("[data-error-for=consentimento]")).toContainText("aceitar");

  await page.getByLabel(/Nome/).fill("Ana Costa");
  await page.getByLabel(/Tipo de projeto/).selectOption("corporativo");
  await page.getByLabel(/Escala aproximada/).fill("Piscina 20x30m + sauna integrada");
  await page.getByLabel(/Prazo/).selectOption("proximos_meses");
  await page.getByLabel(/Questão específica/).fill("Vazamento estrutural em piscina existente");
  await page.getByLabel(/Autorizo compartilhar/).check();
  await page.getByRole("button", { name: "Abrir WhatsApp com contexto" }).click();

  const captured = await page.evaluate(() => (window as Window & { __capturedWhatsApp?: string }).__capturedWhatsApp ?? "");
  expect(captured).toMatch(/^https:\/\/wa\.me\/5521982590643\?text=/);
  const message = decodeURIComponent(new URL(captured).searchParams.get("text") ?? "");
  expect(message).toBe("Olá Royal,\n\nGostaria de compartilhar contexto sobre um projeto.\n\nNome: Ana Costa\nTipo: Corporativo / Institucional\nEscala: Piscina 20x30m + sauna integrada\nPrazo: Próximos meses\nQuestão crítica: Vazamento estrutural em piscina existente\n\nFico à disposição para conversar sobre próximos passos.");
  const analytics = await page.evaluate(() => (window as Window & { __projectFormAnalyticsEvents?: unknown[] }).__projectFormAnalyticsEvents ?? []);
  expect(JSON.stringify(analytics)).not.toContain("Ana Costa");
  expect(JSON.stringify(analytics)).not.toContain("Vazamento estrutural");
  expect(JSON.stringify(analytics)).toContain("form_whatsapp_continue");

  await page.reload();
  await page.getByLabel(/Nome/).fill("João");
  await page.getByLabel(/Tipo de projeto/).selectOption("residencial");
  await page.getByLabel(/Autorizo compartilhar/).check();
  await page.getByRole("button", { name: "Abrir WhatsApp com contexto" }).click();
  const minimal = decodeURIComponent(new URL(await page.evaluate(() => (window as Window & { __capturedWhatsApp?: string }).__capturedWhatsApp ?? "")).searchParams.get("text") ?? "");
  expect(minimal).not.toContain("Escala:");
  expect(minimal).not.toContain("Prazo:");
  expect(minimal).not.toContain("Questão crítica:");
});
