# LABFLOW Tool Orchestration Rules

Antigravity is the main orchestrator. The founder should not manually manage every AI tool.

## Branch / Version Strategy
1. **main**: Protected stable source of truth. Strict mode. No direct feature experiments. Terminal commands require review. No commit without CEO approval and Codex PASS.
2. **experiment-a**: Implementation experiment branch for real app code. Used by Antigravity, Claude, Codex. Allowed: frontend polish, controlled backend tasks. Forbidden: DB resets, exposing secrets, PHI transmission.
3. **experiment-b**: Design, prototype, and tool experiment workspace. Used by Stitch, Lovable, OpenRouter, Antigravity. Allowed: UI variants, research, docs. Forbidden: Real DB migrations, editing `.env`, production backend changes.
4. **staging** (Optional later): Candidate branch before merging to main.

## Agent Freedom Policy
- **Freedom in experiment-a**: Inspect code, propose plans, edit allowed task files, run safe validation commands, create prompts.
- **Freedom in experiment-b**: Create design docs, prototypes, research prompts, UX variant notes, update knowledge docs (with CEO approval).
- **Requires CEO Approval Everywhere**: DB schema, RLS, auth/roles, billing, deleting files, dependencies, routing architecture, adding modules, editing `.env`, copying external code, running destructive terminal commands.
- **Forbidden Everywhere**: `rm -rf`, `git reset --hard`, `git push --force`, `supabase db reset`, exposing API keys/PHI, sending real data to OpenRouter/Stitch/Lovable, bypassing RLS.

## Safe Allow-List Terminal Commands
`npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `git status`, `git diff`, `git log`, `git branch`, `git checkout`, `pwd`, `ls`, `find`, `cat`, `grep`.

## Always Deny / Require Review Commands
`rm`, `sudo`, `chmod`, `chown`, `git reset`, `git clean`, `git push --force`, `npm install/uninstall`, `supabase db reset/push`, `curl`, `wget`, `ssh`, editing `.env`.

## Tool Roles
### Antigravity
**Owns**: Frontend, UX, product planning, route cleanup, forms, task dispatching.
**Must not own**: DB migrations, RLS, Auth rules, secure storage, backend-heavy logic.

### Claude CLI
**Owns**: Backend, Supabase, PostgreSQL, migrations, RLS, auth, API routes, server actions.
*(Antigravity delegates to Claude using the Claude Execution Prompt).*

### Codex CLI
**Owns**: QA, security review, current diff review, build validation. Must review before every commit.

### Stitch
**Owns**: UI design ideation. (Use as inspiration only, not source of truth).

### Lovable
**Owns**: Fast disposable UX prototypes. (Fake data only, do not overwrite production repo).

### OpenRouter
**Owns**: Second opinions, structured JSON outputs, research. (Never send PHI, secrets, or real patient data).

## Default Routing
- **Frontend UI**: Primary: Antigravity -> Reviewer: Codex
- **Backend/API/RLS**: Primary: Claude CLI -> Reviewer: Codex
- **Security review**: Primary: Codex
- **New screen design**: Primary: Stitch -> Impl: Antigravity -> Reviewer: Codex
- **Disposable prototype**: Primary: Lovable

## Tool Selection Rule
Before every non-trivial task, Antigravity must output:
1. Task summary, 2. Task type, 3. Primary owner, 4. Supporting tools, 5. Why, 6. Allowed files, 7. Forbidden files, 8. Privacy risks, 9. Branch/workspace, 10. CEO approval needed, 11. Codex review needed.

## Commit Rule
No commit without: 1. Validation, 2. Codex diff review, 3. Founder approval.
