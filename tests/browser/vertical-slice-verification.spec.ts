import AxeBuilder from "@axe-core/playwright";
import {
  expect,
  test,
  type Page,
} from "@playwright/test";

interface SemanticEvent {
  schemaVersion: string;
  eventName: string;
  context: {
    pageRef: string;
    route?: string;
    templateRef?: string;
    componentRef?: string;
  };
  subjectRef?: string;
  channelRef?: string;
}

async function readSemanticEvents(
  page: Page,
): Promise<SemanticEvent[]> {
  return page.evaluate(() => {
    const analyticsWindow =
      window as Window & {
        __siteAnalyticsEvents?: unknown[];
      };

    return (
      analyticsWindow.__siteAnalyticsEvents ??
      []
    );
  }) as Promise<SemanticEvent[]>;
}

async function expectNoHorizontalOverflow(
  page: Page,
): Promise<void> {
  const hasNoOverflow =
    await page.evaluate(() => {
      const root =
        document.documentElement;

      return (
        root.scrollWidth <=
        root.clientWidth
      );
    });

  expect(hasNoOverflow).toBe(true);
}

test.describe(
  "T2B WP1 vertical slice closure",
  () => {
    test("Residential journey reaches mock ingress and semantic success without analytics PII", async ({
      page,
    }) => {
      await page.goto("/");

      const router =
        page.getByRole("region", {
          name:
            "Escolha seu contexto",
        });

      await router
        .getByRole("link", {
          name:
            "Explorar Residencial",
          exact: true,
        })
        .click();

      await expect(page).toHaveURL(
        /\/servicos$/,
      );

      await page
        .getByRole("link", {
          name:
            "Inicie seu projeto residencial",
          exact: true,
        })
        .first()
        .click();

      await expect(page).toHaveURL(
        /\/inicie-seu-projeto\?context=residencial$/,
      );

      const context =
        page.getByLabel(
          "Contexto",
          {
            exact: true,
          },
        );

      await expect(
        context,
      ).toHaveValue(
        "residencial",
      );

      await page
        .getByRole("button", {
          name: "Continuar",
        })
        .click();

      const need =
        page.getByLabel(
          "Descreva brevemente o que você precisa",
        );

      await expect(
        need,
      ).toBeFocused();

      await need.fill(
        "Fixture WP1G que não pode entrar em analytics.",
      );

      await page
        .getByRole("button", {
          name: "Continuar",
        })
        .click();

      await page
        .getByLabel(/Cidade/)
        .fill(
          "Cidade WP1G",
        );

      await page
        .getByRole("button", {
          name: "Continuar",
        })
        .click();

      await page
        .getByLabel("Nome")
        .fill(
          "Pessoa WP1G",
        );

      await page
        .getByLabel("E-mail")
        .fill(
          "wp1g@example.com",
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
            response.request().method() ===
              "POST",
        );

      await page
        .getByRole("button", {
          name:
            "Enviar contexto do projeto",
        })
        .click();

      const response =
        await responsePromise;

      expect(
        response.status(),
      ).toBe(200);

      expect(
        await response.json(),
      ).toEqual({
        ok: true,
        mock: true,
        schemaVersion:
          "site-lead.v1",
        submittedCount: 1,
      });

      const success =
        page.getByRole("status");

      await expect(
        success,
      ).toBeVisible();

      await expect(
        success,
      ).toBeFocused();

      const events =
        await readSemanticEvents(
          page,
        );

      expect(
        events.some(
          (event) =>
            event.eventName ===
              "page_viewed" &&
            event.context.pageRef ===
              "/inicie-seu-projeto",
        ),
      ).toBe(true);

      expect(
        events.some(
          (event) =>
            event.eventName ===
              "lead_submitted" &&
            event.subjectRef ===
              "residencial" &&
            event.channelRef ===
              "site_form",
        ),
      ).toBe(true);

      const serialized =
        JSON.stringify(events);

      expect(
        serialized,
      ).not.toContain(
        "Pessoa WP1G",
      );

      expect(
        serialized,
      ).not.toContain(
        "wp1g@example.com",
      );

      expect(
        serialized,
      ).not.toContain(
        "Cidade WP1G",
      );

      expect(
        serialized,
      ).not.toContain(
        "Fixture WP1G",
      );
    });

    test("Corporate / Institutional journey preserves context and responsive integrity on mobile", async ({
      page,
    }) => {
      await page.setViewportSize({
        width: 390,
        height: 844,
      });

      await page.goto("/");

      await expectNoHorizontalOverflow(
        page,
      );

      const router =
        page.getByRole("region", {
          name:
            "Escolha seu contexto",
        });

      await router
        .getByRole("link", {
          name:
            "Explorar Corporativo / Institucional",
          exact: true,
        })
        .click();

      await expect(page).toHaveURL(
        /\/corporativo$/,
      );

      await expectNoHorizontalOverflow(
        page,
      );

      await page
        .getByRole("link", {
          name:
            "Inicie seu projeto corporativo / institucional",
          exact: true,
        })
        .first()
        .click();

      await expect(page).toHaveURL(
        /\/inicie-seu-projeto\?context=corporativo_institucional$/,
      );

      await expectNoHorizontalOverflow(
        page,
      );

      const context =
        page.getByLabel(
          "Contexto",
          {
            exact: true,
          },
        );

      await expect(
        context,
      ).toHaveValue(
        "corporativo_institucional",
      );

      await page
        .getByRole("button", {
          name: "Continuar",
        })
        .click();

      const need =
        page.getByLabel(
          "Descreva brevemente o que você precisa",
        );

      await expect(
        need,
      ).toBeFocused();

      await need.fill(
        "Valor preservado no fluxo móvel.",
      );

      await page
        .getByRole("button", {
          name: "Continuar",
        })
        .click();

      await page
        .getByRole("button", {
          name: "Voltar",
        })
        .click();

      await expect(
        need,
      ).toHaveValue(
        "Valor preservado no fluxo móvel.",
      );
    });

    test("keyboard skip link and automated accessibility remain valid across closure surfaces", async ({
      page,
    }) => {
      await page.goto("/");

      await page.keyboard.press(
        "Tab",
      );

      const skipLink =
        page.getByRole("link", {
          name:
            "Pular para o conteúdo principal",
        });

      await expect(
        skipLink,
      ).toBeFocused();

      await page.keyboard.press(
        "Enter",
      );

      await expect(
        page.locator(
          "#main-content",
        ),
      ).toBeFocused();

      const surfaces = [
        "/",
        "/servicos",
        "/corporativo",
        "/inicie-seu-projeto?context=residencial",
      ];

      await page.setViewportSize({
        width: 390,
        height: 844,
      });

      for (
        const route
        of surfaces
      ) {
        await page.goto(route);

        await expectNoHorizontalOverflow(
          page,
        );

        const scan =
          await new AxeBuilder({
            page,
          }).analyze();

        expect(
          scan.violations,
          `axe violations at ${route}`,
        ).toEqual([]);
      }
    });
  },
);
