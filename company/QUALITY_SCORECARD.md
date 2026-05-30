# Experiment Quality Scorecard

Every experiment/task must be graded on a 0–5 scale before merge.

## Criteria
1. **Dental Lab Usefulness**: Does this solve a real physical lab problem?
2. **Case-Centric Alignment**: Is this feature strictly tied to a Case/Order?
3. **UX Clarity**: Is the next action obvious? Is it free of clutter?
4. **MVP Simplicity**: Is this the leanest possible version?
5. **Role-Based Access**: Does this correctly respect user roles?
6. **Security/RLS Safety**: Are tenant boundaries (`lab_id`) enforced?
7. **Data Privacy**: Are patient names and financial data protected?
8. **Code Quality**: Are boundaries (frontend vs backend) respected?
9. **Performance**: Is it fast and responsive?
10. **Maintainability**: Is it clean and well-documented?
11. **Integration Safety**: Will this break existing workflows?
12. **Business Value**: Does this help the lab get paid or save time?

## Rejection Rules
- Any **Security/RLS** score < 4 -> **REJECT**
- Any **Data Privacy** score < 5 -> **REJECT**
- Any **MVP Simplicity** score < 3 -> **Requires simplification**
- Any task not connected to case lifecycle or MVP priority -> **Requires explicit CEO approval**
