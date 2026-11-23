import type { Metadata } from "next";
import { chatGPTSignOutPath, getChatGPTUser, requireChatGPTUser } from "../../../chatgpt-auth";
import { isInquiryAdminEmail } from "../../../inquiry-admin-access";
import InquiryRecord from "./inquiry-record";
import "../inquiries.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "需求內容｜問卷管理中心",
  description: "查看並管理單筆客戶設計需求。",
};

export default function InquiryRecordPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProtectedInquiryRecord paramsPromise={params} />;
}

async function ProtectedInquiryRecord({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const returnTo = `/admin/inquiries/${encodeURIComponent(id)}`;
  const previewMode = process.env.NODE_ENV !== "production";
  const user = previewMode
    ? await getChatGPTUser() ?? { displayName: "Sam", email: "preview@local" }
    : await requireChatGPTUser(returnTo);

  if (!previewMode && !isInquiryAdminEmail(user.email)) {
    return (
      <main className="admin-access-denied">
        <span className="admin-brand-mark">S</span>
        <p>PRIVATE WORKSPACE</p>
        <h1>這個管理頁面是私人空間</h1>
        <span>目前登入的帳號沒有管理權限。請改用已授權的 Sam Design Studio 管理帳號。</span>
        <a href={chatGPTSignOutPath(returnTo)}>切換登入帳號</a>
      </main>
    );
  }

  return <InquiryRecord inquiryId={id} displayName={user.displayName} />;
}
