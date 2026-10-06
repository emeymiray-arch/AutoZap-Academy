import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSessionToken, verifySessionToken } from "./session-token";

describe("session-token", () => {
  it("signs and verifies a valid token", async () => {
    process.env.SESSION_SECRET = "test-secret-at-least-thirty-two-chars!!";
    const token = await createSessionToken("user-1", 0);
    const payload = await verifySessionToken(token);
    assert.ok(payload);
    assert.equal(payload.sub, "user-1");
    assert.equal(payload.v, 0);
  });

  it("rejects tampered tokens and raw user ids", async () => {
    process.env.SESSION_SECRET = "test-secret-at-least-thirty-two-chars!!";
    const token = await createSessionToken("user-1", 1);
    assert.equal(await verifySessionToken(token + "x"), null);
    assert.equal(await verifySessionToken("admin-demo-001"), null);
    assert.equal(await verifySessionToken("user-1"), null);
  });
});
