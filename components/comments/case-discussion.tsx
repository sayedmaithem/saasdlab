"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send } from "lucide-react";
import { addCaseCommentAction } from "@/app/actions/comments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  commentVisibilityLabels,
  type CommentVisibility,
} from "@/lib/comments/comment-permissions";
import type { CaseCommentItem, CaseFileItem } from "@/lib/data/cases";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleLabel(role: string | null) {
  return role ? role.replaceAll("_", " ") : "system";
}

export function CaseDiscussion({
  caseId,
  comments,
  files,
  canCreateComment,
  allowedVisibilities,
}: {
  caseId: string;
  comments: CaseCommentItem[];
  files: CaseFileItem[];
  canCreateComment: boolean;
  allowedVisibilities: CommentVisibility[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultVisibility = allowedVisibilities[0] ?? "internal";

  function submitComment(formData: FormData) {
    startTransition(async () => {
      const result = await addCaseCommentAction(formData);
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-5">
      {canCreateComment ? (
        <form action={submitComment} className="space-y-3 rounded-lg border bg-card p-4">
          <input type="hidden" name="caseId" value={caseId} />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comment-visibility">Visibility</Label>
              <Select
                id="comment-visibility"
                name="visibility"
                defaultValue={defaultVisibility}
              >
                {allowedVisibilities.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {commentVisibilityLabels[visibility]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment-file">File reference</Label>
              <Select id="comment-file" name="fileId" defaultValue="">
                <option value="">No file reference</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.fileName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment-body">Comment</Label>
            <Textarea
              id="comment-body"
              name="body"
              placeholder="Write a case comment"
              className="min-h-28"
              required
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Plain text now. TODO: add @mentions and notification routing later.
            </p>
            <Button type="submit" disabled={isPending}>
              <Send />
              Add comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          You can view permitted case discussion for this role.
        </div>
      )}

      {message ? (
        <div className="rounded-lg border bg-background p-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="space-y-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{comment.authorName}</p>
                    <Badge tone="neutral">{roleLabel(comment.authorRole)}</Badge>
                    <Badge
                      tone={comment.visibility === "internal" ? "amber" : "blue"}
                    >
                      {commentVisibilityLabels[comment.visibility]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                {comment.fileName ? (
                  <Badge tone="neutral">{comment.fileName}</Badge>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                {comment.body}
              </p>
            </article>
          ))
        ) : (
          <div className="flex items-center gap-2 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
            <MessageSquare className="size-4" />
            <p>No comments yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
