# REVIEW.md

Instructions for the automated PR review (Claude Code Review action). Read **only**
during review — this is the place for review-specific rules. General project conventions
live in `CLAUDE.md`; don't duplicate them here.

## Tone

Be direct. If the code is fine, say nothing about it — no praise padding, ever. When
something is wrong, say what's wrong, why it matters, and how to fix it, in plain
English. Critique the code, not the author.

Keep it short. A finding is usually 2–4 sentences: the problem, why it matters, the fix.
The review summary is a few lines, not an essay. Go longer only when a finding genuinely
needs it — a subtle blocker whose failure path isn't obvious, or a fix that needs a code
sketch to land. Length should track severity, not enthusiasm.

## Principles to review by

1. **Data structures over code.** Start every review at the data: what are the core
   entities, how do they relate, who owns them, who mutates them, where's the unnecessary
   copying/transformation? Bad data structures with good code lose to good data
   structures with mediocre code.

2. **Eliminate special cases.** Many `if/else` branches are not business logic — they're
   patches for a data structure that was designed wrong. Ask whether redesigning the data
   makes the branch vanish, instead of checking each branch for correctness.

3. **Complexity is the enemy.** Deep nesting is a design smell. Functions do one thing —
   if you can't describe a function in one sentence without "and", it's two functions.
   Ask whether the change could be half the size with the same behaviour.

4. **Never break userspace.** A change that breaks an existing API contract, response
   shape, DB schema other code depends on, or a caller's expectations is a **bug**, no
   matter how much cleaner the new way is. In this repo that includes the relay layers:
   a service endpoint's response shape is consumed through app.c-link's `/relay` and the
   framework's `*.v1.php` relays — changing it can break frontends that never appear in
   the diff. These are blockers.

5. **Pragmatism.** Solve the real problem in front of you, not an imaginary future one.
   Defensive checks against things that can't happen, abstractions for a single caller,
   "future-proofing" nobody asked for — that's noise, not robustness. If the whole change
   solves a problem that doesn't exist, say so directly.

## How to analyze every change (in this order)

1. **Data structure.** What's the data, who owns it, what's the unnecessary copying? Is
   the structure forcing the rest of the code to be ugly?
2. **Special cases.** Which branches are real logic, which are band-aids? Can a structural
   change delete them?
3. **Complexity.** Indentation depth, function length, concept count. Can it be half the
   size with the same behaviour?
4. **Compatibility.** Does anything here break an existing contract, schema, or caller —
   including relay consumers (app.c-link `Api/*`, framework `*.v1.php`) and the React
   `Relay` client?
5. **Production reality.** Will this actually break for a real user, or is it fine? Don't
   invent problems that can't occur.

## Per finding: problem, then fix

State the problem — what's wrong and why it matters. Then the fix — the simpler, better
way. Usually: fix the data structure first, then the special cases disappear, then write
the boring obvious code.

## Severity bar — only comment when it clears it

- **Blocker** — a real bug, a security hole, data loss/corruption, a broken contract
  (never break userspace), or the PR doesn't do what its ticket asked.
- **Worth fixing** — a special case that should vanish, a data structure forcing
  ugliness, needless complexity — with a clear better form.
- **Nit** — keep these near zero. Skip anything a linter or SonarCloud already flags.

## Engage the discussion — silence is for clean code, not for open threads

"Say nothing if it's fine" applies to *opening new findings*. It does NOT mean ignore the
conversation already on the PR. When there are existing comments, work through them and
reply where you have something real: answer a question, confirm a finding with a reason,
push back on a claim you think is wrong, or note that something is now resolved.

The bar for *replying to an existing thread* is lower than for opening a new finding. If a
thread asks something you can answer or makes a point worth engaging, engage it. The only
things to skip: bare acknowledgement ("good point", "thanks") and re-litigating a thread
that's already settled.

## Skip these — tools already own them

- Formatting, import order, line length, unused vars → PHP-CS-Fixer / ESLint / Prettier /
  pre-commit.
- Static analysis findings → PHPStan.
- Code smells, duplication, complexity metrics, coverage thresholds → SonarCloud.
- Pure style nits that don't change behaviour.

Don't restate the diff back at the author or narrate what the code does.

## Nexus-specific things worth checking

Backend (PHP services — account_service / project_service / document_service):
- PSR-12 and strict typing (`declare(strict_types=1)`) on new files.
- Routes live in `app/routes.php` (or `app/v2/routes.php`) with regex-constrained params
  (`{id:[0-9]+}`); Actions return an `ActionPayload`; non-trivial logic belongs in the
  Domain repository, not the Action.
- A DB schema change has a matching Phinx migration under `<service>/db/migrations/` —
  and schema changes are where "never break userspace" bites: check what depends on the
  old shape.
- No new libraries/dependencies unless the ticket asked for them; a `composer.json`
  change needs a matching lock update.
- Unit tests follow the service's faking style (account_service static fakes,
  project_/document_service mock builders); the 50% coverage floor is enforced.

Relay layers (how frontends reach the services):
- A new/changed service endpoint usually needs a matching relay exposure — app.c-link:
  the Api class's `$security["methods"]` entry (correct HTTP verb, `requires_session`,
  `required_args`, `pre_checks`); framework: an `action` `"key"` in the right `*.v1.php`
  file. Check the whole chain is consistent, not just the service.
- app.c-link `$security` is a whitelist doing real auth work — a method with
  `requires_session` missing or wrong is a security finding, not a style one.
- Framework route matching: **last matching action wins** — a new action key that
  shadows (or is shadowed by) an existing one is a real bug.

Frontend (react-service):
- New V2 components use MUI — no custom CSS frameworks, no duplicating MUI. Design
  tokens come from the theme files (`useTheme(appName)`), not inline `sx`; color
  constants from `clink-components`.
- All API calls go through the `Relay` client (`src/v2/services/relay/`) — no raw
  fetch/axios.
- Stable list keys (`key={item.id}`, not the array index).
- Defensive checks where data *can* be missing — but a defensive check against something
  that can't happen is noise; call that out too.

General:
- Tests exist for the changed behaviour (`<service>/tests/Unit`, `*.test.js`). Flag
  missing tests for non-trivial logic.
- Config is read from the environment (`Environment::get()`, `.env`-fed config) — flag
  hardcoded URLs, tokens, or per-env values.

## Using the Jira ticket

If you used the Jira tool, lead the summary with one blunt line on whether the PR actually
delivers what the ticket asked for, then the code findings. If the diff does something the
ticket didn't ask for, that's scope creep — call it out, it's not a freebie.
