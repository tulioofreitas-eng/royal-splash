import {
  expect,
  test,
} from "@playwright/test";

test(
  "unpublished or nonexistent Case slug has no public detail route",
  async ({
    request,
  }) => {
    const response =
      await request.get(
        "/projetos/controlled-case-fixture",
        {
          maxRedirects: 0,
        },
      );

    expect(
      response.status(),
    ).toBe(404);

    const body =
      await response.text();

    expect(
      body,
    ).not.toContain(
      "Controlled Case Fixture",
    );
  },
);
