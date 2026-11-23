import type { Metadata } from "next";
import { chatGPTSignOutPath, getChatGPTUser, requireChatGPTUser } from "../../chatgpt-auth";
import { isInquiryAdminEmail } from "../../inquiry-admin-access";
import QuestionnaireDashboard from "./questionnaire-dashboard";
import "../inquiries/inquiries.css";
import "./forms.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "問卷管理｜Sam Design Studio",
  description: "建立、發布並整理問卷回覆。",
};

export default async function QuestionnaireManagementPage() {
  const previewMode = process.env.NODE_ENV !== "production";
  const user = previewMode
    ? await getChatGPTUser() ?? { displayName: "Sam", email: "preview@local" }
    : await requireChatGPTUser("/admin/forms");
  if (!previewMode && !isInquiryAdminEmail(user.email)) {
    return (
      <main className="admin-access-denied">
        <span className="admin-brand-mark">S</span>
        <p>PRIVATE WORKSPACE</p>
        <h1>這個管理頁面是私人空間</h1>
        <span>目前登入的帳號沒有管理權限。請改用已授權的 Sam Design Studio 管理帳號。</span>
        <a href={chatGPTSignOutPath("/admin/forms")}>切換登入帳號</a>
      </main>
    );
  }
  return <QuestionnaireDashboard displayName={user.displayName} />;
}
