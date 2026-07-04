if (process.env.INTERNAL_RAG_SMOKE_USE_OPENAI !== "true") {
  process.env.OPENAI_API_KEY = ""
}

const { runInternalRagSmoke } = await import("../src/internal-rag-smoke.js")

const report = await runInternalRagSmoke()
console.log(JSON.stringify(report, null, 2))

if (!report.passed) {
  process.exitCode = 1
}
