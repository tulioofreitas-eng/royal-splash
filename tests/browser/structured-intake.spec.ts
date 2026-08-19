import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("structured project intake", () => {
  test("preserves progressive values and submits site-lead.v1 to Preview mock ingress", async ({
    page,
  }) => {
    await page.goto("/inicie-seu-projeto");

    const form = page.locator(
      "[data-intake-form]",
    );

    const context = page.getByLabel("Contexto", {
      exact: true,
    });

    await context.selectOption(
      "residencial",
    );

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    const need = page.getByLabel(
      "Descreva brevemente o que você precisa",
    );

    await expect(need).toBeFocused();

    await need.fill(
      "Fixture funcional para verificar o boundary de lead.",
    );

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    const city = page.getByLabel(
      /Cidade/,
    );

    await city.fill("Cidade de teste");

    await page.getByRole("button", {
      name: "Voltar",
    }).click();

    await expect(need).toHaveValue(
      "Fixture funcional para verificar o boundary de lead.",
    );

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    await expect(city).toHaveValue(
      "Cidade de teste",
    );

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    await page.getByLabel("Nome").fill(
      "Pessoa de Teste",
    );

    await page.getByLabel("E-mail").fill(
      "teste@example.com",
    );

    await page
      .getByLabel(
        /Concordo com o envio destas informações/,
      )
      .check();

    const responsePromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/site-lead-preview",
          ) &&
          response.request().method() === "POST",
      );

    await page.getByRole("button", {
      name: "Enviar contexto do projeto",
    }).click();

    const response = await responsePromise;

    expect(response.status()).toBe(200);

    const responseBody =
      await response.json();

    expect(responseBody).toEqual({
      ok: true,
      mock: true,
      schemaVersion: "site-lead.v1",
      submittedCount: 1,
    });

    await expect(form).toBeHidden();

    const success = page.getByRole(
      "status",
    );

    await expect(
      success.getByRole("heading", {
        name: "Informações recebidas",
      }),
    ).toBeVisible();

    await expect(success).toBeFocused();
  });

  test("shows accessible validation without discarding entered values", async ({
    page,
  }) => {
    await page.goto("/inicie-seu-projeto");

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    const context = page.getByLabel("Contexto", {
      exact: true,
    });

    await expect(context).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await expect(
      page.getByText(
        "Selecione o contexto do projeto.",
      ),
    ).toBeVisible();

    await context.selectOption(
      "corporativo_institucional",
    );

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    const need = page.getByLabel(
      "Descreva brevemente o que você precisa",
    );

    await need.fill(
      "Valor que deve ser preservado.",
    );

    await page.getByRole("button", {
      name: "Continuar",
    }).click();

    await page.getByRole("button", {
      name: "Voltar",
    }).click();

    await expect(need).toHaveValue(
      "Valor que deve ser preservado.",
    );
  });

  test("new intake surface has no automated axe violations", async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    await page.goto("/inicie-seu-projeto");

    const accessibilityScanResults =
      await new AxeBuilder({
        page,
      }).analyze();

    expect(
      accessibilityScanResults.violations,
    ).toEqual([]);
  });
});
