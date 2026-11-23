import { getChatGPTUser } from "./chatgpt-auth";

function allowedAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isInquiryAdminEmail(email: string) {
  return allowedAdminEmails().includes(email.trim().toLowerCase());
}

export async function getInquiryAdmin() {
  const user = await getChatGPTUser();
  if (!user || !isInquiryAdminEmail(user.email)) return null;
  return user;
}
