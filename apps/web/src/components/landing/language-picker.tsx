import type { SupportedLanguage } from "@inner-avatar/types/language"

type LanguageOption = {
  code: SupportedLanguage
  nativeLabel: string
  flag: string
}

export function LanguagePicker({
  currentLanguage,
  label,
  languages,
}: {
  currentLanguage: SupportedLanguage
  label: string
  languages: LanguageOption[]
}) {
  const next = "/"
  const activeLanguage = languages.find((language) => language.code === currentLanguage)
  const languageHref = (language: SupportedLanguage) => `/language?lang=${encodeURIComponent(language)}&next=${encodeURIComponent(next)}`

  return (
    <>
      <details className="relative block md:hidden">
        <summary className="flex h-11 min-w-[156px] list-none items-center justify-between gap-3 rounded-full border border-white/15 bg-[rgba(255,255,255,0.12)] px-3 text-sm font-medium text-[var(--cream)] outline-none marker:hidden focus:ring-2 focus:ring-[var(--clay-light)] [&::-webkit-details-marker]:hidden">
          <span>
            {activeLanguage?.flag} {activeLanguage?.nativeLabel ?? label}
          </span>
          <span aria-hidden="true">▾</span>
        </summary>
        <div className="absolute left-0 top-12 z-[60] min-w-[180px] overflow-hidden rounded-2xl border border-white/15 bg-[var(--primary)] py-1 shadow-2xl">
          {languages.map((language) => (
            <a
              key={language.code}
              href={languageHref(language.code)}
              aria-current={language.code === currentLanguage ? "true" : undefined}
              className="block px-4 py-3 text-sm font-medium text-[var(--cream)] hover:bg-white/10 focus:bg-white/10 focus:outline-none"
            >
              {language.flag} {language.nativeLabel}
            </a>
          ))}
        </div>
      </details>

      <div
        className="hidden h-10 items-center gap-1 rounded-full border border-white/15 bg-white/10 px-1.5 md:flex"
        aria-label={label}
      >
        {languages.map((language) => {
          const active = language.code === currentLanguage
          return (
            <a
              key={language.code}
              href={languageHref(language.code)}
              title={language.nativeLabel}
              aria-label={language.nativeLabel}
              aria-current={active ? "true" : undefined}
              className={
                active
                  ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--cream)] text-base shadow-sm ring-1 ring-white/60 disabled:cursor-wait"
                  : "inline-flex h-7 w-7 items-center justify-center rounded-full text-base opacity-70 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)] disabled:cursor-wait disabled:opacity-50"
              }
            >
              <span aria-hidden="true">{language.flag}</span>
            </a>
          )
        })}
      </div>
    </>
  )
}
