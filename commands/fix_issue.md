# Fix Issue Command

An issue, bug, or gameplay regression has been reported.

Steps:
1. Identify the problem based strictly on the provided description.
2. Determine whether the issue is technical, gameplay-related, or a regression.
3. Fix the issue with the smallest possible change.
4. Verify that no new regressions were introduced.

Rules:
- Do not add new features.
- Do not refactor unrelated code.
- Do not change gameplay behavior unless required to fix the issue.

Game-specific requirements:
- If the issue affects gameplay, verify the fix directly in gameplay,
  not only via logs or technical checks.
- Preserve existing tuning, balance, and feel unless explicitly instructed otherwise.

After fixing:
- Update SNAPSHOT.md with a concise note describing the issue and the fix.

Stop after the issue is resolved.
