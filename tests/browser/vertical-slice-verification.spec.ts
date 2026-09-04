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
    test("Residential primary journey reaches the structured project-start surface", async ({
      page,
    }) => {
      await page.goto("/");

      await page
        .locator(".context-transition")
        .getByRole("link", {
          name:
            /Residencial/,
        })
        .click();

      await expect(page).toHaveURL(
        /\/servicos$/,
      );

      await page
        .getByRole("region", { name: "Compartilhe o contexto do seu projeto." })
        .getByRole("link", {
          name:
            "Prepare a conversa",
          exact: true,
        })
        .click();

      await expect(page).toHaveURL(/\/inicie-seu-projeto$/);
      expect(new URL(page.url()).search).toBe("");
      await expect(page.getByRole("heading", {
        level: 1,
        name: "Organize seu contexto para uma conversa mais útil.",
        exact: true,
      })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test("Corporate / Institutional journey reaches the project-start surface with responsive integrity on mobile", async ({
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

      await page
        .locator(".context-transition")
        .getByRole("link", {
          name:
            /Corporativo \/ Institucional/,
        })
        .click();

      await expect(page).toHaveURL(
        /\/corporativo$/,
      );

      await expectNoHorizontalOverflow(
        page,
      );

      await page
        .getByRole("region", { name: "Comece pela escala e pelo contexto de uso." })
        .getByRole("link", {
          name:
            "Prepare a conversa",
          exact: true,
        })
        .click();

      await expect(page).toHaveURL(/\/inicie-seu-projeto$/);
      expect(new URL(page.url()).search).toBe("");

      await expectNoHorizontalOverflow(
        page,
      );

      await expect(page.getByRole("heading", {
        level: 1,
        name: "Organize seu contexto para uma conversa mais útil.",
        exact: true,
      })).toBeVisible();
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
        "/inicie-seu-projeto",
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
