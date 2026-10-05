import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createOAuthState,
  decryptToken,
  encryptToken,
  getAuthorizationUrl,
  verifyOAuthState,
} from "../lib/meta/oauth";

beforeEach(() => {
  vi.stubEnv("NEXTAUTH_SECRET", "test-secret-with-enough-length");
  vi.stubEnv(
    "ENCRYPTION_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  );
});

describe("OAuth state and token encryption", () => {
  it("round-trips encrypted tokens", () => {
    const encrypted = encryptToken("long-lived-token");
    expect(encrypted).not.toBe("long-lived-token");
    expect(decryptToken(encrypted)).toBe("long-lived-token");
  });

  it("signs and verifies Instagram OAuth state", () => {
    const state = createOAuthState("workspace_123");
    expect(verifyOAuthState(state)?.workspaceId).toBe("workspace_123");
  });

  it("rejects tampered OAuth state", () => {
    const state = createOAuthState("workspace_123");
    expect(verifyOAuthState(`${state}tampered`)).toBeNull();
  });
});

describe("Instagram authorization URL", () => {
  it("forces the login screen so a second account can be connected", () => {
    vi.stubEnv("INSTAGRAM_APP_ID", "123");
    const url = new URL(getAuthorizationUrl("https://example.com/api/instagram/callback", "state"));
    expect(url.searchParams.get("force_reauth")).toBe("true");
  });
});
