import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Input } from "@inner-avatar/ui/input"
import { Textarea } from "@inner-avatar/ui/textarea"
import { ENGLISH_PRICING_DEFAULTS, getPricingPageContent, prisma, type PricingPlanContent } from "@inner-avatar/db"
import { AdminStatusBanner } from "@/components/admin-status-banner"
import { SubmitButton } from "@/components/submit-button"
import { upsertPricingPageAction, upsertPricingPlanAction } from "./actions"

export const dynamic = "force-dynamic"

const STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  "page-saved": { tone: "success", message: "Pricing page copy saved." },
  "plan-saved": { tone: "success", message: "Pricing plan saved." },
  invalid: { tone: "error", message: "Pricing changes need valid fields and a reason of at least 10 characters." },
}

export default async function PricingAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? STATUS_MESSAGES[status] : null
  const pricing = await getPricingPageContent(prisma, ENGLISH_PRICING_DEFAULTS, { includeHiddenPlans: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pricing Page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CMS copy and display controls for the public pricing page. Stripe price IDs remain environment-managed.
        </p>
      </div>
      <AdminStatusBanner message={statusMessage} />

      <Card>
        <CardHeader>
          <CardTitle>Page Copy</CardTitle>
          <p className="text-sm text-muted-foreground">
            These fields control the hero, badges, checkout messages, and global labels.
          </p>
        </CardHeader>
        <CardContent>
          <form action={upsertPricingPageAction} className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" name="active" defaultChecked />
              Use CMS pricing page copy
            </label>
            <TextField name="eyebrow" label="Eyebrow" value={pricing.eyebrow} />
            <TextField name="recommendedLabel" label="Recommended badge" value={pricing.recommended} />
            <TextField name="titleA" label="Title line 1" value={pricing.titleA} />
            <TextField name="titleB" label="Title emphasis" value={pricing.titleB} />
            <TextareaField name="body" label="Body" value={pricing.body} className="md:col-span-2" />
            <TextField name="cadenceAlways" label="Free cadence label" value={pricing.cadenceAlways} />
            <TextField name="cadenceMonth" label="Paid cadence label" value={pricing.cadenceMonth} />
            <TextareaField name="billingDisabledNotice" label="Billing disabled notice" value={pricing.billingDisabledNotice} className="md:col-span-2" />
            <TextField name="checkoutDisabled" label="Checkout disabled card note" value={pricing.checkoutDisabled} />
            <TextField name="continueFree" label="Signed-in free CTA" value={pricing.continueFree} />
            <TextField name="signInFor" label="Guest paid CTA template" value={pricing.signInFor} />
            <TextareaField name="statusInvalidPlan" label="Invalid plan message" value={pricing.status.invalidPlan} />
            <TextareaField name="statusCancelled" label="Checkout cancelled message" value={pricing.status.cancelled} />
            <TextareaField name="statusUnavailable" label="Checkout unavailable message" value={pricing.status.unavailable} />
            <label className="grid gap-1 text-xs font-medium md:col-span-2">
              Reason
              <Input name="reason" placeholder="Reason required" required minLength={10} />
            </label>
            <SubmitButton className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" pendingLabel="Saving pricing page...">
              Save page copy
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {pricing.plans.map((plan) => (
          <PlanEditor key={plan.key} plan={plan} />
        ))}
      </div>
    </div>
  )
}

function PlanEditor({ plan }: { plan: PricingPlanContent }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Public plan key: {plan.key}. Billing plan controls checkout routing only for Starter and Pro.
        </p>
      </CardHeader>
      <CardContent>
        <form action={upsertPricingPlanAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="planKey" value={plan.key} />
          <TextField name="name" label="Plan name" value={plan.name} />
          <TextField name="price" label="Displayed price" value={plan.price} />
          <TextField name="cta" label="CTA label" value={plan.cta} />
          <label className="grid gap-1 text-xs font-medium">
            Display order
            <Input name="displayOrder" type="number" min={0} max={100} defaultValue={plan.displayOrder} required />
          </label>
          <TextareaField name="description" label="Description" value={plan.description} className="md:col-span-2" />
          <label className="grid gap-1 text-xs font-medium md:col-span-2">
            Features
            <Textarea name="features" defaultValue={plan.features.join("\n")} rows={5} />
          </label>
          <fieldset className="grid gap-3 rounded-lg border p-4 md:col-span-2 md:grid-cols-3">
            <legend className="px-1 text-xs font-semibold">Display</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="visible" defaultChecked={plan.visible} />
              Visible
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={plan.featured} />
              Featured
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Billing plan
              <select name="billingPlan" defaultValue={plan.billingPlan ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="">No paid checkout</option>
                <option value="starter">Starter checkout</option>
                <option value="pro">Pro checkout</option>
              </select>
            </label>
          </fieldset>
          <label className="grid gap-1 text-xs font-medium md:col-span-2">
            Reason
            <Input name="reason" placeholder="Reason required" required minLength={10} />
          </label>
          <SubmitButton className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" pendingLabel="Saving pricing plan...">
            Save {plan.name}
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}

function TextField({
  name,
  label,
  value,
}: {
  name: string
  label: string
  value: string
}) {
  return (
    <label className="grid gap-1 text-xs font-medium">
      {label}
      <Input name={name} defaultValue={value} />
    </label>
  )
}

function TextareaField({
  name,
  label,
  value,
  className,
}: {
  name: string
  label: string
  value: string
  className?: string
}) {
  return (
    <label className={`grid gap-1 text-xs font-medium ${className ?? ""}`}>
      {label}
      <Textarea name={name} defaultValue={value} rows={4} />
    </label>
  )
}
