"use client"

import { useEffect } from "react"
import { useMessages } from "next-intl"

type AdminMessages = {
  phrases?: Record<string, string>
}

const LOCALIZED_ATTRIBUTE_NAMES = ["aria-label", "placeholder", "title"]

export function AdminAutoLocalizer() {
  const messages = useMessages() as AdminMessages

  useEffect(() => {
    const phrases = messages.phrases ?? {}
    const translateTextNode = (node: Node) => {
      const original = node.textContent?.trim()
      if (!original) return
      const translated = phrases[original]
      if (!translated || translated === original) return
      node.textContent = node.textContent?.replace(original, translated) ?? translated
    }

    const translateElement = (element: Element) => {
      for (const attribute of LOCALIZED_ATTRIBUTE_NAMES) {
        const value = element.getAttribute(attribute)
        if (value && phrases[value]) element.setAttribute(attribute, phrases[value])
      }
    }

    const walk = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let current = walker.nextNode()
      while (current) {
        translateTextNode(current)
        current = walker.nextNode()
      }
      document.querySelectorAll(LOCALIZED_ATTRIBUTE_NAMES.map((name) => `[${name}]`).join(",")).forEach(translateElement)
    }

    walk()
    const observer = new MutationObserver(walk)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [messages])

  return null
}

