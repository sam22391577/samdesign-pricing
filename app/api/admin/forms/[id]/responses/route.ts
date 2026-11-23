import { getD1 } from "../../../../../../db";
import { canManageInquiries, unauthorizedResponse } from "../../../../inquiries/access";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canManageInquiries())) return unauthorizedResponse();
  try {
    const { id } = await context.params;
    const result = await getD1().prepare(`SELECT
      id,
      questionnaire_id AS questionnaireId,
      submitted_at AS submittedAt,
      respondent_name AS respondentName,
      respondent_contact AS respondentContact,
      answers_json AS answersJson,
      status,
      note
      FROM questionnaire_responses
      WHERE questionnaire_id = ?
      ORDER BY submitted_at DESC
      LIMIT 500`).bind(id).all();
    return Response.json({ responses: result.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法讀取問卷回覆。" }, { status: 500 });
  }
}
