import { readFile } from "node:fs/promises"
import { extname } from "node:path"
import { extractDocxParagraphs } from "./curriculum-docx.js"

export type ExtractedSourceTextSection = {
  headingPath: string[]
  sectionType: string
  paragraphStart: number
  paragraphEnd: number
  canonicalText: string
}

export type ExtractedSourceText = {
  parser: "docx" | "pdf"
  paragraphCount: number
  sections: ExtractedSourceTextSection[]
}

export async function extractSourceText(filePath: string, title: string, sectionType: string): Promise<ExtractedSourceText> {
  const extension = extname(filePath).toLowerCase()
  if (extension === ".docx") {
    const paragraphs = await extractDocxParagraphs(filePath)
    return {
      parser: "docx",
      paragraphCount: paragraphs.length,
      sections: [{
        headingPath: [title],
        sectionType,
        paragraphStart: 1,
        paragraphEnd: paragraphs.length,
        canonicalText: paragraphs.join("\n").trim(),
      }],
    }
  }

  if (extension === ".pdf") {
    return extractPdfSourceText(filePath, title, sectionType)
  }

  throw new Error(`Unsupported source text file extension: ${extension || "none"}`)
}

export async function extractPdfSourceText(filePath: string, title: string, sectionType: string): Promise<ExtractedSourceText> {
  const { PDFParse } = await import("pdf-parse")
  const buffer = await readFile(filePath)
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  try {
    const result = await parser.getText()
    const sections = result.pages.map((page) => {
      const paragraphs = normalizePdfTextToParagraphs(page.text)
      return {
        headingPath: [title, `Page ${page.num}`],
        sectionType,
        paragraphStart: page.num,
        paragraphEnd: page.num,
        canonicalText: paragraphs.join("\n").trim(),
      }
    }).filter((section) => section.canonicalText.length > 0)

    return {
      parser: "pdf",
      paragraphCount: sections.reduce((sum, section) => sum + section.canonicalText.split("\n").filter(Boolean).length, 0),
      sections,
    }
  } finally {
    await parser.destroy()
  }
}

export function normalizePdfTextToParagraphs(text: string) {
  return text
    .replace(/\r/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/[ \t]+\n/g, "\n").replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

export function isSupportedSourceTextFile(filePath: string | null | undefined): filePath is string {
  if (!filePath) return false
  return [".docx", ".pdf"].includes(extname(filePath).toLowerCase())
}
