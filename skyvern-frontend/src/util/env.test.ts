import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv(
  apiKey: string | null = null,
  keyVar: "VITE_ARGIDE_API_KEY" | "VITE_SKYVERN_API_KEY" = "VITE_ARGIDE_API_KEY",
) {
  vi.resetModules();
  vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8000/api/v1");
  vi.stubEnv("VITE_ARTIFACT_API_BASE_URL", "http://localhost:9090");
  vi.stubEnv("VITE_ENVIRONMENT", "test");
  vi.stubEnv("VITE_WSS_BASE_URL", "ws://localhost:8000/api/v1");
  vi.stubEnv(keyVar, apiKey ?? "");
  return import("./env");
}

describe("getCredentialParam", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("includes the runtime API key even when a token getter returns a token", async () => {
    const { getCredentialParam } = await loadEnv("local+api/key");

    const params = new URLSearchParams(
      await getCredentialParam(async () => "clerk token"),
    );

    expect(params.get("apikey")).toBe("local+api/key");
    expect(params.get("token")).toBe("Bearer clerk token");
  });

  it("falls back to the legacy VITE_SKYVERN_API_KEY when VITE_ARGIDE_API_KEY is unset", async () => {
    const { getCredentialParam } = await loadEnv(
      "legacy+api/key",
      "VITE_SKYVERN_API_KEY",
    );

    const params = new URLSearchParams(
      await getCredentialParam(async () => "clerk token"),
    );

    expect(params.get("apikey")).toBe("legacy+api/key");
  });

  it("uses the token when no runtime API key is available", async () => {
    const { getCredentialParam } = await loadEnv();

    const params = new URLSearchParams(
      await getCredentialParam(async () => "clerk token"),
    );

    expect(params.has("apikey")).toBe(false);
    expect(params.get("token")).toBe("Bearer clerk token");
  });
});

describe("browserStreamingMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("preserves VNC behavior when no streaming mode is configured", async () => {
    const { browserStreamingMode } = await loadEnv();

    expect(browserStreamingMode).toBe("vnc");
  });

  it("uses the configured streaming mode when present", async () => {
    vi.stubEnv("VITE_BROWSER_STREAMING_MODE", "CDP");

    const { browserStreamingMode } = await loadEnv();

    expect(browserStreamingMode).toBe("cdp");
  });
});
