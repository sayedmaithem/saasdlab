-- LabFlow 0020: Add type, priority, and action_url columns to notifications.
-- These are additive (nullable / with defaults), safe to apply on existing data.

alter table public.notifications
  add column if not exists type text not null default 'general',
  add column if not exists priority text not null default 'normal',
  add column if not exists action_url text;

-- Index for filtering by type (useful for future notification-center filters)
create index if not exists notifications_lab_recipient_type_idx
  on public.notifications (lab_id, recipient_id, type, created_at desc);

comment on column public.notifications.type is
  'Notification kind. Known values: general, missing_file, doctor_approval, stage_overdue, qc_required, delivery_ready, design_approved, design_rejected, case_blocked, new_comment, assignment';

comment on column public.notifications.priority is
  'Notification urgency. Values: normal, high, critical';

comment on column public.notifications.action_url is
  'Optional deep link to the relevant page (e.g. /cases/<id>)';
