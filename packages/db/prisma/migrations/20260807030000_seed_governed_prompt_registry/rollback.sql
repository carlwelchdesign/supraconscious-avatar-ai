-- Manual FCA-024 data rollback. Run only after confirming no seeded prompt revision
-- has been approved, activated, or assigned. Prior schema and unrelated prompt rows remain intact.

DROP TRIGGER IF EXISTS "CuratedPromptDimension_revision_immutable" ON "CuratedPromptDimension";
DROP FUNCTION IF EXISTS "protectCuratedPromptDimension"();
DROP TRIGGER IF EXISTS "CuratedPrompt_revision_immutable" ON "CuratedPrompt";
DROP FUNCTION IF EXISTS "protectCuratedPromptRevision"();

DELETE FROM "CuratedPrompt"
WHERE "version" = 1
  AND "stableKey" IN ('physical.release_into_body', 'physical.sensory_anchor', 'physical.inner_map_return', 'physical.act_as_if', 'physical.enter_frame', 'physical.borrow_future_self', 'physical.unwitnessed_truth', 'physical.name_it_twice', 'physical.one_gesture', 'physical.narrow_frame', 'mental.perception_projection', 'mental.perception_wholeness', 'mental.story_identity_without_labels', 'mental.story_braver_question', 'mental.fear_unspoken_truth', 'mental.fear_language_shift', 'mental.ego_persona', 'mental.ego_repeated_voice', 'mental.genius_golden_sphere', 'mental.genius_already_present', 'mental.supraconscious_observer', 'mental.supraconscious_inner_dialogue', 'mental.embodiment_wholeness_breath', 'mental.embodiment_resilient_listening')
  AND "approvalState" = 'founder_supplied'
  AND "rightsState" = 'needs_legal_review'
  AND "active" = false;
