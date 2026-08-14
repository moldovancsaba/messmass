# Phase 0 — Instrumentation & Coverage Ledger (Evidence)

Status: Active
Last Updated: 2026-08-14T18:00:00.000Z
Canonical: Yes (phase record)
Owner: Architecture

**Version:** 12.1.55

Phase 0 of `docs/audits/lld-audit-plan-2026-08-14.md`. Deliverable: the machinery
that makes completeness mechanical (rule R4), plus a database where rule R3 can
safely execute state-changing flows.

---

## 1. What was built

| Artefact | Path | Regenerate with |
|---|---|---|
| Coverage ledger | `docs/audits/lld/ledger.csv` | `npx tsx scripts/lld-audit/build-inventory.ts` |
| Collection read/write matrix | `docs/audits/lld/graphs/collection-matrix.md` | same |
| Entry point → collection graph | `docs/audits/lld/graphs/entry-point-graph.md` | same |
| Machine-readable graph | `docs/audits/lld/graphs/raw-graph.json` | same |
| Scratch-DB harness | `scripts/lld-audit/scratch-db.ts` | `npx tsx scripts/lld-audit/scratch-db.ts` |

All generated artefacts are reproducible from a clean checkout. None are
hand-edited; the audit plan's R1 requires evidence to be re-derivable rather than
asserted.

## 2. Why the compiler API rather than grep

The inventory is built with the TypeScript compiler API: imports are resolved via
`ts.resolveModuleName` (so `@/lib/x`, extensionless imports and index files
resolve to real files) and collection names are read off the AST.

This was not a stylistic choice — the audit plan itself was drafted using grep and
carried a wrong figure as a result. Measured differences on this repo:

- **grep misses 70 references** of the form `db.collection<T>('name')`. Its
  pattern stops at the generic parameter. This is how `user_preferences` and
  `styles` were absent from the plan's collection list.
- **grep invents collections that do not exist.** It reported `categories`, which
  is real text at `lib/api/caching.ts:244` — inside a template literal holding a
  *documentation example*, not executable code. It also reported `name` and `x`,
  which are prose inside the comments of the audit script itself.
- **grep's quote handling split one collection into two** ledger entries
  (`data_blocks` appearing under both quote styles).

**Correction to the audit plan:** the plan states 68 distinct collection names.
The verified figure is **69**. The plan's number has been corrected, and this
paragraph is the reason.

## 3. Ledger reconciliation (R4 exit criterion)

The exit criterion for Phase 0 is that ledger row counts equal independently
measured totals. They do.

| Kind | Ledger | Independent count | Method |
|---|---:|---:|---|
| route | 182 | 182 | `find app/api -name route.ts` |
| page | 69 | 69 | `find app -name page.tsx` |
| app-module | 22 | 22 | 273 app files − 182 − 69 |
| lib | 210 | 210 | `find lib -type f` (code ext) |
| component | 111 | 111 | `find components -type f` |
| hook | 12 | 12 | `find hooks -type f` |
| test | 37 | 37 | `find tests -type f` |
| script | 402 | 402 | `find scripts -type f` (code ext) |
| collection | 69 | 69 | AST, see §2 |
| **Total units** | **1,114** | — | |

Every row reconciles exactly. Reaching that required excluding `scripts/lld-audit/`
from the scan: the audit's own tooling is not part of the system under audit, and
including it had let the scratch-DB harness's `db.collection('probe')` register as
a 70th real collection — the instrument contaminating its own measurement.

Total units are 1,114 rather than the ~640 estimated in the plan, because the
estimate excluded `scripts/` (402, deferred by scope decision) and the
per-collection rows (69). The non-deferred, non-collection working set is **643**,
which matches the estimate.

## 4. A bug in the instrumentation, found and fixed

Recorded because rule R2 applies to the audit's own tools, not only to the code
under audit.

The first working version classified **683 of 1,163** collection references as
`unknown` access. The cause was not the codebase: source files obtained from a
`ts.Program` have no `parent` pointers until the binder runs, and the binder never
ran here. Every chained call in `app/` and `lib/` — `db.collection('x').findOne()`
— therefore fell through to `unknown`, while the separately-parsed `scripts/` pass
classified correctly because `ts.createSourceFile(..., true)` sets parents
explicitly.

Had this shipped, the matrix would have understated write paths across the entire
application while looking complete.

Fix: track ancestry explicitly during traversal instead of reading `node.parent`,
and additionally resolve the bound-handle shape
(`const col = db.collection('x'); col.updateOne(...)`), which is the dominant
idiom in this codebase.

| Version | Unknown access | Share |
|---|---:|---:|
| Initial | 683 / 1,163 | 58.7% |
| Bound-handle resolution added | 432 / 1,163 | 37.1% |
| Ancestry tracking (final) | **1 / 1,163** | **0.1%** |

The single remaining unknown is dispositioned by hand:
`lib/reportVariants.ts:192` — `const partners = db.collection<PartnerRecord>('partners')`
is declared and then shadowed by a differently-typed local on the next line, so no
method is invoked on the handle at all. Phase 2 confirms whether the declaration
is dead.

**Known limitation, recorded not hidden:** bound-handle resolution collects method
calls on the identifier across the whole source file. An identifier shadowed in a
nested scope would over-collect, biasing toward `write`. Phase 3 spot-checks the
bound references; the bias direction is deliberate, since over-reporting a write
path is the safe error.

## 5. Scratch database harness (rule R3)

A local `mongod` is reachable at `127.0.0.1:27017` — the same instance fanmass
uses. `scripts/lld-audit/scratch-db.ts` provides `withScratchDb(label, fn)` with a
hard naming guard: every database it touches must begin with `lld_scratch_`,
checked on acquire and again before the drop.

The guard exists because a teardown against a mistyped name on this host would
destroy the fanmass database. Self-check output:

```
 - write/read round-trip: PASS
 - teardown dropped the database: PASS
 - guard refuses a non-scratch name: PASS
```

Host databases after the run: `admin, config, fanmass, local` — zero leftover
scratch databases, fanmass untouched.

Per-flow fixtures are authored during each sweep phase, not now: seeding
realistically requires knowing each collection's schema-in-practice, which is
Phase 3's output. Phase 0 delivers the safe place to run, not the data.

## 6. Domain assignment is graph-derived, not path-guessed

The ledger's `domain` column drives phase slicing — it is how "is Phase 6
complete" gets answered. A first version assigned domains by file path and left
**306 units `uncategorised`**, which would have made the column useless for its
only purpose.

Domains are now backfilled from the import graph: every `lib`/`component`/`hook`
inherits the domain of the entry points that actually reach it. Modules reached
from more than one domain become `shared` (Phase 8, crosscutting). Modules no
entry point reaches become `unreached` — which is information, not a blank.

Non-deferred working set after backfill:

| Domain | Units | Domain | Units |
|---|---:|---|---:|
| admin | 137 | data | 18 |
| shared | 123 | v3 | 17 |
| **unreached** | **81** | bitly | 12 |
| analytics | 59 | auth | 9 |
| uncategorised | 42 | sports-db | 7 |
| integrations | 27 | public | 6 |
| reporting | 25 | (18 smaller domains) | ≤3 each |
| partners | 19 | | |

The 42 still `uncategorised` are modules reached only from the 15 top-level public
pages (`app/page.tsx`, `app/edit/[slug]`, `app/filter/[slug]`, `app/hashtag/…`,
`app/privacy`, `app/terms`, and similar) that sit outside `app/api` and
`app/admin`. Phase 1 assigns them a domain; they are not lost.

## 7. First observations from the generated graphs

Not findings — findings require Phase 2+ verification. These are the questions the
graphs raise, recorded so later phases start from evidence.

- **43 of 251 entry points reach zero collections.** Each is either genuinely
  data-free or reaches data through a path this analysis cannot see (a dynamic
  import, a fetch to another route, a driver call not shaped as
  `.collection('x')`). Both readings matter and each entry needs disposition.
- **`app/api/projects/route.ts` reaches 13 collections through 30 modules.** The
  widest blast radius of any single entry point in the application.
- **`analytics_aggregates` has 26 references, 23 of them reads, 3 writes**, split
  19 app/lib and 7 scripts — a read-heavy collection with a small write surface,
  which is the shape where a single incorrect writer does quiet damage.
- **`admin_users` is referenced exactly once, from a script, and never from
  application code.** Candidate dead collection; Phase 4 dispositions it alongside
  `users` and `local_users`.
- **81 modules are unreachable from any route or page.** `unreached` means no
  request path arrives there — it does not by itself mean unused, since a module
  could be reached from `scripts/` (excluded from the graph) or through a dynamic
  import this analysis cannot resolve. Two were checked by hand and neither
  escape applies:

  | Module | Lines | Importers found anywhere in repo |
  |---|---:|---|
  | `app/admin/events/ProjectsPageClient.tsx` | 1,108 | none |
  | `lib/layoutGrammarValidation.ts` | 543 | none |

  The second is the more interesting: `scripts/check-layout-grammar-guardrail.ts`
  is a required CI gate and sounds like this module's consumer, but it imports
  only `fs` and `path`. Recorded as a candidate for Phase 2/6 disposition, not
  asserted as dead code — that verdict needs the sweep.

## 8. Phase 0 exit checklist

- [x] Ledger generated, every unit carries a disposition
- [x] Row counts reconcile against independent measurement (§3)
- [x] Import graph resolves aliases and index files via the compiler API
- [x] Collection matrix classifies read/write, unknowns at 0.1% and hand-dispositioned
- [x] Scratch DB harness working, guard tested, no data leaked
- [x] All artefacts regenerable by one command
- [x] Instrumentation defects found during Phase 0 recorded (§4)
- [x] Domain column usable for phase slicing (§6)
