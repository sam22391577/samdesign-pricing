import { env, waitUntil } from "cloudflare:workers";

type InquiryNotificationPayload = {
  id: string;
  submittedAt: string;
  clientName: string;
  company: string;
  projectType: string;
  services: string[];
  estimateLow: number;
  estimateHigh: number;
  adminUrl: string;
};

type NotificationEnv = {
  GMAIL_NOTIFICATION_WEBHOOK_URL?: string;
};

async function sendInquiryNotification(payload: InquiryNotificationPayload) {
  const webhookUrl = (env as unknown as NotificationEnv).GMAIL_NOTIFICATION_WEBHOOK_URL?.trim();
  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null;
  if (!response.ok || result?.ok !== true) {
    throw new Error(result?.error || `Gmail notification failed with status ${response.status}.`);
  }
}

export function scheduleInquiryNotification(payload: InquiryNotificationPayload) {
  waitUntil(sendInquiryNotification(payload).catch((error) => {
    console.error("Unable to send inquiry notification.", error);
  }));
}
