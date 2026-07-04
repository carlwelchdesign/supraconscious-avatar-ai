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
- Run the pilot iteration report after each active pilot day and review the feedback queue before inviting additional users.
- Treat `not_accurate`, `too_intense`, `unclear`, and `unsupported_source` feedback as review-required until an admin records a disposition.
- Go/no-go defaults: continue only when launch readiness passes, safety queue is clear or consciously escalated, no pilot blockers remain, and negative feedback has a reviewer disposition.

## Internal RAG Activation
- Keep RAG product-doctrine-only for the internal pilot. July curriculum remains Threshold content; manuscripts and external manuscript PDFs remain unretrievable.
- Before activation, run the keyword RAG evals and pilot council evals, confirm the RAG readiness page has approved product-doctrine documents, eligible chunks, and no rights blockers.
- Activate only through the RAG readiness gate or the shared internal activation script; generic feature-flag editing must not enable `rag_enabled`.
- After activation, run the internal RAG smoke set:
  - Inner Council doctrine match.
  - Embodiment Gate doctrine match.
  - Architecture-of-self doctrine match.
  - No-source fallback with unrelated terms.
- Smoke passes only when matching entries produce `sourceMode=rag` with selected retrieval traces and unrelated entries produce `sourceMode=no_eligible_source`.
- Monitor RAG/no-source rates, selected source titles, unsupported-source reports, and citation validation during each daily review.

## Rollback Criteria
- Disable `rag_enabled` immediately if source citation validation fails, quote leakage appears, or unsupported-source reports cluster.
- Pause the cohort if unresolved safety reviews accumulate, if pilot-blocker quality reviews remain open, or if feedback trends toward too intense/unclear.
- Keep the legacy ChatGPT app analysis-only during this pilot unless a separate parity pass is approved.

## Support Limits
- The app does not provide therapy, diagnosis, emergency care, or monitored crisis response.
- High-risk journal entries should bypass council confrontation and source retrieval, then show grounding language.
- Admin review surfaces should avoid raw journal text by default.
