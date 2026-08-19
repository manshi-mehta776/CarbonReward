import { PostHog } from "posthog-node";
import { env } from "./env.js";

export const posthog = env.POSTHOG_API_KEY
  ? new PostHog(env.POSTHOG_API_KEY, { host: env.POSTHOG_HOST })
  : null;

// Central event names — keep in sync with the PostHog tracking plan in the README.
export const AnalyticsEvent = {
  USER_REGISTERED: "user_registered",
  WALLET_CONNECTED: "wallet_connected",
  CAMPAIGN_CREATED: "campaign_created",
  CAMPAIGN_JOINED: "campaign_joined",
  PROOF_UPLOADED: "proof_uploaded",
  VERIFICATION_COMPLETED: "verification_completed",
  REWARD_CLAIMED: "reward_claimed",
  FEEDBACK_SUBMITTED: "feedback_submitted",
} as const;

export function track(
  distinctId: string,
  event: (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent],
  properties?: Record<string, unknown>
): void {
  posthog?.capture({ distinctId, event, properties });
}
