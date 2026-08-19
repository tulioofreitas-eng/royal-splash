import {
  expect,
  test,
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

async function readEvents(
  page: import("@playwright/test").Page,
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

test.describe(
  "provider-independent semantic analytics runtime",
  () => {
    test("records a semantic page_viewed event", async ({
      page,
    }) => {
      await page.goto("/");

      const events =
        await readEvents(page);

      expect(events).toEqual([
        {
          schemaVersion:
            "site-analytics.v1",
          eventName:
            "page_viewed",
          context: {
            pageRef: "/",
            route: "/",
            templateRef: "site",
          },
        },
      ]);
    });

    test("records Home qualified CTA activation without provider delivery", async ({
      page,
    }) => {
      await page.goto("/");

      await page.evaluate(() => {
        document.addEventListener(
          "click",
          (event) => {
            if (
              event.target instanceof Element &&
              event.target.closest(
                "[data-analytics-cta]",
              )
            ) {
              event.preventDefault();
            }
          },
          {
            capture: true,
            once: true,
          },
        );
      });

      await page
        .getByRole("main")
        .getByRole("link", {
          name: "Inicie seu projeto",
          exact: true,
        })
        .first()
        .click();

      const events =
        await readEvents(page);

      expect(events.at(-1)).toEqual({
        schemaVersion:
          "site-analytics.v1",
        eventName:
          "cta_activated",
        context: {
          pageRef: "/",
          route: "/",
          templateRef: "site",
          componentRef:
            "home_entry",
        },
        subjectRef:
          "project_start",
        channelRef:
          "site_form",
      });
    });

    test("records segment CTA activation with semantic context only", async ({
      page,
    }) => {
      await page.goto("/servicos");

      await page.evaluate(() => {
        document.addEventListener(
          "click",
          (event) => {
            if (
              event.target instanceof Element &&
              event.target.closest(
                "[data-analytics-cta]",
              )
            ) {
              event.preventDefault();
            }
          },
          {
            capture: true,
            once: true,
          },
        );
      });

      await page
        .getByRole("link", {
          name:
            "Inicie seu projeto residencial",
          exact: true,
        })
        .first()
        .click();

      const events =
        await readEvents(page);

      expect(events.at(-1)).toEqual({
        schemaVersion:
          "site-analytics.v1",
        eventName:
          "cta_activated",
        context: {
          pageRef:
            "/servicos",
          route:
            "/servicos",
          templateRef:
            "site",
          componentRef:
            "segment_context",
        },
        subjectRef:
          "residencial",
        channelRef:
          "site_form",
      });
    });

    test("records lead_submitted after successful mock ingress without PII", async ({
      page,
    }) => {
      await page.goto(
        "/inicie-seu-projeto?context=residencial",
      );

      await page.getByRole(
        "button",
        {
          name: "Continuar",
        },
      ).click();

      await page.getByLabel(
        "Descreva brevemente o que você precisa",
      ).fill(
        "Conteúdo sensível de teste que não pode entrar em analytics.",
      );

      await page.getByRole(
        "button",
        {
          name: "Continuar",
        },
      ).click();

      await page.getByLabel(
        /Cidade/,
      ).fill(
        "Cidade Analytics",
      );

      await page.getByRole(
        "button",
        {
          name: "Continuar",
        },
      ).click();

      await page.getByLabel(
        "Nome",
      ).fill(
        "Pessoa Analytics",
      );

      await page.getByLabel(
        "E-mail",
      ).fill(
        "analytics@example.com",
      );

      await page
        .getByLabel(
          /Concordo com o envio destas informações/,
        )
        .check();

      await page.getByRole(
        "button",
        {
          name:
            "Enviar contexto do projeto",
        },
      ).click();

      await expect(
        page.getByRole("status"),
      ).toBeVisible();

      const events =
        await readEvents(page);

      const leadEvent =
        events.find(
          (event) =>
            event.eventName ===
            "lead_submitted",
        );

      expect(leadEvent).toEqual({
        schemaVersion:
          "site-analytics.v1",
        eventName:
          "lead_submitted",
        context: {
          pageRef:
            "/inicie-seu-projeto",
          route:
            "/inicie-seu-projeto",
          templateRef:
            "site",
          componentRef:
            "structured_intake",
        },
        subjectRef:
          "residencial",
        channelRef:
          "site_form",
      });

      const serialized =
        JSON.stringify(events);

      expect(serialized).not.toContain(
        "Pessoa Analytics",
      );

      expect(serialized).not.toContain(
        "analytics@example.com",
      );

      expect(serialized).not.toContain(
        "Cidade Analytics",
      );

      expect(serialized).not.toContain(
        "Conteúdo sensível de teste",
      );
    });
  },
);
