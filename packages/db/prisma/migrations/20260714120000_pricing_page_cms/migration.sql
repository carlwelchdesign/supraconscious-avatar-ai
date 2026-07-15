-- CreateTable
CREATE TABLE "PricingPageConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "eyebrow" TEXT,
    "titleA" TEXT,
    "titleB" TEXT,
    "body" TEXT,
    "recommendedLabel" TEXT,
    "cadenceAlways" TEXT,
    "cadenceMonth" TEXT,
    "billingDisabledNotice" TEXT,
    "checkoutDisabled" TEXT,
    "signInFor" TEXT,
    "continueFree" TEXT,
    "statusInvalidPlan" TEXT,
    "statusCancelled" TEXT,
    "statusUnavailable" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPlanConfig" (
    "id" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "price" TEXT,
    "description" TEXT,
    "features" JSONB,
    "cta" TEXT,
    "billingPlan" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPlanConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingPageConfig_key_key" ON "PricingPageConfig"("key");

-- CreateIndex
CREATE INDEX "PricingPageConfig_active_idx" ON "PricingPageConfig"("active");

-- CreateIndex
CREATE UNIQUE INDEX "PricingPlanConfig_planKey_key" ON "PricingPlanConfig"("planKey");

-- CreateIndex
CREATE INDEX "PricingPlanConfig_visible_idx" ON "PricingPlanConfig"("visible");

-- CreateIndex
CREATE INDEX "PricingPlanConfig_displayOrder_idx" ON "PricingPlanConfig"("displayOrder");

-- CreateIndex
CREATE INDEX "PricingPlanConfig_billingPlan_idx" ON "PricingPlanConfig"("billingPlan");
