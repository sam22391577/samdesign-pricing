import { getInquiryAdmin } from "../../inquiry-admin-access";

export async function canManageInquiries() {
  if (process.env.NODE_ENV !== "production") return true;
  return Boolean(await getInquiryAdmin());
}

export function unauthorizedResponse() {
  return Response.json({ error: "請先登入管理帳號。" }, { status: 401 });
}
