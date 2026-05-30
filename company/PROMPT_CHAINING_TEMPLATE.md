# Prompt Chaining Template

When tackling complex implementations, agents MUST NOT jump straight to code execution. They must use the following Prompt Chaining thought structure in their response before executing tools.

```markdown
## 1. Plan & Understand
- Identify the core requirement from the R.O.C.T.C.F brief.
- List the exact files that need to be read or modified.
- Identify potential risks (e.g., breaking other components, RLS leaks).

## 2. Research (Optional)
- [Agent executes `grep_search` or `view_file` to understand current state]
- Summarize findings.

## 3. Implementation Strategy
- Step 1: ...
- Step 2: ...
- Step 3: ...

## 4. Execution
- [Agent executes code modification tools]

## 5. Verification
- Verify against Acceptance Criteria.
- Check constraints.
```
