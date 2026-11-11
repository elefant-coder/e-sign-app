import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { SignaturePosition } from '@/types'

interface EmbedSignatureOptions {
  pdfBytes: ArrayBuffer | Uint8Array
  signatureText: string
  position: SignaturePosition
  fontBytes?: ArrayBuffer | Uint8Array
}

// Cache for the Japanese font
let cachedFontBytes: Uint8Array | null = null

/**
 * Loads the Noto Sans JP font for Japanese text rendering
 */
export async function loadJapaneseFont(): Promise<Uint8Array> {
  if (cachedFontBytes) {
    return cachedFontBytes
  }

  try {
    const fontPath = join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Regular.ttf')
    cachedFontBytes = await readFile(fontPath)
    return cachedFontBytes
  } catch (error) {
    console.error('Failed to load Japanese font:', error)
    throw new Error('日本語フォントの読み込みに失敗しました')
  }
}

/**
 * Embeds a text signature into a PDF at the specified position.
 * If fontBytes is provided (e.g., Noto Sans JP), it will use the custom font.
 * Otherwise, it falls back to Helvetica.
 */
export async function embedSignature({
  pdfBytes,
  signatureText,
  position,
  fontBytes,
}: EmbedSignatureOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)

  // Register fontkit for custom fonts
  pdfDoc.registerFontkit(fontkit)

  // Load font - use custom font if provided, otherwise fallback to Helvetica
  let font
  if (fontBytes) {
    try {
      font = await pdfDoc.embedFont(fontBytes)
    } catch (error) {
      console.error('Failed to embed custom font, falling back to Helvetica:', error)
      font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    }
  } else {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  }

  // Get the page (1-indexed in UI, 0-indexed in pdf-lib)
  const pageIndex = position.page - 1
  if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
    throw new Error('Invalid page number')
  }

  const page = pdfDoc.getPage(pageIndex)
  const { height: pageHeight } = page.getSize()

  // Split text by whitespace (full-width or half-width)
  const lines = signatureText.split(/[\s　]+/).filter(Boolean)

  // Calculate font size based on height and number of lines
  const lineHeight = position.height / lines.length
  const fontSize = Math.min(14, lineHeight * 0.8)
  const actualLineHeight = fontSize * 1.5

  // Draw each line
  // PDF coordinates: origin at bottom-left, y increases upward
  // UI coordinates: origin at top-left, y increases downward
  // Convert y position: PDF y = pageHeight - UI y
  const startY = pageHeight - position.y - fontSize

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: position.x + 5, // Add some padding
      y: startY - index * actualLineHeight,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
  })

  return pdfDoc.save()
}

/**
 * Downloads PDF from Supabase Storage and returns as ArrayBuffer
 */
export async function downloadPdfFromStorage(
  supabase: any,
  bucket: string,
  path: string
): Promise<ArrayBuffer> {
  const { data, error } = await supabase.storage.from(bucket).download(path)

  if (error || !data) {
    throw new Error('Failed to download PDF from storage')
  }

  return data.arrayBuffer()
}

/**
 * Uploads PDF to Supabase Storage
 */
export async function uploadPdfToStorage(
  supabase: any,
  bucket: string,
  path: string,
  pdfBytes: Uint8Array
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(path, pdfBytes, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (error) {
    throw new Error('Failed to upload PDF to storage')
  }
}
