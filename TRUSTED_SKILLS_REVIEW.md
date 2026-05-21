# Trusted Skills Review — LabFlow Dental CRM

This file defines the skill installation policy for this project and documents every skill that has been evaluated, recommended, or rejected.

---

## Skill Installation Policy

### Rules That Must Be Followed

1. **Official Anthropic skills are the first choice.** Always prefer skills from Anthropic or from the official Claude skill repository before considering anything else.

2. **Unknown community skills must not be installed automatically.** Any skill from an unknown or unverified creator must be manually reviewed before installation.

3. **Any skill that contains executable scripts must be reviewed before installation.** Read the script. Understand what it does. If it is unclear, do not install it.

4. **Any skill that requests secrets, tokens, API keys, or credentials must be rejected outright.** Legitimate skills do not need your environment secrets.

5. **Any skill that modifies git history, uses force push, or rewrites commits must be rejected unless you explicitly approve it for a specific one-time use.**

6. **Any skill that makes network requests to unknown destinations must be rejected.**

7. **Skills that install system packages or modify system configuration require explicit approval before use.**

### Priority Order for Skill Selection

```
Priority 1 — Official Anthropic skills
Priority 2 — High-quality, widely-used, well-maintained open-source skills with clear authorship
Priority 3 — Custom project skills written by you or verified collaborators
Priority 4 — Nothing else without explicit review and approval
```

### Skills Useful for This Project

Skills relevant to LabFlow Dental CRM should help with one or more of:

- Software engineering and code quality
- SaaS architecture and system design
- Supabase and PostgreSQL development
- Row Level Security (RLS) design and review
- Security review and vulnerability detection
- Quality assurance and testing
- Documentation generation
- UI and UX review
- GitHub workflow and DevOps
- Next.js and TypeScript development
- Production deployment and hardening

---

## Official Anthropic Skills Available in This Session

The following official Anthropic skills are currently installed and available. They are safe to use without additional review.

| Skill | Source | Purpose | Risk | Contains Scripts | Safe | Use For LabFlow |
|-------|--------|---------|------|-----------------|------|----------------|
| `docx` | Anthropic | Create and edit Word documents | None | Yes (document processing only) | Yes | Reports, documentation, specs |
| `xlsx` | Anthropic | Create and edit Excel spreadsheets | None | Yes (spreadsheet processing only) | Yes | Finance reports, data exports |
| `pptx` | Anthropic | Create and edit PowerPoint presentations | None | Yes (presentation processing only) | Yes | Pitch decks, phase plans |
| `pdf` | Anthropic | Read, create, merge, and extract PDF files | None | Yes (PDF processing only) | Yes | Invoice PDFs, export, documentation |
| `canvas-design` | Anthropic | Create visual designs and posters as PNG/PDF | None | No | Yes | UI mockups, design assets |
| `mcp-builder` | Anthropic | Build MCP servers to integrate external APIs | Low | No | Yes | Future integrations (WhatsApp, payment gateway) |
| `skill-creator` | Anthropic | Create and optimize Claude skills | None | No | Yes | Creating new project skills |
| `theme-factory` | Anthropic | Apply visual themes to artifacts | None | No | Yes | UI theming and design consistency |
| `web-artifacts-builder` | Anthropic | Build complex multi-component HTML artifacts | None | No | Yes | Interactive dashboards, mockups |
| `setup-cowork` | Anthropic | Guided Cowork environment setup | None | No | Yes | Environment setup |
| `schedule` | Anthropic | Create scheduled automated tasks | None | No | Yes | Automated reports, reminders |

---

## Custom Project Skills (Created for This Project)

| Skill | Source | Purpose | Risk | Contains Scripts | Safe | Status |
|-------|--------|---------|------|-----------------|------|--------|
| `opus-orchestrator` | Custom (Abbas) | Model routing, architecture review, LabFlow security checklist | None | No | Yes | Installed at `.claude/skills/opus-orchestrator/SKILL.md` |

---

## Skills Evaluated and Not Installed

| Skill | Source | Reason Not Installed |
|-------|--------|---------------------|
| `labflow-code-reviewer` | Not found | Does not exist. Must be created as a custom skill if needed. |
| `labflow-product-architect` | Not found | Does not exist. Must be created as a custom skill if needed. |
| `labflow-github-devops` | Not found | Does not exist. Must be created as a custom skill if needed. |

---

## Skills Recommended for Future Creation

These custom skills would be valuable for this project and can be created using the `skill-creator` Anthropic skill:

### `labflow-code-reviewer`
- **Purpose:** Automated code review for LabFlow-specific patterns. Checks RLS enforcement, lab_id filtering, finance isolation, role boundaries, workflow gates, and TypeScript quality.
- **Risk:** None (no scripts, no external calls)
- **How to create:** Use the `skill-creator` skill with the description above
- **Priority:** High — create before Phase 2 implementation

### `labflow-product-architect`
- **Purpose:** Deep product and architecture thinking for LabFlow. Knows the domain (dental labs, exocad, QC, remakes, doctor portals) and can critique decisions against the product vision.
- **Risk:** None
- **How to create:** Use the `skill-creator` skill
- **Priority:** High — create before Phase 5

### `labflow-github-devops`
- **Purpose:** GitHub workflow enforcement for LabFlow. Manages branch strategy (main, develop, phase-XX branches), commit hygiene, secret scanning, and push safety.
- **Risk:** Low — review any git-modifying instructions before running
- **How to create:** Use the `skill-creator` skill
- **Priority:** Medium — create at Phase 0 git setup

---

## Skill Marketplace Status

Claude Code supports an official plugin/skill marketplace. The recommended command to browse official skills is:

```
/plugin marketplace add anthropics/skills
```

**Status as of project setup:** The official Anthropic skills listed in this file are already available in the active session. No additional marketplace installation was required for those skills. The three LabFlow-specific skills do not exist in any marketplace and must be created as custom skills.

---

## Security Red Flags — Reject Any Skill That Has These

If you are ever evaluating a skill and see any of the following, reject it immediately:

- Asks for `SUPABASE_SERVICE_ROLE_KEY` or similar secret
- Makes HTTP requests to unknown URLs
- Runs `git push --force` or modifies git history
- Installs npm packages globally without telling you
- Modifies `.env` or any environment file
- Reads files outside the project directory
- Has no clear author or source
- Has not been updated in over a year with no explanation
- Claims to be from Anthropic but is not in the official channel

---

## Approval Log

| Date | Skill | Decision | Reason |
|------|-------|----------|--------|
| 2026-05-16 | `opus-orchestrator` (custom) | Approved and installed | Written by project owner, no scripts, no external calls |
| 2026-05-16 | All official Anthropic skills | Approved for use | Official source, already available in session |
| 2026-05-16 | `labflow-code-reviewer` | Pending creation | Does not exist yet — to be created |
| 2026-05-16 | `labflow-product-architect` | Pending creation | Does not exist yet — to be created |
| 2026-05-16 | `labflow-github-devops` | Pending creation | Does not exist yet — to be created |
