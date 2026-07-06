export function buildAccountExportFilename(email: string, exportedAt: string) {
  const date = exportedAt.slice(0, 10) || "export"
  const safeEmail = email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._+-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "account"

  return `supraconscious-account-export-${safeEmail}-${date}.json`
}

export function buildAccountExportHeaders(email: string, exportedAt: string) {
  const filename = buildAccountExportFilename(email, exportedAt)

  return {
    "Cache-Control": "no-store, max-age=0",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Type": "application/json; charset=utf-8",
  }
}
