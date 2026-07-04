import { prisma } from "@inner-avatar/db"
import { activatePolicyFirstRag } from "../src/rag-activation-gate.js"
import { runKeywordRagEvals } from "../src/rag-eval.js"
import { runPilotCouncilEvals } from "../src/pilot-council-eval.js"

const actorEmail = process.env.INTERNAL_RAG_ACTOR_EMAIL
const actor = actorEmail
  ? await prisma.user.findUnique({ where: { email: actorEmail }, select: { id: true, email: true, role: true } })
  : await prisma.user.findFirst({
    where: { role: { in: ["super_admin", "admin"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, role: true },
  })

if (!actor || !["super_admin", "admin"].includes(actor.role)) {
  throw new Error("Internal RAG activation requires an admin or super_admin actor. Set INTERNAL_RAG_ACTOR_EMAIL if needed.")
}

const rag = runKeywordRagEvals()
const pilot = runPilotCouncilEvals()
if (!rag.passed || !pilot.passed) {
  throw new Error(`Activation blocked. RAG passed=${rag.passed}; pilot passed=${pilot.passed}.`)
}

const evalReport = {
  passed: true,
  rag: { passed: rag.passed, total: rag.total, failed: rag.failed },
  pilot: { passed: pilot.passed, total: pilot.total, failed: pilot.failed },
  rollbackCriteria: "Disable rag_enabled immediately if citation validation fails, quote leakage appears, unsupported-source reports cluster, no-source fallback copy becomes misleading, or safety bypass/RAG exclusion regresses.",
}

const result = await activatePolicyFirstRag({
  actorId: actor.id,
  reason: "Internal pilot RAG activation after keyword RAG evals and pilot council evals passed for the product-doctrine allowlist.",
  evalReportJson: JSON.stringify(evalReport),
})

console.log(JSON.stringify({
  activated: true,
  actor: actor.email,
  readiness: result.readiness,
  evalReport,
}, null, 2))
