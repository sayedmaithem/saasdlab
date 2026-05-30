# LABFLOW MVP BRIEF V3 — BUILDABLE VERSION

## 1. Product Definition
LabFlow is a lean, case-centric Dental Laboratory Operating System. It manages the physical and digital journey of a dental restoration—from intake and CAD design to milling, QC, delivery, and invoicing.

## 2. Product Philosophy
* **Simple**: If a feature doesn't directly move a case forward or get the lab paid, cut it from the MVP.
* **Fast**: No complex nested menus. Everything is 1-2 clicks away.
* **Case-Centric**: Every file, comment, invoice, and production step is strictly tied to a `case_id`.
* **Practical**: Built for staff wearing gloves in a dusty lab. Big buttons, readable text, clear statuses.
* **Separation of Concerns**: Antigravity touches `.tsx` (UI/UX). Claude Code touches `.ts` (Server Actions/APIs/DB). Codex reviews security.

## 3. Core Object: Case / Order
The **Case** is the absolute center of gravity.
A Case connects: `Doctor` + `Patient Name` + `Restoration Specs` + `Workflow Stage` + `Uploaded Files` + `Invoice`.

## 4. Core Modules (MVP Focus)
1. **Cases & Intake**: The reception desk queue. Log new cases, check missing info, print physical paper work-ticket.
2. **Production Board**: Kanban view for managers to see where every case is physically located.
3. **Technician Workbench**: Prioritized list of cases assigned to a specific technician.
4. **Billing (Finance)**: Basic invoice generation linked to completed cases.
5. **Delivery**: Checklist of cases ready to leave the lab.
6. **Command Center**: Manage user access, doctors, and price lists.
7. **Doctor Portal**: Read-only view for dentists to check case statuses and upload files.

*Delayed Modules*: Full Inventory counting, HR performance tracking, advanced Analytics, Chatbots.

## 5. MVP Scope
* **Must Have**: Supabase Auth/RLS, Case Intake form, physical Work Ticket printing, Kanban drag-and-drop, Tech task completion, Basic Invoice generation, File Vault.
* **Delay**: Mobile digital signatures, complex inventory logic, multi-tier ledgers, exocad sync, WhatsApp.

## 6. User Roles & Permissions
* **Owner/Manager**: Full access.
* **Reception**: Can create cases, print tickets, upload files. Cannot view finance.
* **Technician**: Can only see their assigned workspace queue and change stages.
* **Accountant**: Can view completed cases, generate invoices, record payments.
* **Delivery**: Can only see "Ready for Delivery" and click "Delivered".
* **Doctor**: Can only see their own submitted cases and upload files.

## 7. Main Workflows (Simplified)
1. **Intake**: Reception creates Case -> Selects Specs -> Prints physical paper ticket.
2. **Production**: Case moves to Kanban -> Assigned to Tech -> Tech completes CAD/Milling -> QC.
3. **Delivery**: Case hits "Ready for Delivery" -> Driver clicks "Delivered".
4. **Billing**: Accountant sees "Delivered" case -> Clicks "Generate Invoice" -> Logs payment.
5. **Doctor Portal**: Doctor logs in -> Uploads STL scan -> Tracks status.

## 8. Navigation Architecture
* **Dashboard**: `/dashboard`
* **Cases (Intake)**: `/cases`
* **Production Board**: `/production`
* **My Workbench**: `/technicians/workspace`
* **Billing**: `/finance`
* **Delivery**: `/delivery`
* **Admin & Settings**: `/command-center`
* **Doctor Portal**: `/doctor-portal`

## 9. UX Rules
* **No sci-fi jargon**: Use practical lab terms ("Login", "Cases").
* **Minimal clicks**: "New Case" must be front and center.
* **Obvious Next Action**: Every case card must clearly indicate who is holding it.
* **Paper-friendly**: The printed work ticket must look perfect (`@media print`).
