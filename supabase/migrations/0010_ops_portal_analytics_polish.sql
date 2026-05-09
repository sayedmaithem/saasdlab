alter type public.invoice_status add value if not exists 'overdue';
alter type public.invoice_status add value if not exists 'cancelled';
alter type public.payment_method add value if not exists 'other';
alter type public.delivery_status add value if not exists 'assigned_to_delivery';
alter type public.delivery_status add value if not exists 'failed_delivery';

alter table public.deliveries
  add column if not exists doctor_id uuid references public.doctors(id) on delete set null,
  add column if not exists clinic_id uuid references public.clinics(id) on delete set null,
  add column if not exists delivery_person_id uuid references public.profiles(id) on delete set null,
  add column if not exists out_at timestamptz,
  add column if not exists recipient_name text,
  add column if not exists failure_reason text;

alter table public.labs
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists currency text not null default 'USD',
  add column if not exists logo_file_id uuid references public.case_files(id) on delete set null;

alter table public.app_settings
  add column if not exists settings jsonb not null default '{}'::jsonb;

create index if not exists deliveries_lab_status_idx
on public.deliveries (lab_id, delivery_status, created_at desc);

create index if not exists invoices_lab_status_due_idx
on public.invoices (lab_id, status, due_date);

create index if not exists payment_allocations_lab_payment_idx
on public.payment_allocations (lab_id, payment_id);
