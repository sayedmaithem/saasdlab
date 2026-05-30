# Agent Skills Directory

Skills are reusable operating modes for agents. They are not hidden assumptions.

## 1. Product Architect Skill
- **Purpose**: Define product scope and MVP priorities.
- **Trigger**: Any roadmap, module, workflow, or MVP decision.
- **Input**: User request, master brief.
- **Process**: Evaluate against Case-Centric principle and simplicity rule.
- **Output**: Module decision, MVP priority, build/delay/reject recommendation.
- **Forbidden**: Do not design backend schemas.
- **Review Requirement**: CEO approval.

## 2. Dental Lab UX Skill
- **Purpose**: Simplify UI for real lab staff.
- **Trigger**: Any screen used by owner, receptionist, tech, accountant, doctor, delivery.
- **Input**: Screen context, role.
- **Process**: Remove generic SaaS terms, clarify next actions, prioritize readability.
- **Output**: UX simplification, screen flow, next action, empty state.
- **Forbidden**: No sci-fi terms, no complex charts unless needed.
- **Review Requirement**: Antigravity/CEO review.

## 3. Frontend Implementation Skill
- **Purpose**: Build React/Next.js UI.
- **Trigger**: Any app/components/layout/form/navigation task.
- **Input**: Approved task plan.
- **Process**: Write `.tsx` and `.ts` (constants).
- **Output**: Allowed files, implementation plan, validation commands.
- **Forbidden**: Do not touch backend logic, migrations, or RLS.
- **Review Requirement**: Codex Review.

## 4. Backend Delegation Skill
- **Purpose**: Safely route backend work to Claude CLI.
- **Trigger**: Any task involving database, RLS, auth, APIs, server actions, storage.
- **Input**: R.O.C.T.C.F parameters.
- **Process**: Generate exact prompt for Claude.
- **Output**: Claude Execution Prompt.
- **Forbidden**: Do not write the backend code yourself.
- **Review Requirement**: CEO approval before Claude executes.

## 5. Codex Review Skill
- **Purpose**: Guarantee security and code quality.
- **Trigger**: Any diff before commit.
- **Input**: Git diff.
- **Process**: Verify boundaries, RLS, role access, and types.
- **Output**: Codex Review Prompt and PASS/FAIL checklist.
- **Forbidden**: Do not add features.
- **Review Requirement**: Mandatory before commit.

## 6. OpenRouter Advisor Skill
- **Purpose**: Get structured JSON or architecture research.
- **Trigger**: Research, second opinion, structured advice.
- **Input**: Anonymized context.
- **Process**: Format structured JSON prompt.
- **Output**: Anonymized OpenRouter prompt and expected JSON schema.
- **Forbidden**: Never send PHI, `.env`, keys, or real data.
- **Review Requirement**: CEO review of advice.

## 7. Stitch Design Skill
- **Purpose**: Generate UI concepts.
- **Trigger**: New screen or layout exploration.
- **Input**: Screen goals, user role.
- **Process**: Generate Stitch prompt.
- **Output**: Stitch prompt and design evaluation checklist.
- **Forbidden**: Do not use output as final code without adaptation.
- **Review Requirement**: CEO approval.

## 8. Lovable Prototype Skill
- **Purpose**: Test workflows rapidly.
- **Trigger**: Disposable prototype or flow testing.
- **Input**: Workflow goals, fake data.
- **Process**: Generate Lovable prompt.
- **Output**: Lovable prompt and prototype evaluation checklist.
- **Forbidden**: Do not overwrite the real repo with output.
- **Review Requirement**: CEO approval for concept migration.

## 9. Security Boundary Skill
- **Purpose**: Prevent data leakage.
- **Trigger**: Any auth, role, RLS, file, finance, patient, or tenant-related task.
- **Input**: Task plan.
- **Process**: Evaluate risks.
- **Output**: Security concerns, forbidden actions, review requirements.
- **Forbidden**: Never bypass RLS or `lab_id` checks.
- **Review Requirement**: Codex Review.

## 10. Merge Gate Skill
- **Purpose**: Ensure `main` branch stability.
- **Trigger**: Any attempt to merge or commit.
- **Input**: Task results.
- **Process**: Run validation, check diffs, verify approvals.
- **Output**: Merge readiness report.
- **Forbidden**: Never commit without PASS.
- **Review Requirement**: Codex + CEO.

## 11. Experiment Director Skill
- **Purpose**: Safely test hypotheses in experiment branches.
- **Trigger**: Any feature idea being tested.
- **Input**: Goal, hypothesis.
- **Process**: Select tool, specify files, run tests.
- **Output**: Experiment plan, branch, tool selection, scorecard.
- **Forbidden**: Do not run on `main`.
- **Review Requirement**: CEO approval.

## 12. Knowledge Update Skill
- **Purpose**: Improve the AI Company OS over time.
- **Trigger**: After every completed task or failed experiment.
- **Input**: Execution outcome.
- **Process**: Extract lessons, formulate rules.
- **Output**: Proposed lesson, proposed rule, file to update, CEO approval request.
- **Forbidden**: Do not silently change rules.
- **Review Requirement**: CEO approval.
