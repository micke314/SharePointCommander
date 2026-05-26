# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|---------|
| Backlog, acceptance criteria, scope | Jupiter | "what should we build next?", "define done for US1", "is this in scope?" |
| UI layout, keyboard model, overlay design | Minerva | "design the file list layout", "define keybindings", "how should filter mode look?" |
| JS implementation, rendering, state, events | Vulcan | "implement the overlay", "wire up keyboard events", "build the filter UI", "write bookmarklet" |
| SharePoint REST API, fetch calls, error handling | Mercury | "implement folder listing", "handle 403 errors", "optimize $select fields" |
| Caching, prefetch, performance | Janus | "implement the cache layer", "add prefetch logic", "measure render perf" |
| Testing, QA, acceptance validation, edge cases | Diana | "write test checklist", "validate US1 acceptance criteria", "find edge cases" |
| Security audit, data exfiltration, constraint compliance | Mars | "security review", "check for external calls", "audit localStorage usage" |
| README, demo script, backlog, inline comments | Fides | "write README", "create demo script", "update backlog", "document keybindings" |
| Code review | Jupiter | Review PRs, check quality, scope compliance |
| Session logging | Scribe | Automatic — never needs routing |
| Work queue, issue monitoring | Ralph | "Ralph, go", "what's on the board?", backlog triage |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Jupiter |
| `squad:jupiter` | Lead / PO work | Jupiter |
| `squad:minerva` | UI/UX work | Minerva |
| `squad:vulcan` | Frontend implementation | Vulcan |
| `squad:mercury` | API / fetch work | Mercury |
| `squad:janus` | Performance / caching | Janus |
| `squad:diana` | QA / testing | Diana |
| `squad:mars` | Security review | Mars |
| `squad:fides` | Documentation | Fides |

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn Diana to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. Jupiter handles all `squad` (base label) triage.
