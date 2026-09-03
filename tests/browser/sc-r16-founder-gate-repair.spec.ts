import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  ["Home", "/"], ["Acervo", "/projetos"], ["Residencial", "/servicos"],
  ["Corporativo", "/corporativo"], ["Método", "/metodo-royal"], ["A Royal", "/sobre"],
  ["Contato", "/contato"], ["Inicie seu Projeto", "/inicie-seu-projeto"],
  ["Privacidade", "/politica-de-privacidade"],
] as const;
const viewports = [
  { width: 390, height: 844 }, { width: 430, height: 932 },
  { width: 768, height: 1024 }, { width: 1440, height: 900 },
];

test("content exceeding every viewport remains naturally reachable on every route", async ({ page }) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));

  for (const [name, route] of routes) {
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      const response = await page.goto(route, { waitUntil: "networkidle" });
      expect(response?.ok(), `${name} ${viewport.width} response`).toBeTruthy();
      const initial = await page.evaluate(() => ({
        bodyOverflowY: getComputedStyle(document.body).overflowY,
        htmlOverflowY: getComputedStyle(document.documentElement).overflowY,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(initial.bodyOverflowY, `${name} ${viewport.width} body lock`).not.toBe("hidden");
      expect(initial.htmlOverflowY, `${name} ${viewport.width} html lock`).not.toBe("hidden");
      expect(initial.scrollWidth - initial.clientWidth, `${name} ${viewport.width} horizontal overflow`).toBeLessThanOrEqual(1);
      expect(initial.scrollHeight, `${name} ${viewport.width} content depth`).toBeGreaterThan(initial.clientHeight);

      await page.evaluate(() => window.scrollTo(0, 0));
      for (let step = 0; step < 8; step += 1) await page.mouse.wheel(0, initial.scrollHeight);
      await page.waitForTimeout(80);
      const reached = await page.evaluate(() => ({
        scrollY: window.scrollY,
        maximum: document.documentElement.scrollHeight - window.innerHeight,
        footerVisible: document.querySelector("footer")?.getBoundingClientRect().top! < window.innerHeight,
      }));
      expect(reached.scrollY, `${name} ${viewport.width} did not scroll`).toBeGreaterThan(0);
      expect(reached.maximum - reached.scrollY, `${name} ${viewport.width} bottom unreachable`).toBeLessThanOrEqual(2);
      expect(reached.footerVisible, `${name} ${viewport.width} footer unreachable`).toBeTruthy();

      await page.locator("footer").scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      const broken = await page.locator("img").evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.getAttribute("src")));
      expect(broken, `${name} ${viewport.width} broken images`).toEqual([]);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /nofollow/i);
    }
  }
  expect(errors).toEqual([]);
});

test("all local navigation links resolve inside the current Preview experience", async ({ page, request }) => {
  const hrefs = new Set<string>();
  for (const [, route] of routes) {
    await page.goto(route);
    for (const href of await page.locator('a[href^="/"]').evaluateAll(links => links.map(link => link.getAttribute("href")).filter((href): href is string => Boolean(href)))) hrefs.add(href);
  }
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.ok(), `internal link ${href}`).toBeTruthy();
  }
});

test("mobile menu is compact, labeled, keyboard operable, and closes after navigation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.locator("[data-site-nav-trigger]");
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveText("");
  const size = await trigger.boundingBox();
  expect(size?.width).toBeGreaterThanOrEqual(44);
  expect(size?.height).toBeGreaterThanOrEqual(44);
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toHaveAccessibleName("Fechar navegação");
  await expect(page.getByRole("navigation", { name: "Navegação móvel" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await page.getByRole("navigation", { name: "Navegação móvel" }).getByRole("link", { name: "A Royal" }).click();
  await expect(page).toHaveURL(/\/sobre$/);
});

test("visible form validates partial input and hands completed context to WhatsApp for review", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { __capturedWhatsApp?: string }).__capturedWhatsApp = "";
    window.open = ((url?: string | URL) => { (window as Window & { __capturedWhatsApp?: string }).__capturedWhatsApp = String(url ?? ""); return { closed: false } as Window; }) as typeof window.open;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Fale com a Royal" }).click();
  await expect(page).toHaveURL(/\/inicie-seu-projeto(?:\?.*)?$/);
  await expect(page.locator("[data-project-start-form]")).toBeVisible();
  await expect(page.getByRole("link", { name: "Leia a Política de Privacidade" })).toHaveAttribute("href", "/politica-de-privacidade");

  await page.getByRole("button", { name: "Abrir WhatsApp com contexto" }).click();
  await expect(page.locator("[data-error-for=nome]")).toContainText("obrigatório");
  await page.getByLabel(/Nome/).fill("A");
  await page.getByLabel(/Nome/).blur();
  await expect(page.locator("[data-error-for=nome]")).toContainText("pelo menos 2");
  await page.getByLabel(/Nome/).fill("Ana Costa");
  await page.getByLabel(/Tipo de projeto/).selectOption("residencial");
  await page.getByLabel(/Escala aproximada/).fill("Piscina com deck e sauna");
  await page.getByLabel(/Prazo/).selectOption("proximos_meses");
  await page.getByLabel(/Questão específica/).fill("Avaliar estrutura existente");
  await page.getByLabel(/Autorizo compartilhar/).check();
  await page.getByRole("button", { name: "Abrir WhatsApp com contexto" }).click();
  const captured = await page.evaluate(() => (window as Window & { __capturedWhatsApp?: string }).__capturedWhatsApp ?? "");
  expect(captured).toMatch(/^https:\/\/wa\.me\/5521982590643\?text=/);
  const message = new URL(captured).searchParams.get("text") ?? "";
  expect(message).toContain("Nome: Ana Costa");
  expect(message).toContain("Tipo: Residencial");
  expect(message).toContain("Escala: Piscina com deck e sauna");
  expect(message).toContain("Questão crítica: Avaliar estrutura existente");
  await expect(page.locator("[data-whatsapp-fallback]")).toBeVisible();
});

test("repaired routes have no serious or critical Axe findings", async ({ page }) => {
  test.setTimeout(120_000);
  for (const [, route] of routes) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => item.impact === "serious" || item.impact === "critical"), route).toEqual([]);
  }
});
