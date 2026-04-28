import { currentUser } from "@clerk/nextjs/server"
import { getAuthConfigurationMessage, isClerkConfigured, isLocalDemoAuthEnabled } from "@/lib/auth/config"
import { prisma } from "@/lib/db"

export async function requireAppUser() {
  if (isLocalDemoAuthEnabled()) {
    try {
      return await prisma.user.upsert({
        where: { clerkId: "local-demo-user" },
        create: {
          clerkId: "local-demo-user",
          email: "demo@inner-avatar.local",
          name: "Local Demo",
        },
        update: {},
      })
    } catch {
      const user = await prisma.user.findUnique({ where: { clerkId: "local-demo-user" } })
      if (user) return user
      throw new Error("Unable to create local demo user")
    }
  }

  if (!isClerkConfigured()) {
    throw new Error(getAuthConfigurationMessage())
  }

  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error("Unauthorized")
  }

  const email = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId)?.emailAddress
    ?? clerkUser.emailAddresses[0]?.emailAddress
    ?? `${clerkUser.id}@clerk.local`

  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username,
    },
    update: {
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username,
    },
  })
}
