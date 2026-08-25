# Supraconscious social preview

Release asset specification for the Observatory visual system.

- Export: `share-card-preview.png`
- Size: 1200 × 630 px
- Runtime routes: `/opengraph-image` and `/twitter-image`
- Background source: `apps/web/public/mineral-boundary-v3-wide.png`
- Icon route: `/icon` (replaces the retired eye mark)
- Exact headline: `A quieter place for honest reflection.`
- Exact support line: `Write what is present. Keep what fits. The meaning and next choice remain yours.`
- Exact boundary line: `SEVEN EQUAL DIMENSIONS · YOUR WORDS STAY PRIMARY`

The runtime image is composed deterministically with `next/og`; image generation is not used for text or brand marks. Next.js fingerprints the generated image URLs so social platforms receive a new asset URL when the composition changes.
