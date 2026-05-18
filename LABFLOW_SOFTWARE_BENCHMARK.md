# LabFlow Software Benchmark

> Last updated: 2026-05-18 — LabOS Mega Build Sprint (Phase 15)

## Product Category

**Dental Laboratory Management System (LMS)**
Cloud-native, multi-tenant SaaS. Manages the full dental lab workflow: case intake → production → QC → delivery → invoicing.

---

## Competitive Landscape

| Product | Vendor | Deployment | Notable Strengths | Gaps vs LabFlow |
|---------|--------|------------|-------------------|-----------------|
| LabStar | LabStar Inc. | Web + desktop hybrid | Mature invoicing, wide adoption | Legacy UI, no real-time Kanban, no doctor portal |
| Dental Metrics | Cerec/Dentsply subsidiary | Web | Large install base, xCAD integration | Closed system, no custom workflows |
| Easy2Lab | Easy2Lab | Web | Simple UI, low price point | Limited RBAC, no stage-level permissions |
| Labtrac | Labtrac Ltd | Desktop | Deep UK market penetration | Desktop-only, no mobile, no cloud files |
| Tracker PRO | Tracker | Desktop | Barcode integration | Legacy stack, no doctor portal, no multi-tenant |
| DentrixLab | Henry Schein | Web | Integrates with DSO chains | Only for Henry Schein DSO customers |

---

## LabFlow Differentiation Matrix

| Capability | LabFlow | LabStar | Dental Metrics | Easy2Lab | Labtrac |
|------------|---------|---------|----------------|----------|---------|
| Custom workflow engine (per-lab stage config) | ✅ Phase 15 | ❌ | ❌ | ❌ | ❌ |
| Doctor self-service portal | ✅ | Partial | ❌ | ❌ | ❌ |
| Stage-level technician permissions | ✅ Phase 15 | ❌ | ❌ | ❌ | ❌ |
| Real-time production Kanban | ✅ | ❌ | Partial | ❌ | ❌ |
| Cloud file manager (STL/photo/CAD) | ✅ | ❌ | Partial | ❌ | ❌ |
| Multi-tenant (isolated lab data) | ✅ | ❌ | ✅ | ❌ | ❌ |
| 8-role RBAC with finance isolation | ✅ | Partial | Partial | ❌ | ❌ |
| QC gate (blocks delivery until pass) | ✅ | Partial | ❌ | ❌ | ❌ |
| Full audit timeline per case | ✅ | Partial | ❌ | ❌ | ❌ |
| Printable case summary sheet | ✅ Phase 15 | ✅ | Partial | ❌ | ✅ |
| PWA / mobile-ready | ✅ Phase 15 | ❌ | ❌ | ❌ | ❌ |
| Finance command center | ✅ Phase 15 | ✅ | ✅ | Partial | Partial |
| Missing information engine | ✅ | ❌ | ❌ | ❌ | ❌ |
| Doctor approval gate | ✅ | ❌ | ❌ | ❌ | ❌ |
| Case priority scoring | ✅ | ❌ | ❌ | ❌ | ❌ |
| Enterprise identity (invite flow) | ✅ Phase 14 | ❌ | ❌ | ❌ | ❌ |
| Open source / self-hostable | Planned | ❌ | ❌ | ❌ | ❌ |

---

## Feature Priority Benchmark

Features prioritized by competitive gap and lab pain:

1. **Custom workflow engine** — No competitor offers per-lab configurable stages with technician gates
2. **Doctor portal with live case status** — Strong differentiator; most competitors require phone/email
3. **Real-time production Kanban** — Dramatically reduces lab manager overhead
4. **Finance isolation** — Technicians never see invoices; accountant role is separate
5. **Cloud file vault** — STL/DICOM/photo storage linked directly to cases
6. **Case timeline audit** — Legal and dispute resolution value
7. **Missing information engine** — Reduces back-and-forth before production starts
8. **PWA + mobile layouts** — Technicians use tablets at bench

---

## Target Customer Segments

| Segment | Size | Pain | Priority |
|---------|------|------|----------|
| Independent dental labs (1–15 staff) | Large | Manual spreadsheets, no doctor portal | High |
| Mid-size labs (15–50 staff) | Medium | Multiple software tools, no integration | Highest |
| Lab groups / multi-site | Small | Multi-tenant isolation, cross-site reporting | Medium (Phase 16+) |
| DSO-aligned labs | Small | EHR integration, HL7/FHIR | Low (future) |

---

## Pricing Benchmark (USD/month, estimated)

| Product | Entry | Pro | Enterprise |
|---------|-------|-----|------------|
| LabStar | $199 | $399 | Custom |
| Easy2Lab | $79 | $179 | $299 |
| Labtrac | £99 (desktop license) | — | — |
| **LabFlow (target)** | **$99** | **$249** | **Custom** |

---

## Build vs Buy Decision Log

| Capability | Build or Buy | Rationale |
|------------|-------------|-----------|
| Auth & identity | Buy (Supabase Auth) | Industry-grade, eliminates token management burden |
| File storage | Buy (Supabase Storage) | S3-compatible, RLS-integrated |
| Email sending | Buy (Resend) | Transactional email, excellent DX |
| Database | Buy (Supabase / Postgres) | ACID, RLS, pg_cron for scheduled tasks |
| Kanban / workflow | Build | Core differentiator — no off-the-shelf tool matches dental lab stages |
| Invoicing engine | Build | Dental-specific: per-unit, per-arch, shade adjustments; no generic tool fits |
| Doctor portal | Build | Tight coupling to case data; no third-party forms tool fits the workflow |
| Design workflow (CAD) | Build | exocad-specific file handling and stage logic |

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Competitor copies workflow engine | Medium | Speed to market; SaaS lock-in via lab data |
| Lab owner resistance to cloud | Medium | PWA, offline-first planning (Phase 16) |
| Supabase pricing at scale | Low | Row-level caching, pg_cron for aggregates |
| HIPAA / GDPR compliance gap | Low-Medium | No PHI stored currently; patient name only; legal review Phase 17 |
| Multi-tenant data leak | Low | RLS enforced on all tables; lab_id on every query |

---

## Roadmap Alignment

| Phase | Theme | Benchmark Gap Closed |
|-------|-------|---------------------|
| 14 | Enterprise Identity | No competitor has invite-based onboarding with token hardening |
| 15 | LabOS Mega Build | Custom workflow engine = strongest differentiator |
| 16 | exocad Design Workflow | Deep dental lab CAD integration |
| 17 | Delivery + Shipping | Barcode/QR delivery confirmation |
| 18 | Finance & Statements | Doctor-facing invoices and statements |
| 19 | Reporting & Analytics | Lab productivity dashboard |
| 20 | Mobile-first / PWA | Tablet use at bench |
