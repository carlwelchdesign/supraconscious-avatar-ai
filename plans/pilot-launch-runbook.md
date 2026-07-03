# Internal Pilot Launch Runbook

## Purpose
This runbook is for a controlled internal pilot of the Maria-grounded Inner Council experience. The guide is inspired by Maria Olon Tsaroucha's teachings; it is not Maria, not therapy, not crisis monitoring, and not a spiritual authority.

## Launch Checklist
- Confirm an active internal pilot cohort exists and intended users are enrolled.
- Confirm enrolled users have completed first-session orientation and consent before using the journal.
- Import/register sources, then approve only product doctrine and the current-month curriculum for pilot use.
- Keep manuscripts registered but unretrievable.
- Confirm source rights grants support `paraphrase_generation`; direct quote display remains off unless explicitly approved.
- Run the pilot launch readiness report and resolve every blocker.
- Run RAG evals and pilot council evals before any pilot session.
- Keep `rag_enabled=false` unless the dedicated RAG activation gate has passed with current eval metadata and rollback criteria.

## Monitoring Cadence
- Review pilot readiness daily during active internal testing.
- Review unresolved safety events before inviting additional users.
- Review quality blockers before considering any source or cohort expansion.
- Watch no-source/RAG rates, feedback mix, first-session completion, Embodiment Gate saves, and unsupported-source reports.

## Rollback Criteria
- Disable `rag_enabled` immediately if source citation validation fails, quote leakage appears, or unsupported-source reports cluster.
- Pause the cohort if unresolved safety reviews accumulate, if pilot-blocker quality reviews remain open, or if feedback trends toward too intense/unclear.
- Keep the legacy ChatGPT app analysis-only during this pilot unless a separate parity pass is approved.

## Support Limits
- The app does not provide therapy, diagnosis, emergency care, or monitored crisis response.
- High-risk journal entries should bypass council confrontation and source retrieval, then show grounding language.
- Admin review surfaces should avoid raw journal text by default.
