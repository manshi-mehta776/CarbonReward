import posthog from "posthog-js";

const key = import.meta.env.VITE_POSTHOG_KEY;

export function initAnalytics(): void {
  if (!key) return;
  posthog.init(key, { api_host: import.meta.env.VITE_POSTHOG_HOST ?? "https://app.posthog.com" });
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!key) return;
  posthog.capture(event, properties);
}
