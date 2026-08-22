import {
  expect,
  test,
  type Page,
} from "@playwright/test";

async function completeMinimalIntake(
  page: Page,
): Promise<void> {
  const context =
    page.getByLabel(
      "Contexto",
      {
        exact: true,
      },
    );

  if (!(await context.inputValue())) {
    await context.selectOption(
      "residencial",
    );
  }

  await page.getByLabel("Cidade", { exact: true }).fill(
    "Cidade Origem",
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
    "Fixture de atribuição de origem.",
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
    "Pessoa Origem",
  );

  await page.getByLabel(
    "E-mail",
  ).fill(
    "origem@example.com",
  );

  await page
    .getByLabel(
      /Concordo com o envio destas informações/,
    )
    .check();
}

test.describe(
  "conversion origin attribution",
  () => {
    test(
      "Projects CTA preserves semantic source and origin page into intake payload",
      async ({
        page,
      }) => {
        await page.goto(
          "/projetos",
        );

        await page
          .getByRole(
            "region",
            {
              name:
                "Avance com o contexto do seu projeto",
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

        const intakeUrl =
          new URL(
            page.url(),
          );

        expect(
          intakeUrl.pathname,
        ).toBe(
          "/inicie-seu-projeto",
        );

        expect(
          intakeUrl.searchParams.get(
            "source",
          ),
        ).toBe(
          "royal_projects",
        );

        expect(
          intakeUrl.searchParams.get(
            "pageRef",
          ),
        ).toBe(
          "/projetos",
        );

        await completeMinimalIntake(
          page,
        );

        const requestPromise =
          page.waitForRequest(
            (request) =>
              request.url().includes(
                "/api/site-lead-preview",
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
          payload.source,
        ).toBe(
          "royal_projects",
        );

        expect(
          payload.pageRef,
        ).toBe(
          "/projetos",
        );

        await expect(
          page.getByRole(
            "status",
          ),
        ).toBeVisible();
      },
    );

    test(
      "segment CTA keeps context while adding semantic origin",
      async ({
        page,
      }) => {
        await page.goto(
          "/servicos",
        );

        await page
          .getByRole(
            "link",
            {
              name:
                "Inicie seu projeto residencial",
              exact: true,
            },
          )
          .first()
          .click();

        const intakeUrl =
          new URL(
            page.url(),
          );

        expect(
          intakeUrl.pathname,
        ).toBe(
          "/inicie-seu-projeto",
        );

        expect(
          intakeUrl.searchParams.get(
            "context",
          ),
        ).toBe(
          "residencial",
        );

        expect(
          intakeUrl.searchParams.get(
            "source",
          ),
        ).toBe(
          "segment_context",
        );

        expect(
          intakeUrl.searchParams.get(
            "pageRef",
          ),
        ).toBe(
          "/servicos",
        );

        await expect(
          page.getByLabel(
            "Contexto",
            {
              exact: true,
            },
          ),
        ).toHaveValue(
          "residencial",
        );
      },
    );

    test(
      "SiteHeader qualified CTA records header origin",
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

        const intakeUrl =
          new URL(
            page.url(),
          );

        expect(
          intakeUrl.searchParams.get(
            "source",
          ),
        ).toBe(
          "site_header",
        );

        expect(
          intakeUrl.searchParams.get(
            "pageRef",
          ),
        ).toBe(
          "/sobre",
        );
      },
    );

    test(
      "explicit origin survives direct intake navigation without relying on referrer",
      async ({
        page,
      }) => {
        await page.goto(
          "/inicie-seu-projeto?source=royal_projects&pageRef=%2Fprojetos",
        );

        await completeMinimalIntake(
          page,
        );

        const requestPromise =
          page.waitForRequest(
            (request) =>
              request.url().includes(
                "/api/site-lead-preview",
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
          payload.source,
        ).toBe(
          "royal_projects",
        );

        expect(
          payload.pageRef,
        ).toBe(
          "/projetos",
        );

        await expect(
          page.getByRole(
            "status",
          ),
        ).toBeVisible();
      },
    );
  },
);
