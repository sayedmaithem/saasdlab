# Merge Gate Pre-Commit Checklist

Define strict merge rules before anything moves to `main` or is committed.

## Requirements
- [ ] Work done on an experiment branch (not `main`).
- [ ] Git diff reviewed by Codex.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes (if available).
- [ ] `npm run typecheck` passes (if available).
- [ ] Codex outputs a PASS.
- [ ] No forbidden files were changed.
- [ ] No secrets exposed.
- [ ] No PHI exposed.
- [ ] No RLS violations detected.
- [ ] No role access regressions.
- [ ] No unrelated changes in the diff.
- [ ] CEO final approval granted.
- [ ] Rollback plan documented.

**NO COMMIT OR MERGE WITHOUT MEETING ALL CRITERIA.**
