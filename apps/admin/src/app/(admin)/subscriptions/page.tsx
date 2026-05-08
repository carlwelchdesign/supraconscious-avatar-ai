import { prisma } from "@inner-avatar/db"
import { SubscriptionsTable } from "./subscriptions-table"

export default async function SubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, name: true } } },
    take: 100,
  })

  return (
    <SubscriptionsTable
      subscriptions={subscriptions.map((subscription) => ({
        id: subscription.id,
        userEmail: subscription.user.email,
        userName: subscription.user.name,
        plan: subscription.plan,
        status: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      }))}
    />
  )
}
