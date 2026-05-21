# Risks

## Technical Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OpenAI API rate limits / downtime | High | Medium | Implement retry with exponential backoff. Cache scraped properties by URL hash (TTL 24h). Fallback to manual input form if AI unavailable. |
| Zillow/Redfin changes DOM structure | High | Medium | Prompt engineering in ScrapingService tells GPT-4o-mini to extract from any listing format. No DOM parsing on our side. |
| DSCR calculation disputes | Medium | Low | Show full itemized breakdown. Add disclaimer: "This is an estimate; verify with your lender." |
| Stripe webhook delivery failures | Medium | Low | Idempotency keys on webhook handler. Manual subscription reconciliation via admin panel (future). |
| Session store connection pool exhaustion | Low | Low | connect-pg-simple with reasonable pool limits. Monitor Neon connection count. |

## Product Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Low accuracy of AI-extracted data | High | Medium | Allow full manual override after AI extraction. Flag low-confidence extractions to user. |
| Free tier abuse (unlimited scraping) | Medium | High | Rate-limit `/api/properties/scrape` per IP + per user. Daily cap for free tier. |
| Users expect lender-grade precision | High | Medium | Clear disclaimers. Verdict is "educational" — actual DSCR depends on lender-specific rate/terms. |
| Subscription churn from limited value | Medium | Low | Pricing page with comparison table. Free tier gives 3 analyses to prove value. |

## Mitigation Tracking
- [ ] Rate limiting middleware on scrape endpoint
- [ ] Property cache with TTL
- [ ] Exponential backoff in OpenAI calls
- [ ] Idempotent webhook handler
- [ ] DSCR disclaimers in UI footer
