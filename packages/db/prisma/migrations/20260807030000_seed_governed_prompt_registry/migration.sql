-- FCA-024: seed the exact founder-supplied v1 prompt corpus as immutable,
-- provenance-bearing records. Current approval and rights states remain explicit;
-- these rows are intentionally inactive until separate review gates are satisfied.

CREATE OR REPLACE FUNCTION "protectCuratedPromptRevision"()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Curated prompt revisions are immutable; retain prior provenance';
    END IF;

    IF NEW."stableKey" IS DISTINCT FROM OLD."stableKey"
       OR NEW."version" IS DISTINCT FROM OLD."version"
       OR NEW."modality" IS DISTINCT FROM OLD."modality"
       OR NEW."publicTitle" IS DISTINCT FROM OLD."publicTitle"
       OR NEW."publicText" IS DISTINCT FROM OLD."publicText"
       OR NEW."internalTechniqueName" IS DISTINCT FROM OLD."internalTechniqueName"
       OR NEW."sourceDocumentId" IS DISTINCT FROM OLD."sourceDocumentId"
       OR NEW."sourceWork" IS DISTINCT FROM OLD."sourceWork"
       OR NEW."sourceLocator" IS DISTINCT FROM OLD."sourceLocator"
       OR NEW."safetyIntensity" IS DISTINCT FROM OLD."safetyIntensity"
       OR NEW."contraindications" IS DISTINCT FROM OLD."contraindications"
       OR NEW."language" IS DISTINCT FROM OLD."language" THEN
        RAISE EXCEPTION 'Curated prompt content and provenance are immutable; create a new version';
    END IF;

    -- User account deletion nulls approval ownership through the foreign key. Fail
    -- closed without blocking that deletion or leaving the prompt runtime-eligible.
    IF OLD."approvedById" IS NOT NULL AND NEW."approvedById" IS NULL THEN
        NEW."active" := false;
        NEW."approvalState" := 'approval_revoked';
        NEW."approvedAt" := NULL;
    END IF;

    IF NEW."active" = true AND (
        NEW."approvalState" <> 'founder_approved'
        OR NEW."approvedById" IS NULL
        OR NEW."approvedAt" IS NULL
        OR NEW."rightsState" <> 'approved'
        OR NOT EXISTS (
            SELECT 1 FROM "CuratedPromptDimension"
            WHERE "curatedPromptId" = NEW."id"
        )
    ) THEN
        RAISE EXCEPTION 'Curated prompt activation requires recorded founder approval, rights clearance, and dimensions';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "CuratedPrompt_revision_immutable"
BEFORE UPDATE OR DELETE ON "CuratedPrompt"
FOR EACH ROW EXECUTE FUNCTION "protectCuratedPromptRevision"();

CREATE TEMP TABLE "_FCA024CuratedPromptSeed" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "modality" TEXT NOT NULL,
    "publicTitle" TEXT,
    "publicText" TEXT NOT NULL,
    "internalTechniqueName" TEXT NOT NULL,
    "sourceWork" TEXT NOT NULL,
    "sourceLocator" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL
) ON COMMIT DROP;

INSERT INTO "_FCA024CuratedPromptSeed" (
    "id", "stableKey", "version", "modality", "publicTitle", "publicText",
    "internalTechniqueName", "sourceWork", "sourceLocator", "dimensions"
) VALUES
    ('fca024_physical_release_into_body_v1', 'physical.release_into_body', 1, 'physical', 'Release into the Body', 'Starting at your hands, notice where you''re holding tension. Let it go, one part of your body at a time — hands, shoulders, jaw. Nothing needs to happen until it does.', 'Strasberg''s Relaxation Exercise', 'Supraconscious', 'registry:physical_prompt_library_v1', '["embodiment"]'::jsonb),
    ('fca024_physical_sensory_anchor_v1', 'physical.sensory_anchor', 1, 'physical', 'Sensory Anchor', 'Touch the nearest surface. Describe its texture in one sentence. Let that be more real, right now, than the thought looping in your head.', 'Sense Memory', 'Supraconscious', 'registry:physical_prompt_library_v1', '["perception"]'::jsonb),
    ('fca024_physical_inner_map_return_v1', 'physical.inner_map_return', 1, 'physical', 'The Inner Map Return', 'Has your body felt this exact way before? Go there for one breath. What does that memory know that today doesn''t yet?', 'Affective (Emotional) Memory', 'Supraconscious', 'registry:physical_prompt_library_v1', '["story"]'::jsonb),
    ('fca024_physical_act_as_if_v1', 'physical.act_as_if', 1, 'physical', 'Act "As If"', 'For the next minute, walk, sit, or speak as if you already made this choice. Let your body answer before your mind does.', 'The Magic If', 'Supraconscious', 'registry:physical_prompt_library_v1', '["genius","supraconscious"]'::jsonb),
    ('fca024_physical_enter_frame_v1', 'physical.enter_frame', 1, 'physical', 'Enter the Frame', 'Name exactly where you are, who''s involved, and what''s actually true right now — not the story about it, just the facts of this frame.', 'Given Circumstances', 'Supraconscious', 'registry:physical_prompt_library_v1', '["perception","story"]'::jsonb),
    ('fca024_physical_borrow_future_self_v1', 'physical.borrow_future_self', 1, 'physical', 'Borrow the Future Self', 'Close your eyes for ten seconds. Let your future self — the one who already knows how this turns out — answer instead of you.', 'Substitution', 'Supraconscious', 'registry:physical_prompt_library_v1', '["genius"]'::jsonb),
    ('fca024_physical_unwitnessed_truth_v1', 'physical.unwitnessed_truth', 1, 'physical', 'The Unwitnessed Truth', 'If no one were watching — not even the version of you that performs for others — what would you actually do right now?', 'Private Moment', 'Supraconscious', 'registry:physical_prompt_library_v1', '["ego"]'::jsonb),
    ('fca024_physical_name_it_twice_v1', 'physical.name_it_twice', 1, 'physical', 'Name It Twice', 'Say what you''re feeling in one sentence. Now say it again, differently. Which version came from the ego trying to protect you, and which came from somewhere truer?', 'Repetition Exercise (Meisner)', 'Supraconscious', 'registry:physical_prompt_library_v1', '["ego"]'::jsonb),
    ('fca024_physical_one_gesture_v1', 'physical.one_gesture', 1, 'physical', 'The One Gesture', 'If this choice had one physical gesture, what would it be? Do it once, with your whole body, not just your hands.', 'Psychological Gesture (Chekhov)', 'Supraconscious', 'registry:physical_prompt_library_v1', '["embodiment"]'::jsonb),
    ('fca024_physical_narrow_frame_v1', 'physical.narrow_frame', 1, 'physical', 'Narrow the Frame', 'Pick one small thing in front of you. Give it your full attention for ten seconds — nothing else exists in that window.', 'Concentration / Circle of Attention', 'Supraconscious', 'registry:physical_prompt_library_v1', '["perception"]'::jsonb),
    ('fca024_mental_perception_projection_v1', 'mental.perception_projection', 1, 'mental', NULL, 'Look at one object near you. Ask: if this is my own projection, what is it showing me back?', 'Nature Exercise', 'Supraconscious: The Genius Within You', 'registry:mental_prompt_library_v1', '["perception"]'::jsonb),
    ('fca024_mental_perception_wholeness_v1', 'mental.perception_wholeness', 1, 'mental', NULL, 'Name one part of your life that''s thriving right now, and one part that''s quietly starving. Just name them — no fixing yet.', 'Wholeness Check-in', 'Not Mars. Not Venus. Just Us.', 'registry:mental_prompt_library_v1', '["perception"]'::jsonb),
    ('fca024_mental_story_identity_without_labels_v1', 'mental.story_identity_without_labels', 1, 'mental', NULL, 'If your name were erased from every form, file, and title you hold, what about you would still be completely true?', 'ID Exercise', 'Supraconscious: The Genius Within You', 'registry:mental_prompt_library_v1', '["story"]'::jsonb),
    ('fca024_mental_story_braver_question_v1', 'mental.story_braver_question', 1, 'mental', NULL, 'Take a question you''ve been asking yourself lately. Ask instead: who taught me to ask it this way — and what''s the braver version of this question?', 'Ask the Right Questions', 'Not Mars. Not Venus. Just Us.', 'registry:mental_prompt_library_v1', '["story"]'::jsonb),
    ('fca024_mental_fear_unspoken_truth_v1', 'mental.fear_unspoken_truth', 1, 'mental', NULL, 'What truth are you avoiding saying out loud right now — even just to yourself?', 'Secret Rule Questions for Both Men and Women', 'Not Mars. Not Venus. Just Us.', 'registry:mental_prompt_library_v1', '["fear"]'::jsonb),
    ('fca024_mental_fear_language_shift_v1', 'mental.fear_language_shift', 1, 'mental', NULL, 'Notice the phrase you default to under pressure — "I have to," "what if I fail." Say the Supraconscious version instead, out loud, once: "I choose to," "what if I learn."', 'Micro-Mindset Shifts', 'The Birth of Business Genius', 'registry:mental_prompt_library_v1', '["fear"]'::jsonb),
    ('fca024_mental_ego_persona_v1', 'mental.ego_persona', 1, 'mental', NULL, 'Which persona are you wearing in this exact moment — the one that keeps you safe, admired, or in control? Set it down for ten seconds. What''s still there?', 'Ego Exercise', 'Supraconscious: The Genius Within You', 'registry:mental_prompt_library_v1', '["ego"]'::jsonb),
    ('fca024_mental_ego_repeated_voice_v1', 'mental.ego_repeated_voice', 1, 'mental', NULL, 'Bring to mind one recurring hard moment — a meeting, a conversation, a pattern. Ask: whose voice am I repeating here? What am I actually protecting?', 'Awareness Mapping', 'The Birth of Business Genius', 'registry:mental_prompt_library_v1', '["ego"]'::jsonb),
    ('fca024_mental_genius_golden_sphere_v1', 'mental.genius_golden_sphere', 1, 'mental', NULL, 'Picture yourself inside a small sphere of gold light, pulsing at the pace of a heartbeat. Don''t ask it anything — just let it show you one thing, without words.', 'Golden-ball visualization', 'Supraconscious: The Genius Within You', 'registry:mental_prompt_library_v1', '["genius"]'::jsonb),
    ('fca024_mental_genius_already_present_v1', 'mental.genius_already_present', 1, 'mental', NULL, 'Finish this as if it''s already true: act, speak, or decide today from the certainty that your Genius is already present — not something you''re waiting to earn.', '365 Daily Frames of Thought', 'The Birth of Business Genius', 'registry:mental_prompt_library_v1', '["genius"]'::jsonb),
    ('fca024_mental_supraconscious_observer_v1', 'mental.supraconscious_observer', 1, 'mental', NULL, 'Picture someone watching this entire moment of your life from just behind your shoulder — calm, unhurried, incapable of judging you. What do they notice that you can''t see from inside it?', 'Observer Meditation', 'Supraconscious: The Genius Within You', 'registry:mental_prompt_library_v1', '["supraconscious"]'::jsonb),
    ('fca024_mental_supraconscious_inner_dialogue_v1', 'mental.supraconscious_inner_dialogue', 1, 'mental', NULL, 'Give your protective side one line to speak, and your tender side one line to answer it with. Let them finish each other''s sentence.', 'Masculine/feminine inner-dialogue visualization', 'Not Mars. Not Venus. Just Us.', 'registry:mental_prompt_library_v1', '["supraconscious"]'::jsonb),
    ('fca024_mental_embodiment_wholeness_breath_v1', 'mental.embodiment_wholeness_breath', 1, 'mental', NULL, 'Join your thumb and index finger on both hands, palms turned up. Breathe in for four counts, out for eight, eight times. Notice what settles by the last breath.', 'Wholeness breathing meditation', 'Supraconscious: The Genius Within You', 'registry:mental_prompt_library_v1', '["embodiment"]'::jsonb),
    ('fca024_mental_embodiment_resilient_listening_v1', 'mental.embodiment_resilient_listening', 1, 'mental', NULL, 'Next time you''re mid-conversation, try one full round: breathe once before you respond, don''t prepare your reply while they''re still talking, and reflect the feeling back before you share your own view.', 'Moment-to-Moment Resilient Listening', 'The Birth of Business Genius', 'registry:mental_prompt_library_v1', '["embodiment"]'::jsonb);

INSERT INTO "CuratedPrompt" (
    "id", "stableKey", "version", "modality", "publicTitle", "publicText",
    "internalTechniqueName", "sourceWork", "sourceLocator", "rightsState",
    "approvalState", "safetyIntensity", "contraindications", "language",
    "translationStatus", "active", "createdAt"
)
SELECT
    "id", "stableKey", "version", "modality", "publicTitle", "publicText",
    "internalTechniqueName", "sourceWork", "sourceLocator", 'needs_legal_review',
    'founder_supplied', 'low', '[]'::jsonb, 'en', 'source', false, CURRENT_TIMESTAMP
FROM "_FCA024CuratedPromptSeed"
ON CONFLICT ("stableKey", "version") DO NOTHING;

DO $$
DECLARE exact_match_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO exact_match_count
    FROM "_FCA024CuratedPromptSeed" seed
    JOIN "CuratedPrompt" prompt
      ON prompt."stableKey" = seed."stableKey"
     AND prompt."version" = seed."version"
     AND prompt."modality" = seed."modality"
     AND prompt."publicTitle" IS NOT DISTINCT FROM seed."publicTitle"
     AND prompt."publicText" = seed."publicText"
     AND prompt."internalTechniqueName" = seed."internalTechniqueName"
     AND prompt."sourceWork" = seed."sourceWork"
     AND prompt."sourceLocator" = seed."sourceLocator"
     AND prompt."approvalState" = 'founder_supplied'
     AND prompt."rightsState" = 'needs_legal_review'
     AND prompt."active" = false;

    IF exact_match_count <> 24 THEN
        RAISE EXCEPTION 'FCA-024 governed prompt seed conflicts with an existing revision';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION "protectCuratedPromptDimension"()
RETURNS TRIGGER AS $$
DECLARE prompt_is_pending BOOLEAN;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        RAISE EXCEPTION 'Curated prompt dimensions are immutable; create a new prompt version';
    END IF;

    SELECT prompt."approvalState" = 'pending' AND prompt."active" = false
      INTO prompt_is_pending
    FROM "CuratedPrompt" prompt
    WHERE prompt."id" = NEW."curatedPromptId";

    IF prompt_is_pending IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Dimensions may only be added while a new prompt revision is pending';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

INSERT INTO "CuratedPromptDimension" ("id", "curatedPromptId", "dimension")
SELECT
    seed."id" || '_' || dimension.value,
    prompt."id",
    dimension.value
FROM "_FCA024CuratedPromptSeed" seed
JOIN "CuratedPrompt" prompt
  ON prompt."stableKey" = seed."stableKey" AND prompt."version" = seed."version"
CROSS JOIN LATERAL jsonb_array_elements_text(seed."dimensions") AS dimension(value)
ON CONFLICT ("curatedPromptId", "dimension") DO NOTHING;

CREATE TRIGGER "CuratedPromptDimension_revision_immutable"
BEFORE INSERT OR UPDATE OR DELETE ON "CuratedPromptDimension"
FOR EACH ROW EXECUTE FUNCTION "protectCuratedPromptDimension"();

DO $$
DECLARE physical_count INTEGER;
DECLARE mental_count INTEGER;
BEGIN
    SELECT COUNT(*) FILTER (WHERE "modality" = 'physical'),
           COUNT(*) FILTER (WHERE "modality" = 'mental')
      INTO physical_count, mental_count
    FROM "CuratedPrompt"
    WHERE "version" = 1 AND "stableKey" IN ('physical.release_into_body', 'physical.sensory_anchor', 'physical.inner_map_return', 'physical.act_as_if', 'physical.enter_frame', 'physical.borrow_future_self', 'physical.unwitnessed_truth', 'physical.name_it_twice', 'physical.one_gesture', 'physical.narrow_frame', 'mental.perception_projection', 'mental.perception_wholeness', 'mental.story_identity_without_labels', 'mental.story_braver_question', 'mental.fear_unspoken_truth', 'mental.fear_language_shift', 'mental.ego_persona', 'mental.ego_repeated_voice', 'mental.genius_golden_sphere', 'mental.genius_already_present', 'mental.supraconscious_observer', 'mental.supraconscious_inner_dialogue', 'mental.embodiment_wholeness_breath', 'mental.embodiment_resilient_listening');

    IF physical_count <> 10 OR mental_count <> 14 THEN
        RAISE EXCEPTION 'FCA-024 governed prompt seed requires exactly 10 physical and 14 mental prompts';
    END IF;
END $$;
