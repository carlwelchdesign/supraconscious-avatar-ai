import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-10">
        <Link href="/" className="text-sm text-muted-foreground">
          Inner Avatar
        </Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-normal">Pricing</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Start with the journaling loop. Billing is scaffolded for Stripe and ready for plan wiring.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["Free", "Starter", "Pro"].map((plan) => (
          <Card key={plan}>
            <CardHeader>
              <CardTitle>{plan}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6">
              <p className="text-muted-foreground">Reflective journaling, safe analysis, and pattern-aware prompts.</p>
              <Button className="w-full" variant={plan === "Starter" ? "default" : "outline"}>
                Choose {plan}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
