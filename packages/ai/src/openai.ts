import OpenAI from "openai"

let openaiClient: OpenAI | null = null

export function getOpenAIClient() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openaiClient
}

export const reflectiveModel = process.env.OPENAI_MODEL ?? "gpt-5-mini"

export function isOpenAIConfigured() {
  const apiKey = process.env.OPENAI_API_KEY

  return Boolean(apiKey && apiKey.startsWith("sk-") && apiKey.length > 50 && !apiKey.includes("your-"))
}
