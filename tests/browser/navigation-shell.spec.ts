import { expect, test } from "@playwright/test";

test.describe("target Site navigation shell", () => {
  test("desktop exposes approved IA and current-section orientation", async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 1280,
      height: 800,
    });

    await page.goto("/sobre");

    const navigation = page.getByRole(
      "navigation",
      {
        name: "Navegação principal",
      },
    );

    await expect(
      navigation.getByRole("link", {
        name: "Projetos",
        exact: true,
      }),
    ).toHaveAttribute("href", "/projetos");

    await expect(
      navigation.getByRole("link", {
        name: "Residencial",
        exact: true,
      }),
    ).toHaveAttribute("href", "/servicos");

    await expect(
      navigation.getByRole("link", {
        name: "Corporativo / Institucional",
        exact: true,
      }),
    ).toHaveAttribute("href", "/corporativo");

    await expect(
      navigation.getByRole("link", {
        name: "Método Royal",
        exact: true,
      }),
    ).toHaveAttribute("href", "/metodo-royal");

    await expect(
      navigation.getByRole("link", {
        name: "A Royal",
        exact: true,
      }),
    ).toHaveAttribute("aria-current", "page");

    await expect(
      navigation.getByRole("link", {
        name: "Inicie seu projeto",
        exact: true,
      }),
    ).toHaveAttribute(
      "href",
      "/inicie-seu-projeto",
    );
  });

  test("mobile navigation manages state, focus and explicit closure", async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    await page.goto("/sobre");

    const trigger = page.locator(
      "[data-site-nav-trigger]",
    );

    await expect(trigger).toHaveAccessibleName(
      "Abrir navegação",
    );

    await expect(trigger).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await trigger.click();

    await expect(trigger).toHaveAccessibleName(
      "Fechar navegação",
    );

    await expect(trigger).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    const mobileNavigation = page.getByRole(
      "navigation",
      {
        name: "Navegação móvel",
      },
    );

    await expect(mobileNavigation).toBeVisible();

    const firstLink = mobileNavigation.getByRole(
      "link",
      {
        name: "Projetos",
        exact: true,
      },
    );

    await expect(firstLink).toBeFocused();

    await expect(
      mobileNavigation.getByRole("link", {
        name: "Inicie seu projeto",
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      mobileNavigation.getByRole("link", {
        name: "Contato",
        exact: true,
      }),
    ).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(mobileNavigation).toBeHidden();

    await expect(trigger).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await expect(trigger).toHaveAccessibleName(
      "Abrir navegação",
    );

    await expect(trigger).toBeFocused();
  });
});
