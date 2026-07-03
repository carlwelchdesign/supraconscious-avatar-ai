import { readFile } from "node:fs/promises"
import { basename } from "node:path"
import { inflateRawSync } from "node:zlib"
import {
  registerSourceDocument,
  type CurriculumDayInput,
  upsertCurriculumDay,
} from "./source-ingestion.js"

const MONTHS = new Map([
  ["january", 1],
  ["february", 2],
  ["march", 3],
  ["april", 4],
  ["may", 5],
  ["june", 6],
  ["july", 7],
  ["august", 8],
  ["september", 9],
  ["october", 10],
  ["november", 11],
  ["december", 12],
])

const FIELD_LABELS = new Set(["quote", "frame of thought", "socratic question"])

export type CurriculumImportOptions = {
  title?: string
  month?: number
  theme?: string
  publishState?: string
}

export async function importCurriculumDocx(filePath: string, options: CurriculumImportOptions = {}) {
  const paragraphs = await extractDocxParagraphs(filePath)
  const days = parseCurriculumDaysFromParagraphs(paragraphs, options)
  const document = await registerSourceDocument({
    title: options.title ?? basename(filePath).replace(/\.docx$/i, ""),
    author: "Maria Olon Tsaroucha",
    sourceType: "curriculum",
    filePath,
    text: paragraphs.join("\n"),
    rightsStatus: "needs_review",
    reviewState: "parsed",
    metadata: {
      parser: "curriculum-docx-v1",
      paragraphCount: paragraphs.length,
      importedDays: days.length,
    },
  })

  const curriculumDays = await Promise.all(days.map((day) => upsertCurriculumDay(document.id, day)))
  return { document, curriculumDays }
}

export async function extractDocxParagraphs(filePath: string) {
  const buffer = await readFile(filePath)
  const xml = extractZipEntryText(buffer, "word/document.xml")
  return parseParagraphText(xml)
}

export function parseCurriculumDaysFromParagraphs(
  paragraphs: string[],
  options: CurriculumImportOptions = {},
): CurriculumDayInput[] {
  const cleaned = paragraphs.map(cleanText).filter(Boolean)
  const month = options.month ?? inferMonth(cleaned)
  if (!month) {
    throw new Error("Unable to infer curriculum month from DOCX headings.")
  }

  const firstDayIndex = cleaned.findIndex((line) => /^day\s+\d+$/i.test(line))
  const theme =
    options.theme ??
    cleaned.slice(0, Math.max(firstDayIndex, 0)).find((line) => !MONTHS.has(line.toLowerCase()) && !/^days?\s+/i.test(line)) ??
    "Daily Reflection"

  const days: CurriculumDayInput[] = []
  for (let index = firstDayIndex; index >= 0 && index < cleaned.length;) {
    const dayMatch = /^day\s+(\d+)$/i.exec(cleaned[index] ?? "")
    if (!dayMatch) {
      index += 1
      continue
    }

    const day = Number(dayMatch[1])
    const nextDayIndex = cleaned.findIndex((line, candidateIndex) => candidateIndex > index && /^day\s+\d+$/i.test(line))
    const block = cleaned.slice(index + 1, nextDayIndex === -1 ? cleaned.length : nextDayIndex)
    const quote = readField(block, "quote")
    const frameOfThought = readField(block, "frame of thought")
    const socraticQuestion = readField(block, "socratic question")

    if (frameOfThought && socraticQuestion) {
      days.push({
        month,
        day,
        theme,
        title: `${theme} - Day ${day}`,
        quote,
        frameOfThought,
        socraticQuestion,
        publishState: options.publishState ?? "needs_review",
        metadata: { parser: "curriculum-docx-v1" },
      })
    }

    index = nextDayIndex === -1 ? cleaned.length : nextDayIndex
  }

  return days
}

function extractZipEntryText(buffer: Buffer, fileName: string) {
  const centralDirectoryOffset = findCentralDirectoryOffset(buffer)
  let offset = centralDirectoryOffset

  while (offset < buffer.length - 46 && buffer.readUInt32LE(offset) === 0x02014b50) {
    const compression = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)
    const nameStart = offset + 46
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8")

    if (name === fileName) {
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28)
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength
      const data = buffer.subarray(dataStart, dataStart + compressedSize)
      if (compression === 0) return data.toString("utf8")
      if (compression === 8) return inflateRawSync(data).toString("utf8")
      throw new Error(`Unsupported DOCX compression method: ${compression}`)
    }

    offset = nameStart + nameLength + extraLength + commentLength
  }

  throw new Error(`DOCX entry not found: ${fileName}`)
}

function findCentralDirectoryOffset(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return buffer.readUInt32LE(offset + 16)
    }
  }
  throw new Error("DOCX central directory not found.")
}

function parseParagraphText(xml: string) {
  return Array.from(xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g))
    .map((paragraph) =>
      Array.from(paragraph[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g))
        .map((text) => decodeXml(text[1] ?? ""))
        .join(""),
    )
    .map(cleanText)
    .filter(Boolean)
}

function readField(block: string[], label: string) {
  const labelIndex = block.findIndex((line) => line.toLowerCase() === label)
  if (labelIndex === -1) return undefined
  const parts: string[] = []
  for (let index = labelIndex + 1; index < block.length; index += 1) {
    if (FIELD_LABELS.has(block[index].toLowerCase())) break
    parts.push(block[index])
  }
  return parts.join(" ").trim() || undefined
}

function inferMonth(lines: string[]) {
  for (const line of lines.slice(0, 8)) {
    const month = MONTHS.get(line.toLowerCase())
    if (month) return month
  }
  return undefined
}

function cleanText(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim()
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}
