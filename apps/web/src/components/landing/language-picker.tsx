"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
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
  const router = useRouter()
  const [activeLanguage, setActiveLanguage] = useState(currentLanguage)
  const [isSaving, setIsSaving] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function chooseLanguage(language: SupportedLanguage) {
    if (language === activeLanguage || isSaving) return

    const previousLanguage = activeLanguage
    setActiveLanguage(language)
    setIsSaving(true)

    try {
      const response = await fetch("/language", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: language }),
      })

      if (!response.ok) {
        setActiveLanguage(previousLanguage)
        return
      }

      startTransition(() => {
        router.refresh()
      })
    } catch {
      setActiveLanguage(previousLanguage)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="flex h-10 items-center gap-1 rounded-full border border-white/15 bg-white/10 px-1.5"
      aria-label={label}
      aria-busy={isSaving || isPending}
    >
      {languages.map((language) => {
        const active = language.code === activeLanguage
        return (
          <button
            key={language.code}
            type="button"
            title={language.nativeLabel}
            aria-label={language.nativeLabel}
            aria-current={active ? "true" : undefined}
            disabled={isSaving || isPending}
            onClick={() => void chooseLanguage(language.code)}
            className={
              active
                ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--cream)] text-base shadow-sm ring-1 ring-white/60 disabled:cursor-wait"
                : "inline-flex h-7 w-7 items-center justify-center rounded-full text-base opacity-70 transition hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--clay-light)] disabled:cursor-wait disabled:opacity-50"
            }
          >
            <span aria-hidden="true">{language.flag}</span>
          </button>
        )
      })}
    </div>
  )
}
