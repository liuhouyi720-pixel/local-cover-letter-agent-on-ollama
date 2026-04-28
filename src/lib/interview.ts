import { parseJsonWithRepairs } from "./validate";

export type InterviewTips = {
  focus_areas: string[];
  jd_priorities: string[];
  experience_to_emphasize: string[];
  interview_tips: string[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseAndValidateInterviewTips(raw: string):
  | { ok: true; data: InterviewTips }
  | { ok: false; error: string } {
  const parsed = parseJsonWithRepairs(raw);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  if (!parsed.parsed || typeof parsed.parsed !== "object" || Array.isArray(parsed.parsed)) {
    return { ok: false, error: "Interview output must be an object." };
  }

  const obj = parsed.parsed as Record<string, unknown>;
  if (!isStringArray(obj.focus_areas)) {
    return { ok: false, error: "focus_areas must be a string array." };
  }
  if (!isStringArray(obj.jd_priorities)) {
    return { ok: false, error: "jd_priorities must be a string array." };
  }
  if (!isStringArray(obj.experience_to_emphasize)) {
    return { ok: false, error: "experience_to_emphasize must be a string array." };
  }
  if (!isStringArray(obj.interview_tips)) {
    return { ok: false, error: "interview_tips must be a string array." };
  }

  return { ok: true, data: obj as InterviewTips };
}
