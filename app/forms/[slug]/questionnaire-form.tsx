"use client";

import { FormEvent, useMemo, useState } from "react";
import type { QuestionnaireQuestion } from "../../questionnaire-types";

type AnswerValue = string | string[];

function QuestionField({ question, value, onChange }: { question: QuestionnaireQuestion; value: AnswerValue; onChange: (value: AnswerValue) => void }) {
  const inputId = `question-${question.id}`;
  if (question.type === "long") {
    return <textarea id={inputId} rows={5} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder="請輸入您的回答" />;
  }
  if (question.type === "date") {
    return <input id={inputId} type="date" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} />;
  }
  if (question.type === "dropdown") {
    return (
      <select id={inputId} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">請選擇</option>
        {question.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }
  if (question.type === "single") {
    return (
      <div className="public-choice-list" role="radiogroup" aria-labelledby={`${inputId}-label`}>
        {question.options.map((option) => (
          <label key={option}><input type="radio" name={inputId} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{option}</span></label>
        ))}
      </div>
    );
  }
  if (question.type === "multiple") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="public-choice-list" aria-labelledby={`${inputId}-label`}>
        {question.options.map((option) => (
          <label key={option}><input type="checkbox" value={option} checked={selected.includes(option)} onChange={(event) => onChange(event.target.checked ? [...selected, option] : selected.filter((item) => item !== option))} /><span>{option}</span></label>
        ))}
      </div>
    );
  }
  return <input id={inputId} type="text" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder="請輸入您的回答" />;
}

export default function QuestionnaireForm({ slug, title, description, questions, thankYouMessage }: {
  slug: string;
  title: string;
  description: string;
  questions: QuestionnaireQuestion[];
  thankYouMessage: string;
}) {
  const [respondentName, setRespondentName] = useState("");
  const [respondentContact, setRespondentContact] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const answeredCount = useMemo(() => questions.filter((question) => {
    const value = answers[question.id];
    return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
  }).length, [answers, questions]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch(`/api/forms/${encodeURIComponent(slug)}/responses`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ respondentName, respondentContact, answers, website: formData.get("website") }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "送出失敗，請稍後再試。");
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "送出失敗，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="public-form-shell public-form-complete">
        <section>
          <span className="complete-mark">✓</span>
          <p>已成功送出</p>
          <h1>謝謝您的填寫</h1>
          <span>{thankYouMessage}</span>
        </section>
      </main>
    );
  }

  return (
    <main className="public-form-shell">
      <form className="public-form-card" onSubmit={submit}>
        <header>
          <span className="public-form-brand">SA DESIGN</span>
          <p>QUESTIONNAIRE</p>
          <h1>{title}</h1>
          {description && <span>{description}</span>}
          <div
            className="public-form-progress"
            role="progressbar"
            aria-label="填寫進度"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={answeredCount}
          ><i style={{ width: `${questions.length ? Math.round(answeredCount / questions.length * 100) : 100}%` }} /></div>
        </header>

        <section className="public-form-contact" aria-labelledby="contact-title">
          <div><span>基本資料</span><h2 id="contact-title">方便我們與您聯絡</h2></div>
          <label><span>您的姓名 <b>必填</b></span><input value={respondentName} onChange={(event) => setRespondentName(event.target.value)} required placeholder="請輸入姓名或稱呼" /></label>
          <label><span>聯絡方式 <b>必填</b></span><input value={respondentContact} onChange={(event) => setRespondentContact(event.target.value)} required placeholder="Email、LINE ID 或電話" /></label>
          <input className="public-form-honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        </section>

        <section className="public-question-list" aria-label="問卷問題">
          {questions.map((question, index) => (
            <article className="public-question" key={question.id}>
              <label id={`question-${question.id}-label`} htmlFor={!['single', 'multiple'].includes(question.type) ? `question-${question.id}` : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{question.label}{question.required && <b>必填</b>}</strong>
              </label>
              {question.helpText && <p>{question.helpText}</p>}
              <QuestionField question={question} value={answers[question.id] ?? (question.type === "multiple" ? [] : "")} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />
            </article>
          ))}
        </section>

        {error && <p className="public-form-error" role="alert">{error}</p>}
        <footer>
          <span>送出前請確認聯絡方式是否正確。</span>
          <button type="submit" disabled={submitting}>{submitting ? "正在送出…" : "送出問卷"}</button>
        </footer>
      </form>
    </main>
  );
}
