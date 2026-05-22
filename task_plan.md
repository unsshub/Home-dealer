# Task Plan: DSCR Verdict

## Goal
Complete and deploy the DSCR Verdict SaaS. Multi-strategy DSCR engine is done.

## Status
| Phase | Feature | Status |
|-------|---------|--------|
| ✅ | Manual Property Input | Server endpoint + client form + tests |
| ✅ | Google OAuth | Strategy + routes + client buttons + tests |
| ✅ | Multi-Strategy DSCR Engine | Registry pattern, 4 strategy calculators, conditional UI |

## Phases

### Phase 1: ✅ Architecture Review & Context Recovery
- [x] Read HANDOFF.md, important_state.md, decisions.md, risks.md, agents.md
- [x] Explored codebase structure
- [x] Planning files created

### Phase 2: ✅ Manual Property Input
- [x] Tracer bullet test + minimal route (TDD)
- [x] Validation tests + DB persistence test
- [x] Client mode toggle + property form

### Phase 3: ✅ Google OAuth
- [x] Install passport-google-oauth20
- [x] DB migration: google_id + nullable password_hash
- [x] Google Strategy + createOrLinkGoogle
- [x] Routes: GET /auth/google, /auth/google/callback
- [x] Client buttons on LoginPage + RegisterPage
- [x] Tests for createOrLinkGoogle

### Phase 4: ✅ Multi-Strategy DSCR Engine
- [x] Design spec via brainstorming (strategy registry pattern)
- [x] Shared types: Strategy-specific inputs + FlipMetrics
- [x] Calculator registry + Buy & Hold extraction
- [x] BRRRR calculator (ARV-based loan)
- [x] Fix & Flip calculator (profit/ROI + DSCR)
- [x] STR calculator (seasonal income + booking costs)
- [x] Route handlers dispatch via registry
- [x] Zod schemas for strategy-specific fields
- [x] Client conditional form fields per strategy
- [x] Flip metrics display on result card
- [x] Integration tests for brrrr + fix_and_flip
- [x] 26/26 tests passing, typecheck + build clean

### Phase 5: ✅ Rate Limiting & Caching
- [x] Design spec: DB-backed rate limiting (analyses table) + page_cache schema
- [x] Implementation plan (writing-plans skill)
- [x] Subagent-driven development (4 tasks, 32 tests)
- [x] Task 1: page_cache Drizzle schema
- [x] Task 2: Cache logic in scraping service + 3 tests
- [x] Task 3: Rate limit middleware + 3 tests
- [x] Task 4: Wired into routes (10/hr URL, 30/hr manual)

### Phase 6: 🔲 TBD

## Decisions Log
| Decision | Rationale |
|----------|-----------|
| New endpoint POST /api/analyze/manual | Surgical change, doesn't touch existing flow |
| TDD: tracer bullet first | Per global-rules mandate |
| Google strategy gracefully skipped if no env vars | Allows deployment without breaking |
| Strategy registry pattern for DSCR engine | Clean separation, testable in isolation, easy to extend |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| — | — | — |
