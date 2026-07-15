# Obsidian Vault Import

Obsidian is a private authoring and development workspace for source notes, product doctrine, prompts, and calibration material. It is not deployed with the app and is not queried by runtime council generation.

The importer reads a local vault path and creates reviewable `SourceDocument`, `SourceSection`, and `SourceChunk` records. Existing admin source review, rights review, RAG eligibility, and citation validation remain the gate before content can affect runtime responses.

## Local Import

Set a local vault path:

```env
OBSIDIAN_VAULT_PATH="/Users/you/Documents/Obsidian/My Vault"
```

Run:

```bash
yarn --cwd packages/ai import:obsidian
```

You can also pass a path directly:

```bash
yarn --cwd packages/ai import:obsidian "/Users/you/Documents/Obsidian/My Vault"
```

## Note Opt-In

Only Markdown notes with this frontmatter are imported:

```md
---
inner_avatar_import: true
title: Inner Council Source Note
sourceType: product_doctrine
reasoningScope: product_doctrine
author: Maria Olon Tsaroucha
work: Founder Notes
language: en
tags: [inner-council, source]
aliases: [Council Note]
---

# Inner Council Source Note

Source text here.
```

If `sourceType` is omitted, the importer defaults to `product_doctrine`. If `reasoningScope` is omitted, it uses the default scope for the source type.

## Safety Defaults

Imported Obsidian notes default to:

- document `reviewState: "parsed"`
- document `rightsStatus: "needs_review"`
- chunk `reviewState: "parsed"`
- rights grant `status: "needs_review"`
- quote display disabled

Admins must approve document state, rights, and chunks before retrieval can use the imported note. Wiki links, Markdown links, tags, aliases, frontmatter, and relative path are preserved in source metadata for review and future ontology work.
