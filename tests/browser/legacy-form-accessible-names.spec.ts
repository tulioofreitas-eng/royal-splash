import {
  expect,
  test,
} from "@playwright/test";

import AxeBuilder
  from "@axe-core/playwright";

test(
  "/contato legacy lead form owns explicit accessible names",
  async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    const response =
      await page.goto("/contato");

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);

    const controls = [
      {
        id: "lead-nome",
        label: "Nome",
        name: "nome",
      },
      {
        id: "lead-telefone",
        label: "Telefone / WhatsApp",
        name: "telefone",
      },
      {
        id: "lead-email",
        label: "E-mail",
        name: "email",
      },
      {
        id: "lead-cidade",
        label: "Cidade",
        name: "cidade",
      },
      {
        id: "lead-tipo-projeto",
        label: "Tipo de projeto",
        name: "tipo_projeto",
      },
      {
        id: "lead-descreva-projeto",
        label: "Descreva o projeto",
        name: "descreva_projeto",
      },
      {
        id: "lead-mensagem",
        label: "Mensagem",
        name: "mensagem",
      },
    ];

    for (
      const control
      of controls
    ) {
      const element =
        page.locator(
          `#${control.id}`,
        );

      await expect(
        element,
      ).toHaveCount(1);

      await expect(
        element,
      ).toHaveAttribute(
        "name",
        control.name,
      );

      const labels =
        await element.evaluate(
          (
            node,
          ) =>
            [
              ...(node.labels ?? []),
            ].map(
              (
                label,
              ) =>
                label
                  .textContent
                  ?.replace(
                    /\s+/g,
                    " ",
                  )
                  .trim()
                ?? "",
            ),
        );

      expect(labels).toEqual([
        control.label,
      ]);
    }

    const consent =
      page.locator(
        'input[name="consentimento"]',
      );

    await expect(consent).toHaveCount(1);

    const consentLabels =
      await consent.evaluate(
        (
          node,
        ) =>
          [
            ...(node.labels ?? []),
          ].map(
            (
              label,
            ) =>
              label
                .textContent
                ?.replace(
                  /\s+/g,
                  " ",
                )
                .trim()
              ?? "",
          ),
      );

    expect(
      consentLabels.length,
    ).toBe(1);

    const accessibility =
      await new AxeBuilder({
        page,
      })
        .withRules([
          "label",
          "select-name",
        ])
        .analyze();

    expect(
      accessibility.violations,
    ).toEqual([]);
  },
);

test(
  "dormant WhatsApp qualification controls retain accessible names without activating the flow",
  async ({
    page,
  }) => {
    await page.setViewportSize({
      width: 390,
      height: 844,
    });

    const response =
      await page.goto("/contato");

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);

    const modal =
      page.locator(
        "#whatsapp-modal",
      );

    await expect(modal).toHaveCount(1);

    await expect(modal).toHaveCSS(
      "display",
      "none",
    );

    const controls = [
      {
        id: "wa-nome",
        label: "Nome",
      },
      {
        id: "wa-telefone",
        label: "Telefone",
      },
      {
        id: "wa-tipo",
        label: "Tipo de projeto",
      },
    ];

    for (
      const control
      of controls
    ) {
      const element =
        page.locator(
          `#${control.id}`,
        );

      await expect(
        element,
      ).toHaveCount(1);

      const labels =
        await element.evaluate(
          (
            node,
          ) =>
            [
              ...(node.labels ?? []),
            ].map(
              (
                label,
              ) =>
                label
                  .textContent
                  ?.replace(
                    /\s+/g,
                    " ",
                  )
                  .trim()
                ?? "",
            ),
        );

      expect(labels).toEqual([
        control.label,
      ]);
    }

    const consent =
      page.locator(
        "#wa-consentimento",
      );

    const consentLabels =
      await consent.evaluate(
        (
          node,
        ) =>
          [
            ...(node.labels ?? []),
          ].map(
            (
              label,
            ) =>
              label
                .textContent
                ?.replace(
                  /\s+/g,
                  " ",
                )
                .trim()
              ?? "",
          ),
      );

    expect(
      consentLabels.length,
    ).toBe(1);

    // Expose the already-rendered dormant modal only inside
    // the test so Axe can evaluate its controls.
    // This does not click the opener or alter MODAL_ATIVO.
    await modal.evaluate(
      (
        element,
      ) => {
        element.style.display =
          "flex";
      },
    );

    const accessibility =
      await new AxeBuilder({
        page,
      })
        .withRules([
          "label",
          "select-name",
        ])
        .analyze();

    expect(
      accessibility.violations,
    ).toEqual([]);

    // Runtime test exposure is ephemeral; source behavior
    // remains disabled.
    await modal.evaluate(
      (
        element,
      ) => {
        element.style.display =
          "none";
      },
    );

    await expect(modal).toHaveCSS(
      "display",
      "none",
    );
  },
);
