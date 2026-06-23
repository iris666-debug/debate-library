import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export const MAX_PDF_CHARS = 300000

export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageCount = pdf.numPages

  let text = ''
  let truncated = false

  for (let i = 1; i <= pageCount; i++) {
    if (text.length >= MAX_PDF_CHARS) {
      truncated = true
      break
    }
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    text += pageText + '\n'
  }

  const isEmpty = text.trim().length === 0

  return {
    text: text.slice(0, MAX_PDF_CHARS),
    truncated,
    pageCount,
    isEmpty,
  }
}
