# Execution Roadmap

## Phase 0: Stabilization
**Goal**: Fix immediate blocking bugs and establish strict UI copy.
1. Fix Sidebar Navigation Route Bugs (404s for Admin/Accounting).
2. Ground UI Copy (Remove Sci-Fi Jargon).
3. Cross-Tenant RLS Hardening Audit.

## Phase 1: Case Intake & Printing
**Goal**: Allow reception to log cases and put paper travelers into physical pans.
1. Build Validated Case Intake Form (Frontend).
2. Implement Case Intake & Stage Transition APIs (Backend).
3. Secure File Upload Handlers (Backend).
4. Build Printable Job Ticket / Paper Traveler (Frontend).

## Phase 2: Production Flow
**Goal**: Move cases through the lab digitally.
1. Stabilize Production Kanban Drag-and-Drop.
2. Build Technician Workbench Stage Completions.
3. Link Stage Transitions to `case_stage_logs` audit trail.

## Phase 3: Billing Basics
**Goal**: Generate flat invoices for completed cases.
1. Build Basic Invoice Generation UI (Frontend).
2. Process Invoices & Payments API (Backend).

## Phase 4: Doctor Portal
**Goal**: Allow dentists to self-serve.
1. Consolidate Doctor Portal Views (Remove duplicate routes).
2. Implement Secure Doctor STL File Uploads.
