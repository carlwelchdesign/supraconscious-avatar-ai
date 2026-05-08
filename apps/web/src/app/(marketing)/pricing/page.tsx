import Link from "next/link"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { Button } from "@inner-avatar/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { startCheckoutAction } from "./actions"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "A simple place to begin reflective journaling.",
    features: ["Manual journaling", "Grounded safety handling", "Limited reflection history"],
  },
  {
    name: "Starter",
    price: "$9",
    plan: "starter",
    description: "The core AI-guided journaling loop for regular reflection.",
    features: ["AI reflections", "Personalized prompts", "Pattern memory", "Voice transcription"],
  },
  {
    name: "Pro",
    price: "$19",
    plan: "pro",
    description: "Deeper pattern review and richer Avatar continuity.",
    features: ["Everything in Starter", "Expanded pattern dashboard", "Avatar progression", "Priority AI usage"],
  },
] as const

export default async function PricingPage() {
  const user = await getCurrentUser()

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-10">
        <Link href="/" className="text-sm text-muted-foreground">
          Inner Avatar
        </Link>
        <h1 className="mt-6 text-4xl font-semibold tracking-normal">Pricing</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Choose a reflection plan. Paid plans use Stripe Checkout and can be managed from settings.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.name === "Starter" ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-3xl font-semibold">
                {plan.price}
                <span className="text-sm font-normal text-muted-foreground"> / month</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-5 text-sm leading-6">
              <p className="text-muted-foreground">{plan.description}</p>
              <ul className="space-y-2 text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              {"plan" in plan ? (
                <form action={startCheckoutAction}>
                  <input type="hidden" name="plan" value={plan.plan} />
                  <Button className="w-full" variant={plan.name === "Starter" ? "default" : "outline"}>
                    {user ? `Choose ${plan.name}` : `Sign in for ${plan.name}`}
                  </Button>
                </form>
              ) : (
                <Button className="w-full" variant="outline" asChild>
                  <Link href={user ? "/journal" : "/register"}>{user ? "Continue Free" : "Start Free"}</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}
