import { NextRequest, NextResponse } from "next/server";
import { SheetRowSchema, type SheetRow } from "@/types/sheet";
import { generateReportFromRow } from "@/lib/openai";
import { generateDocxBuffer } from "@/lib/docx";
import { ensureChildFolder, uploadDocxBufferToDrive } from "@/lib/drive";

const PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
const SHARED_TOKEN = process.env.MAKE_WEBHOOK_TOKEN; // optional

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 120);
}

async function parseRow(req: NextRequest): Promise<SheetRow> {
  const body = await req.json().catch(() => ({}));
  // Accept either { row: {...} } or flat payload
  const candidate = body?.row ?? body ?? {};

  // Map common Make/Sheets field names if needed
  const mapped = {
    id: candidate.id ?? candidate.ID ?? candidate.rowId,
    title: candidate.title ?? candidate.Title ?? candidate.name ?? candidate.subject,
    summary: candidate.summary ?? candidate.Summary ?? candidate.desc ?? candidate.description,
    details: candidate.details ?? candidate.Details ?? candidate.content ?? candidate.notes,
    category: candidate.category ?? candidate.Category,
    language: candidate.language ?? candidate.lang,
    temperature: candidate.temperature,
  };

  const parsed = SheetRowSchema.safeParse(mapped);
  if (!parsed.success) {
    throw new Error("Invalid payload: " + parsed.error.issues.map(i => i.message).join(", "));
  }
  return parsed.data;
}

export async function POST(req: NextRequest) {
  try {
    if (SHARED_TOKEN) {
      const token =
        req.headers.get("x-webhook-token") ||
        new URL(req.url).searchParams.get("token");
      if (token !== SHARED_TOKEN) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const row = await parseRow(req);
    const report = await generateReportFromRow(row);
    const docBuffer = await generateDocxBuffer({
      title: report.title,
      contentMarkdown: `# ${report.title}\n\n${report.content}`,
    });

    let uploaded:
      | { fileId: string; webViewLink?: string; webContentLink?: string }
      | undefined;
    if (PARENT_FOLDER_ID) {
      const categoryFolderId = await ensureChildFolder(
        PARENT_FOLDER_ID,
        report.category
      );
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const filename = sanitizeFileName(`${report.title} - ${timestamp}.docx`);
      uploaded = await uploadDocxBufferToDrive({
        buffer: docBuffer,
        fileName: filename,
        parentFolderId: categoryFolderId,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        input: row,
        report: {
          title: report.title,
          category: report.category,
          length: report.content.length,
        },
        drive: uploaded ?? null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unexpected error" },
      { status: 400 }
    );
  }
}
