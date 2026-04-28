import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAuthConfigurationState, isClerkConfigured } from "@/lib/auth/config"

export default async function Home() {
  const clerkConfigured = isClerkConfigured()
  const authState = getAuthConfigurationState()
  const { userId } = clerkConfigured ? await auth() : { userId: null }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto grid min-h-[92vh] max-w-6xl content-center gap-12 px-4 py-16 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Guided AI journaling
          </p>
          <h1 className="text-5xl font-semibold tracking-normal text-foreground sm:text-6xl">
            Write. See clearly. Choose consciously.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Inner Avatar is a reflective journaling experience that helps you notice patterns, clarify emotions, and turn awareness into one grounded next step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {userId || authState === "local-demo" ? (
              <Button asChild size="lg" className="gap-2">
                <Link href="/journal">
                  {authState === "local-demo" ? "Open Demo Journal" : "Open Journal"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="gap-2">
                  <Link href="/register">
                    Start Reflecting
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-5">
            {[
              ["Safety first", "Crisis and high-intensity entries receive grounded support instead of symbolic prompts."],
              ["Structured reflection", "Entries are analyzed into emotional signals, language markers, patterns, and contradictions."],
              ["Pattern memory", "Repeated themes are tracked carefully and can be turned off."],
            ].map(([title, body]) => (
              <div key={title} className="border-b pb-5 last:border-0 last:pb-0">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  {title}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
          <div>
            <h2 className="font-semibold">Reflect</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Write what is present without turning the page into a performance.</p>
          </div>
          <div>
            <h2 className="font-semibold">Recognize</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">See repeated language, emotional tone, and loops without clinical labels.</p>
          </div>
          <div>
            <h2 className="font-semibold">Integrate</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Leave with one prompt or small action that keeps agency intact.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
