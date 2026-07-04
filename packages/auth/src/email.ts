import "server-only"

type SendTransactionalEmailInput = {
  to: string
  subject: string
  text: string
  html: string
}

export type TransactionalEmailResult = {
  delivered: boolean
  provider: "resend" | "none"
  reason?: string
}

export function isTransactionalEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM)
}

export async function sendTransactionalEmail(input: SendTransactionalEmailInput): Promise<TransactionalEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.AUTH_EMAIL_FROM

  if (!apiKey || !from) {
    return { delivered: false, provider: "none", reason: "email_not_configured" }
  }

  let response: Response
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    })
  } catch {
    return { delivered: false, provider: "resend", reason: "resend_network_error" }
  }

  if (!response.ok) {
    return { delivered: false, provider: "resend", reason: `resend_${response.status}` }
  }

  return { delivered: true, provider: "resend" }
}
