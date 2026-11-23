import type { Metadata } from "next";
import { getD1 } from "../../../db";
import { parseQuestionnaireQuestions } from "../../questionnaire-types";
import QuestionnaireForm from "./questionnaire-form";
import "./forms.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "需求問卷｜Sam Design Studio",
  description: "填寫需求問卷，讓我們更快了解您的想法。",
};

type QuestionnaireRow = {
  slug: string;
  title: string;
  description: string;
  questionsJson: string;
  thankYouMessage: string;
  status: string;
};

export default async function PublicQuestionnairePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let questionnaire: QuestionnaireRow | null = null;
  try {
    questionnaire = await getD1().prepare(`SELECT
      slug,
      title,
      description,
      questions_json AS questionsJson,
      thank_you_message AS thankYouMessage,
      status
      FROM questionnaires
      WHERE slug = ?`).bind(slug).first<QuestionnaireRow>();
  } catch {
    questionnaire = null;
  }

  if (!questionnaire || questionnaire.status !== "published") {
    return (
      <main className="public-form-shell public-form-unavailable">
        <section>
          <span className="public-form-brand">SA DESIGN</span>
          <p>QUESTIONNAIRE</p>
          <h1>這份問卷目前沒有開放填寫</h1>
          <span>可能尚未發布或已經結束收件，請向問卷提供者確認最新連結。</span>
        </section>
      </main>
    );
  }

  return (
    <QuestionnaireForm
      slug={questionnaire.slug}
      title={questionnaire.title}
      description={questionnaire.description}
      questions={parseQuestionnaireQuestions(questionnaire.questionsJson)}
      thankYouMessage={questionnaire.thankYouMessage}
    />
  );
}
