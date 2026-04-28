"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

type AnalysisResult = {
  safety: {
    severity: string
    flags: string[]
  }
  analysis: {
    summary: string
  } | null
  avatarResponse: {
    openingLine: string | null
    mirror: string | null
    patternName: string | null
    contradiction: string | null
    socraticQuestion: string | null
    integrationStep: string | null
    closingLine: string | null
  }
  prompt: {
    title: string
    context: string
    materials: string | null
    execution: string
    integration: string
  }
}

export function JournalWorkspace() {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<AnalysisResult | null>(null)

  async function handleSubmit() {
    setError("")
    setResult(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/journal/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? "Reflection failed.")
      }

      setResult(payload)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Reflection failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,.95fr)]">
      <section className="flex min-h-[520px] flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Journal</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Write plainly. The reflection will stay short, structured, and non-clinical.
          </p>
        </div>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What is present today?"
          className="min-h-[360px] resize-none rounded-lg border-border bg-card p-4 text-base leading-7 shadow-sm"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Private by default. Pattern memory can be adjusted in settings.</p>
          <Button onClick={handleSubmit} disabled={isSubmitting || text.trim().length < 20} className="gap-2">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Reflect
          </Button>
        </div>
        {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Avatar Reflection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6">
            {result ? (
              <>
                {result.avatarResponse.openingLine ? <p className="font-medium">{result.avatarResponse.openingLine}</p> : null}
                {result.avatarResponse.mirror ? <p>{result.avatarResponse.mirror}</p> : null}
                {result.avatarResponse.patternName ? (
                  <p className="text-muted-foreground">Pattern: {result.avatarResponse.patternName}</p>
                ) : null}
                {result.avatarResponse.contradiction ? <p>{result.avatarResponse.contradiction}</p> : null}
                {result.avatarResponse.socraticQuestion ? (
                  <p className="border-l-2 border-accent pl-3 font-medium">{result.avatarResponse.socraticQuestion}</p>
                ) : null}
                {result.avatarResponse.integrationStep ? (
                  <p className="rounded-lg bg-accent p-3 text-accent-foreground">{result.avatarResponse.integrationStep}</p>
                ) : null}
                {result.avatarResponse.closingLine ? <p className="text-muted-foreground">{result.avatarResponse.closingLine}</p> : null}
              </>
            ) : (
              <p className="text-muted-foreground">Your reflection will appear here after you submit an entry.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6">
            {result ? (
              <>
                <h2 className="text-lg font-semibold">{result.prompt.title}</h2>
                <p>{result.prompt.context}</p>
                {result.prompt.materials ? <p className="text-muted-foreground">{result.prompt.materials}</p> : null}
                <p>{result.prompt.execution}</p>
                <p className="font-medium">{result.prompt.integration}</p>
              </>
            ) : (
              <p className="text-muted-foreground">A grounded prompt will be generated from the reflection.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
