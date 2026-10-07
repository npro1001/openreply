import { afterEach, describe, expect, it, vi } from "vitest";
import {
  describeMetaError,
  MetaApiError,
  PermissionError,
  RateLimitError,
  sendPrivateReply,
} from "../lib/meta/client";

function metaError(error: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ error }), { status: 400 }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Meta API errors", () => {
  it("keeps the subcode, Meta's explanation and the trace ID", async () => {
    metaError({
      message: "The thread owner has archived or deleted this conversation, or the thread does not exist.",
      type: "OAuthException",
      code: 100,
      error_subcode: 2534014,
      error_user_title: "Message failed to send",
      error_user_msg: "This person isn't available right now.",
      fbtrace_id: "AbCdEf",
    });

    const error = await sendPrivateReply("token", "acct", "comment", "hi").catch((e) => e);

    expect(error).toBeInstanceOf(PermissionError);
    expect(error.code).toBe(100);
    expect(error.subcode).toBe(2534014);
    expect(error.fbTraceId).toBe("AbCdEf");
    expect(describeMetaError(error)).toBe(
      "Meta API Error 100/2534014: The thread owner has archived or deleted this conversation, or the thread does not exist. (Message failed to send: This person isn't available right now.) [trace AbCdEf]"
    );
  });

  it("reports the code Meta sent, not the group's default", async () => {
    metaError({ message: "Application request limit reached", type: "OAuthException", code: 4 });
    const error = await sendPrivateReply("token", "acct", "comment", "hi").catch((e) => e);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.code).toBe(4);
  });

  it("stays short when Meta gives no extra detail", () => {
    expect(describeMetaError(new MetaApiError(1, undefined, undefined, "Unknown error"))).toBe(
      "Meta API Error 1: Unknown error"
    );
  });
});
