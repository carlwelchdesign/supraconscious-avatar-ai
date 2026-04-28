import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const reflectiveModel = process.env.OPENAI_MODEL ?? "gpt-5-mini"

export function isOpenAIConfigured() {
  const apiKey = process.env.OPENAI_API_KEY

  return Boolean(apiKey && apiKey.startsWith("sk-") && apiKey.length > 50 && !apiKey.includes("your-"))
}
