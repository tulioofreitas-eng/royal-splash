import {
  expect,
  test,
} from "@playwright/test";

test(
  "unpublished or nonexistent Case slug has no public detail route or fixture leakage",
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

    for (const fixtureContent of [
      "Controlled Case Fixture",
      "Fixture used only by tests.",
      "Controlled fixture narrative.",
    ]) {
      expect(
        body,
      ).not.toContain(
        fixtureContent,
      );
    }
  },
);
