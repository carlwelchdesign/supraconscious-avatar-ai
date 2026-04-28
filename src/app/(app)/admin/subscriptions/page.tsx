import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdminUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export default async function AdminSubscriptionsPage() {
  await requireAdminUser()
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">Subscriptions</h1>
      {subscriptions.length ? (
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm">
                <div>
                  <p className="font-medium">{subscription.user.name || subscription.user.email}</p>
                  <p className="text-muted-foreground">{subscription.user.email}</p>
                </div>
                <p>{subscription.plan}</p>
                <p className="text-muted-foreground">{subscription.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Subscriptions Yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Stripe subscription syncing will populate this table.</CardContent>
        </Card>
      )}
    </div>
  )
}
