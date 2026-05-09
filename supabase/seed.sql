-- LabFlow local development seed data.
-- Intended for Supabase local/dev only. Do not run against production.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@labflow.local', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lab Owner"}', now(), now()),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@labflow.local', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lab Manager"}', now(), now()),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'technician@labflow.local', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mina Technician"}', now(), now()),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'doctor@labflow.local', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Zain Kareem"}', now(), now()),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'accountant@labflow.local', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Accountant"}', now(), now())
on conflict (id) do nothing;

insert into public.labs (id, name, slug, timezone)
values ('20000000-0000-4000-8000-000000000001', 'LabFlow Demo Dental Lab', 'labflow-demo', 'Asia/Baghdad')
on conflict (id) do update set name = excluded.name;

insert into public.profiles (id, lab_id, full_name, email, phone, role, is_active)
values
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Lab Owner', 'owner@labflow.local', '+964770000001', 'lab_owner', true),
  ('10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Lab Manager', 'manager@labflow.local', '+964770000002', 'lab_manager', true),
  ('10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Mina Technician', 'technician@labflow.local', '+964770000003', 'technician', true),
  ('10000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'Dr. Zain Kareem', 'doctor@labflow.local', '+964770000004', 'doctor', true),
  ('10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'Accountant', 'accountant@labflow.local', '+964770000005', 'accountant', true)
on conflict (id) do update set
  lab_id = excluded.lab_id,
  full_name = excluded.full_name,
  email = excluded.email,
  role = excluded.role,
  is_active = excluded.is_active;

insert into public.user_roles (lab_id, user_id, role, is_active)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'lab_owner', true),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'lab_manager', true),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'technician', true),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'doctor', true),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'accountant', true)
on conflict (lab_id, user_id, role) do update set is_active = excluded.is_active;

insert into public.clinics (id, lab_id, name, address, phone)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Pearl Dental Center', 'Baghdad, Karrada', '+9647801111111'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Noor Smile Clinic', 'Baghdad, Mansour', '+9647802222222')
on conflict (id) do update set name = excluded.name;

insert into public.doctors (id, lab_id, profile_id, display_name, email, phone, default_clinic_id, performance_score)
values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'Dr. Zain Kareem', 'doctor@labflow.local', '+964770000004', '30000000-0000-4000-8000-000000000001', 94.5),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', null, 'Dr. Noor Abbas', 'noor@example.local', '+964770000006', '30000000-0000-4000-8000-000000000002', 88.0)
on conflict (id) do update set display_name = excluded.display_name;

insert into public.technicians (id, lab_id, profile_id, display_name, phone, productivity_score)
values
  ('50000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'Mina Technician', '+964770000003', 91.2),
  ('50000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', null, 'Ali CAD', '+964770000007', 86.4)
on conflict (id) do update set display_name = excluded.display_name;

insert into public.technician_skills (lab_id, technician_id, skill, level)
values
  ('20000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'zirconia', 5),
  ('20000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'coloring', 4),
  ('20000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002', 'exocad', 5)
on conflict (technician_id, skill) do update set level = excluded.level;

insert into public.cases (
  id,
  lab_id,
  case_number,
  patient_display,
  patient_name,
  doctor_id,
  clinic_id,
  restoration_type,
  work_type,
  material,
  shade,
  units_count,
  tooth_numbers,
  due_date,
  priority,
  priority_score,
  status,
  stage,
  current_stage,
  assigned_technician_id,
  is_urgent,
  requires_doctor_approval,
  missing_info_status,
  missing_info_fields,
  total_price,
  notes,
  created_by
)
values
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'LF-DEMO-001', 'H. Alwan', 'H. Alwan', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Zirconia crown', 'Zirconia crown', 'zirconia', 'A2', 2, array[11,12], current_date + 3, 'urgent', 90, 'open', 'cad_design', 'cad_design', '10000000-0000-4000-8000-000000000003', true, true, 'complete', '[]', 240.00, 'Demo urgent anterior crowns.', '10000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'LF-DEMO-002', 'S. Mahdi', 'S. Mahdi', '40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'Implant bridge', 'Implant bridge', 'zirconia', 'A3', 4, array[34,35,36,37], current_date + 7, 'normal', 50, 'open', 'doctor_approval', 'doctor_approval', null, false, true, 'requested', '["implant_system","bite_scan"]', 620.00, 'Waiting for doctor confirmation.', '10000000-0000-4000-8000-000000000002')
on conflict (id) do update set current_stage = excluded.current_stage;

insert into public.case_items (id, lab_id, case_id, tooth_numbers, work_type, material, shade, units_count, unit_price)
values
  ('61000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '[11,12]', 'Zirconia crown', 'zirconia', 'A2', 2, 120.00),
  ('61000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', '[34,35,36,37]', 'Implant bridge', 'zirconia', 'A3', 4, 155.00)
on conflict (id) do nothing;

insert into public.invoices (id, lab_id, doctor_id, clinic_id, invoice_number, status, subtotal, discount, tax, paid_amount, remaining_balance, notes)
values
  ('70000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'INV-DEMO-001', 'partially_paid', 240.00, 0, 0, 100.00, 140.00, 'Demo partial payment invoice.'),
  ('70000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'INV-DEMO-002', 'issued', 620.00, 0, 0, 0.00, 620.00, 'Demo open invoice.')
on conflict (id) do update set status = excluded.status, remaining_balance = excluded.remaining_balance;

insert into public.invoice_items (id, lab_id, invoice_id, case_id, case_item_id, description, quantity, unit_price, discount)
values
  ('71000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '61000000-0000-4000-8000-000000000001', 'Zirconia crown x2', 2, 120.00, 0),
  ('71000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', '61000000-0000-4000-8000-000000000002', 'Implant bridge x4', 4, 155.00, 0)
on conflict (id) do nothing;

insert into public.payments (id, lab_id, invoice_id, doctor_id, clinic_id, amount, method, reference, paid_at, recorded_by, notes)
values
  ('72000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 100.00, 'cash', 'CASH-DEMO-001', now(), '10000000-0000-4000-8000-000000000005', 'Demo partial payment.')
on conflict (id) do update set amount = excluded.amount;

insert into public.payment_allocations (id, lab_id, payment_id, invoice_id, amount)
values
  ('73000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '72000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 100.00)
on conflict (payment_id, invoice_id) do update set amount = excluded.amount;
