"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { parsePricingPageForm, parsePricingPlanForm } from "@/lib/pricing-admin-validation"

export async function upsertPricingPageAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = parsePricingPageForm({
    active: formData.get("active"),
    eyebrow: formData.get("eyebrow"),
    titleA: formData.get("titleA"),
    titleB: formData.get("titleB"),
    body: formData.get("body"),
    recommendedLabel: formData.get("recommendedLabel"),
    cadenceAlways: formData.get("cadenceAlways"),
    cadenceMonth: formData.get("cadenceMonth"),
    billingDisabledNotice: formData.get("billingDisabledNotice"),
    checkoutDisabled: formData.get("checkoutDisabled"),
    signInFor: formData.get("signInFor"),
    continueFree: formData.get("continueFree"),
    statusInvalidPlan: formData.get("statusInvalidPlan"),
    statusCancelled: formData.get("statusCancelled"),
    statusUnavailable: formData.get("statusUnavailable"),
    reason: formData.get("reason"),
  })
  if (!parsed) {
    redirect("/pricing?status=invalid")
  }

  const page = await prisma.pricingPageConfig.upsert({
    where: { key: "default" },
    create: {
      key: "default",
      active: parsed.active,
      eyebrow: parsed.eyebrow,
      titleA: parsed.titleA,
      titleB: parsed.titleB,
      body: parsed.body,
      recommendedLabel: parsed.recommendedLabel,
      cadenceAlways: parsed.cadenceAlways,
      cadenceMonth: parsed.cadenceMonth,
      billingDisabledNotice: parsed.billingDisabledNotice,
      checkoutDisabled: parsed.checkoutDisabled,
      signInFor: parsed.signInFor,
      continueFree: parsed.continueFree,
      statusInvalidPlan: parsed.statusInvalidPlan,
      statusCancelled: parsed.statusCancelled,
      statusUnavailable: parsed.statusUnavailable,
    },
    update: {
      active: parsed.active,
      eyebrow: parsed.eyebrow,
      titleA: parsed.titleA,
      titleB: parsed.titleB,
      body: parsed.body,
      recommendedLabel: parsed.recommendedLabel,
      cadenceAlways: parsed.cadenceAlways,
      cadenceMonth: parsed.cadenceMonth,
      billingDisabledNotice: parsed.billingDisabledNotice,
      checkoutDisabled: parsed.checkoutDisabled,
      signInFor: parsed.signInFor,
      continueFree: parsed.continueFree,
      statusInvalidPlan: parsed.statusInvalidPlan,
      statusCancelled: parsed.statusCancelled,
      statusUnavailable: parsed.statusUnavailable,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "pricing_page_config.upsert",
      targetType: "PricingPageConfig",
      targetId: page.id,
      reason: parsed.reason,
      metadata: { key: page.key, active: page.active },
    },
  })

  revalidatePricingRoutes()
  redirect("/pricing?status=page-saved")
}

export async function upsertPricingPlanAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = parsePricingPlanForm({
    planKey: formData.get("planKey"),
    displayOrder: formData.get("displayOrder"),
    visible: formData.get("visible"),
    featured: formData.get("featured"),
    name: formData.get("name"),
    price: formData.get("price"),
    description: formData.get("description"),
    features: formData.get("features"),
    cta: formData.get("cta"),
    billingPlan: formData.get("billingPlan"),
    reason: formData.get("reason"),
  })
  if (!parsed) {
    redirect("/pricing?status=invalid")
  }

  const plan = await prisma.pricingPlanConfig.upsert({
    where: { planKey: parsed.planKey },
    create: {
      planKey: parsed.planKey,
      displayOrder: parsed.displayOrder,
      visible: parsed.visible,
      featured: parsed.featured,
      name: parsed.name,
      price: parsed.price,
      description: parsed.description,
      features: parsed.features,
      cta: parsed.cta,
      billingPlan: parsed.billingPlan,
    },
    update: {
      displayOrder: parsed.displayOrder,
      visible: parsed.visible,
      featured: parsed.featured,
      name: parsed.name,
      price: parsed.price,
      description: parsed.description,
      features: parsed.features,
      cta: parsed.cta,
      billingPlan: parsed.billingPlan,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "pricing_plan_config.upsert",
      targetType: "PricingPlanConfig",
      targetId: plan.id,
      reason: parsed.reason,
      metadata: {
        planKey: plan.planKey,
        visible: plan.visible,
        featured: plan.featured,
        billingPlan: plan.billingPlan,
      },
    },
  })

  revalidatePricingRoutes()
  redirect("/pricing?status=plan-saved")
}

function revalidatePricingRoutes() {
  revalidatePath("/pricing")
}
