"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import {
  canCreateCaseComment,
  commentVisibilities,
  type CommentAccessCase,
} from "@/lib/comments/comment-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CommentActionState = {
  ok: boolean;
  message: string;
};

const addCommentSchema = z.object({
  caseId: z.uuid(),
  body: z.string().trim().min(1, "Comment cannot be empty.").max(4000),
  visibility: z.enum(commentVisibilities),
  fileId: z.uuid().optional().nullable(),
});

type CommentCaseRow = {
  id: string;
  lab_id: string;
  case_number: string;
  assigned_technician_id: string | null;
  doctors: { profile_id: string | null } | null;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function addCaseCommentAction(
  formData: FormData,
): Promise<CommentActionState> {
  const session = await requireAuth();

  if (!session.activeLabId) {
    return { ok: false, message: "No active lab was found for this user." };
  }

  const parsed = addCommentSchema.safeParse({
    caseId: getString(formData, "caseId"),
    body: getString(formData, "body"),
    visibility: getString(formData, "visibility"),
    fileId: getString(formData, "fileId") || null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid comment.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: item, error: caseError } = await supabase
    .from("cases")
    .select("id, lab_id, case_number, assigned_technician_id, doctors(profile_id)")
    .eq("lab_id", session.activeLabId)
    .eq("id", parsed.data.caseId)
    .maybeSingle<CommentCaseRow>();

  if (caseError) return { ok: false, message: caseError.message };
  if (!item) return { ok: false, message: "Case was not found." };

  const accessCase: CommentAccessCase = {
    doctorProfileId: item.doctors?.profile_id ?? null,
    assignedTechnicianId: item.assigned_technician_id,
  };
  const visibility =
    accessCase.doctorProfileId === session.userId
      ? "doctor_visible"
      : parsed.data.visibility;

  if (
    !canCreateCaseComment({
      roles: session.roles,
      userId: session.userId,
      item: accessCase,
      visibility,
    })
  ) {
    return { ok: false, message: "You cannot comment on this case." };
  }

  if (parsed.data.fileId) {
    const { data: file, error: fileError } = await supabase
      .from("case_files")
      .select("id")
      .eq("lab_id", session.activeLabId)
      .eq("case_id", item.id)
      .eq("id", parsed.data.fileId)
      .maybeSingle<{ id: string }>();

    if (fileError) return { ok: false, message: fileError.message };
    if (!file) return { ok: false, message: "Attached file was not found." };
  }

  const { data: comment, error: commentError } = await supabase
    .from("case_comments")
    .insert({
      lab_id: session.activeLabId,
      case_id: item.id,
      author_id: session.userId,
      body: parsed.data.body,
      visibility,
      file_id: parsed.data.fileId ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (commentError) return { ok: false, message: commentError.message };

  const { error: timelineError } = await supabase.from("case_timeline").insert({
    lab_id: session.activeLabId,
    case_id: item.id,
    actor_id: session.userId,
    event_type: "comment_added",
    title:
      visibility === "internal"
        ? "Internal comment added."
        : "Doctor-visible comment added.",
    metadata: {
      comment_id: comment.id,
      visibility,
      file_id: parsed.data.fileId ?? null,
    },
  });

  if (timelineError) return { ok: false, message: timelineError.message };

  revalidatePath(`/cases/${item.id}`);
  revalidatePath("/doctor-portal");

  return { ok: true, message: "Comment added." };
}
