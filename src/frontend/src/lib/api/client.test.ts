import { describe, expect, it } from "vitest";

import { ApiError } from "./client";

describe("ApiError", () => {
  it("preserves the HTTP status and message", () => {
    const error = new ApiError("Not found", 404);

    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
  });
});
