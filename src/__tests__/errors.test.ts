import { normalizeError, ClickUpApiError } from "../http/errors.js";

describe("normalizeError", () => {
  it("preserves the HTTP status and ClickUp error body from an axios error", () => {
    const axiosErr = {
      isAxiosError: true,
      message: "Request failed with status code 401",
      response: {
        status: 401,
        data: { err: "Team not authorized", ECODE: "OAUTH_027" },
      },
    };
    const err = normalizeError(axiosErr, "GET", "/v2/task/x");

    expect(err).toBeInstanceOf(ClickUpApiError);
    expect(err.status).toBe(401);
    expect(err.message).toContain("HTTP 401");
    expect(err.message).toContain("Team not authorized");

    const details = err.toDetails();
    expect(details.status).toBe(401);
    expect(details.clickupError).toBe("Team not authorized");
    expect(details.endpoint).toBe("/v2/task/x");
    expect(details.method).toBe("GET");
  });

  it("handles plain (non-axios) errors without a status", () => {
    const err = normalizeError(new Error("boom"), "POST", "/v2/x");
    expect(err.status).toBeUndefined();
    expect(err.message).toContain("boom");
    expect(err.endpoint).toBe("/v2/x");
  });
});
