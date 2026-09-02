# External Terra Review Receipt

| Field | Value |
| --- | --- |
| Agent | `terra_reviewer` / `terra_security` |
| Model | ... |
| Reviewer role | ... |
| Review type | implementation / security / acceptance / architecture-security / phase-gate |
| Source commit | full 40-character SHA |
| Result commit | full 40-character SHA |
| Result tree | full Git tree object ID (40 or 64 hexadecimal characters) |
| Reviewed diff base / head | full source and result commit SHAs |
| Outcome | `terra_reviewer` / `terra_security`: APPROVED / CHANGES_REQUESTED; `sol_acceptance` / `sol_architecture_security`: ACCEPT / REJECT / BLOCKED; `sol_phase_gate`: PASS_RECOMMENDED / CONDITIONAL_RECOMMENDED / BLOCKED |
| External receipt reference | GitHub PR / CI / parent session |
| Limitations | ... |

Do not commit this receipt into the same tree it reviews.
