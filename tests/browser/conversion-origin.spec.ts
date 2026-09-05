import {
  expect,
  test,
} from "@playwright/test";

test.describe(
  "conversion origin attribution",
  () => {
    test(
      "Projects final CTA routes directly to WhatsApp, without an intake detour",
      async ({
        page,
      }) => {
        await page.goto(
          "/projetos",
        );

        const conversion = page.getByRole(
          "region",
          {
            name:
              "Seu projeto pode começar com uma conversa.",
          },
        );

        await expect(
          conversion.getByRole("link", { name: "WhatsApp sobre um projeto" }),
        ).toHaveAttribute("href", "https://wa.me/5521982590643");
      },
    );

    test(
      "segment secondary CTA routes to the structured project-start form without stray origin parameters",
      async ({
        page,
      }) => {
        await page.goto(
          "/servicos",
        );

        const conversion = page.getByRole(
          "region",
          {
            name:
              "Compartilhe o contexto do seu projeto.",
          },
        );

        await expect(
          conversion.getByRole("link", { name: "WhatsApp para projeto Residencial" }),
        ).toHaveAttribute("href", "https://wa.me/5521982590643");

        await conversion
          .getByRole("link", { name: "Prepare a conversa", exact: true })
          .click();

        const targetUrl =
          new URL(
            page.url(),
          );

        expect(
          targetUrl.pathname,
        ).toBe(
          "/inicie-seu-projeto",
        );

        expect(
          targetUrl.search,
        ).toBe("");

        await expect(
          page.getByRole("heading", {
            level: 1,
            name: "Organize seu contexto para uma conversa mais útil.",
          }),
        ).toBeVisible();
      },
    );

    test(
      "SiteHeader primary CTA routes to the structured project-start form with its own analytics origin, not a lead-payload field",
      async ({
        page,
      }) => {
        await page.goto(
          "/sobre",
        );

        await page
          .getByRole(
            "navigation",
            {
              name:
                "Navegação principal",
            },
          )
          .getByRole(
            "link",
            {
              name:
                "Inicie seu projeto",
              exact: true,
            },
          )
          .click();

        const targetUrl =
          new URL(
            page.url(),
          );

        expect(
          targetUrl.pathname,
        ).toBe(
          "/inicie-seu-projeto",
        );

        expect(
          targetUrl.searchParams.get("source"),
        ).toBe("site_header");

        expect(
          targetUrl.searchParams.get("pageRef"),
        ).toBe("/sobre");
      },
    );

    test(
      "direct project-start submission posts to the accepted Atlas seam and completes WhatsApp continuation",
      async ({
        page,
      }) => {
        await page.goto(
          "/inicie-seu-projeto",
        );

        await page.getByLabel("Nome", { exact: false }).fill("Pessoa Origem");
        await page.getByLabel("Tipo de projeto", { exact: false }).selectOption("residencial");
        await page.getByLabel("Cidade / Localização", { exact: false }).fill("Cidade Origem");
        await page.getByLabel("07 E-mail", { exact: true }).fill("origem@example.com");
        await page
          .getByLabel(
            /Li e concordo com a Política de Privacidade/,
          )
          .check();

        const requestPromise =
          page.waitForRequest(
            (request) =>
              request.url().includes(
                "/api/site-lead",
              ) &&
              request.method() ===
                "POST",
          );

        await page.getByRole(
          "button",
          {
            name:
              "Enviar contexto do projeto",
          },
        ).click();

        const request =
          await requestPromise;

        const payload =
          request.postDataJSON();

        expect(
          payload.pageRef,
        ).toBe(
          "/inicie-seu-projeto",
        );

        expect(payload.name).toBe("Pessoa Origem");
        expect(payload.city).toBe("Cidade Origem");
        expect(payload.projectContext).toBe("residencial");
        expect(payload.consent).toBe(true);

        await expect(
          page.locator(
            "[data-whatsapp-fallback]",
          ),
        ).toBeVisible();
      },
    );
  },
);
