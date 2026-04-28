export type CoverLetterTemplateFields = {
  sender_name: string;
  sender_contact_line: string;
  sender_location_line: string;
  date_line: string;
  recipient_name: string;
  recipient_company: string;
  recipient_address_lines: string[];
  salutation: string;
  body_paragraphs: string[];
  closing_line: string;
  signature_name: string;
};

export type ExportRequest = {
  outputFolder: string;
  companyName: string;
  jobTitle: string;
  date: string;
  templateDocxPath: string;
  coverLetter: string;
  fields: CoverLetterTemplateFields;
};

export type ExportResponse = {
  ok: boolean;
  filename: string;
  pdfPath: string;
  docxPath: string;
  txtPath: string;
};

const EXPORT_HELPER_URL = "http://127.0.0.1:3031";

export async function saveCoverLetterWithHelper(payload: ExportRequest): Promise<ExportResponse> {
  let response: Response;
  try {
    response = await fetch(`${EXPORT_HELPER_URL}/save-cover-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error(
      "Cannot reach local export helper (http://127.0.0.1:3031). Start it with `npm run export-helper` and try again."
    );
  }

  const data = (await response.json()) as Partial<ExportResponse> & { error?: string };

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Export helper HTTP ${response.status}`);
  }

  return data as ExportResponse;
}

function isDateLike(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return (
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed) ||
    /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ||
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)/i.test(trimmed)
  );
}

export function buildTemplateFieldsFromDraft(params: {
  draftText: string;
  companyName?: string;
  dateLine: string;
  applicantName?: string;
  applicantContactLine?: string;
  applicantLocationLine?: string;
  signatureName?: string;
}): CoverLetterTemplateFields {
  const normalized = params.draftText.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n").map((line) => line.trim());
  const nonEmptyLines = lines.filter(Boolean);

  const senderName = nonEmptyLines[0] || params.applicantName?.trim() || "Your Name";
  const senderContact = nonEmptyLines[1] || params.applicantContactLine?.trim() || "";

  const candidateDate = nonEmptyLines[2] || "";
  const dateLine = isDateLike(candidateDate) ? candidateDate : params.dateLine;

  const salutationIndex = nonEmptyLines.findIndex((line) => /^dear\b/i.test(line));
  const salutation = salutationIndex >= 0 ? nonEmptyLines[salutationIndex] : "Dear Hiring Manager,";

  const recipientLines =
    salutationIndex > 3 ? nonEmptyLines.slice(3, salutationIndex).filter(Boolean) : [];

  const recipientName = recipientLines[0] || "";
  const recipientCompany = params.companyName?.trim() || recipientLines[1] || "";
  const recipientAddressLines = recipientLines.slice(2).filter(Boolean);

  const closingPattern = /^(sincerely|best regards|regards|thank you)/i;
  const closingLineIndex = nonEmptyLines.findIndex((line) => closingPattern.test(line));
  const signatureName =
    closingLineIndex >= 0 && nonEmptyLines[closingLineIndex + 1]
      ? nonEmptyLines[closingLineIndex + 1]
      : params.signatureName?.trim() || senderName;
  const closingLine = closingLineIndex >= 0 ? nonEmptyLines[closingLineIndex] : "Sincerely,";

  let bodyStartInRaw = normalized.indexOf(salutation);
  if (bodyStartInRaw >= 0) {
    bodyStartInRaw += salutation.length;
  } else {
    bodyStartInRaw = 0;
  }
  let bodyRaw = normalized.slice(bodyStartInRaw).trim();
  if (closingLineIndex >= 0) {
    const closingLineText = nonEmptyLines[closingLineIndex];
    const closingPos = bodyRaw.lastIndexOf(closingLineText);
    if (closingPos >= 0) {
      bodyRaw = bodyRaw.slice(0, closingPos).trim();
    }
  }

  const bodyParagraphs = bodyRaw
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    sender_name: senderName,
    sender_contact_line: senderContact,
    sender_location_line: params.applicantLocationLine?.trim() || "",
    date_line: dateLine,
    recipient_name: recipientName,
    recipient_company: recipientCompany,
    recipient_address_lines: recipientAddressLines,
    salutation,
    body_paragraphs: bodyParagraphs,
    closing_line: closingLine,
    signature_name: signatureName
  };
}


