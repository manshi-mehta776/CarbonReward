import { describe, it, expect, vi } from "vitest";

// Lightweight smoke test that doesn't require a live MongoDB connection —
// full integration tests (auth, campaigns, participation) live alongside
// this file and use mongodb-memory-server; see README "Testing" section.
vi.mock("../config/database.js", () => ({ connectDatabase: vi.fn() }));

describe("health endpoint", () => {
  it("responds with ok status", async () => {
    const { createApp } = await import("../app.js");
    const request = (await import("supertest")).default;
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
