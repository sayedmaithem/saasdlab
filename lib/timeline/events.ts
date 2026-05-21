export const timelineEventTypes = [
  "created",
  "updated",
  "stage_changed",
  "comment_added",
  "file_uploaded",
  "design_submitted",
  "approval_updated",
  "qc_recorded",
  "invoice_created",
  "payment_recorded",
  "delivery_updated",
  "remake_created",
] as const;

export type TimelineEventType = (typeof timelineEventTypes)[number];

export const timelineEventLabels: Record<TimelineEventType, string> = {
  created: "Case created",
  updated: "Updated",
  stage_changed: "Stage changed",
  comment_added: "Comment added",
  file_uploaded: "File uploaded",
  design_submitted: "Design uploaded",
  approval_updated: "Design approval",
  qc_recorded: "Quality control",
  invoice_created: "Invoice created",
  payment_recorded: "Payment received",
  delivery_updated: "Delivery updated",
  remake_created: "Remake created",
};

export function isTimelineEventType(value: string): value is TimelineEventType {
  return timelineEventTypes.includes(value as TimelineEventType);
}
