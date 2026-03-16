// BescheidBoxer PDF Export Service
// Generates professionally formatted German legal letters and calculator results as PDF

import jsPDF from 'jspdf'

// === LAYOUT CONSTANTS ===

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_LEFT = 25
const MARGIN_RIGHT = 20
const MARGIN_TOP = 20
const MARGIN_BOTTOM = 25
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

const COLOR_BLUE = '#2563eb'
const COLOR_GRAY = '#6b7280'
const COLOR_DARK = '#111827'
const COLOR_LIGHT_BLUE = '#eff6ff'

const FONT_SIZE_LOGO = 16
const FONT_SIZE_TAGLINE = 8
const FONT_SIZE_TITLE = 14
const FONT_SIZE_BODY = 11
const FONT_SIZE_SMALL = 9
const FONT_SIZE_FOOTER = 7

const LINE_HEIGHT_FACTOR = 1.4

// === HELPER FUNCTIONS ===

/**
 * Splits text into lines that fit within maxWidth (in mm).
 * Handles explicit line breaks (\n) and word wrapping.
 */
export function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }

    const words = paragraph.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = doc.getTextWidth(testLine)

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines
}

/** Returns the current date formatted as DD.MM.YYYY */
function formatDateDE(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return `${day}.${month}.${year}`
}

/** Returns the current date as YYYY-MM-DD for filenames */
function formatDateISO(): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return `${year}-${month}-${day}`
}

/** Converts a hex color string to RGB tuple */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return [r, g, b]
}

/** Generates a URL-safe slug from a string */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// === SHARED PDF COMPONENTS ===

/** Renders the BescheidBoxer header with logo area and separator line */
function renderHeader(doc: jsPDF): number {
  let y = MARGIN_TOP

  // Logo text: "BescheidBoxer" in blue bold
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_LOGO)
  doc.setTextColor(...hexToRgb(COLOR_BLUE))
  doc.text('BescheidBoxer', MARGIN_LEFT, y)
  y += 5

  // Tagline below logo
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_TAGLINE)
  doc.setTextColor(...hexToRgb(COLOR_GRAY))
  doc.text('Dein KI-Kampfpartner', MARGIN_LEFT, y)
  y += 4

  // Thin blue separator line
  doc.setDrawColor(...hexToRgb(COLOR_BLUE))
  doc.setLineWidth(0.5)
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
  y += 8

  return y
}

/** Renders the footer on each page with disclaimer and page number */
function renderFooter(doc: jsPDF, pageNumber: number, totalPages: number): void {
  const footerY = PAGE_HEIGHT - MARGIN_BOTTOM + 15

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_FOOTER)
  doc.setTextColor(...hexToRgb(COLOR_GRAY))

  // Centered disclaimer
  const disclaimer = 'Erstellt mit BescheidBoxer.de - Keine Rechtsberatung'
  doc.text(disclaimer, PAGE_WIDTH / 2, footerY, { align: 'center' })

  // Page number
  const pageText = `Seite ${pageNumber} von ${totalPages}`
  doc.text(pageText, PAGE_WIDTH / 2, footerY + 4, { align: 'center' })
}

/**
 * Checks if a new line would exceed the printable area.
 * If so, adds a new page and returns the new Y position after the header.
 */
function checkPageBreak(doc: jsPDF, currentY: number, requiredHeight: number): number {
  const maxY = PAGE_HEIGHT - MARGIN_BOTTOM
  if (currentY + requiredHeight > maxY) {
    doc.addPage()
    return renderHeader(doc)
  }
  return currentY
}

/** Applies footers to all pages after content is fully rendered */
function applyFooters(doc: jsPDF): void {
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    renderFooter(doc, i, totalPages)
  }
}

// === LETTER PDF GENERATION ===

/**
 * Generates a professionally formatted German legal letter PDF
 * and triggers automatic download.
 *
 * @param letterText - The full letter content text
 * @param templateTitle - The title/name of the letter template
 * @param category - The category of the letter (e.g., "Widerspruch", "Antrag")
 */
export function generateLetterPdf(
  letterText: string,
  templateTitle: string,
  category: string,
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let y = renderHeader(doc)

  // Date on the right side
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.setTextColor(...hexToRgb(COLOR_DARK))
  const dateStr = formatDateDE()
  doc.text(dateStr, PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })

  // Category badge
  const badgeWidth = doc.getTextWidth(category) + 8
  const badgeHeight = 6
  const badgeX = MARGIN_LEFT
  const badgeY = y - 4

  doc.setFillColor(...hexToRgb(COLOR_LIGHT_BLUE))
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'F')
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.setTextColor(...hexToRgb(COLOR_BLUE))
  doc.text(category, badgeX + 4, y)
  y += 10

  // Template title
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_TITLE)
  doc.setTextColor(...hexToRgb(COLOR_DARK))

  const titleLines = wrapText(doc, templateTitle, CONTENT_WIDTH)
  for (const line of titleLines) {
    y = checkPageBreak(doc, y, 7)
    doc.text(line, MARGIN_LEFT, y)
    y += 7
  }
  y += 6

  // Thin separator below title
  doc.setDrawColor(...hexToRgb(COLOR_GRAY))
  doc.setLineWidth(0.2)
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y)
  y += 8

  // Letter body content
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_BODY)
  doc.setTextColor(...hexToRgb(COLOR_DARK))

  const lineHeight = FONT_SIZE_BODY * 0.3528 * LINE_HEIGHT_FACTOR // pt to mm conversion
  const wrappedLines = wrapText(doc, letterText, CONTENT_WIDTH)

  for (const line of wrappedLines) {
    if (line === '') {
      // Empty line = paragraph break, add extra spacing
      y += lineHeight * 0.6
    } else {
      y = checkPageBreak(doc, y, lineHeight)
      doc.text(line, MARGIN_LEFT, y)
      y += lineHeight
    }
  }

  // Apply footers to all pages
  applyFooters(doc)

  // Trigger download
  const slug = slugify(templateTitle)
  const filename = `bescheidboxer-${slug}-${formatDateISO()}.pdf`
  doc.save(filename)
}

// === RECHNER PDF GENERATION ===

export interface RechnerSection {
  label: string
  value: string
  highlight?: boolean
}

export interface RechnerGesamt {
  label: string
  value: string
}

/**
 * Generates a calculator results PDF in table format
 * and triggers automatic download.
 *
 * @param title - The title of the calculator / result summary
 * @param sections - Array of label-value rows to display
 * @param gesamtBetrag - Optional total amount row displayed at the bottom in bold
 */
export function generateRechnerPdf(
  title: string,
  sections: RechnerSection[],
  gesamtBetrag?: RechnerGesamt,
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  let y = renderHeader(doc)

  // Date on the right side
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.setTextColor(...hexToRgb(COLOR_DARK))
  doc.text(formatDateDE(), PAGE_WIDTH - MARGIN_RIGHT, y, { align: 'right' })
  y += 4

  // Title
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_TITLE)
  doc.setTextColor(...hexToRgb(COLOR_DARK))

  const titleLines = wrapText(doc, title, CONTENT_WIDTH)
  for (const line of titleLines) {
    y = checkPageBreak(doc, y, 7)
    doc.text(line, MARGIN_LEFT, y)
    y += 7
  }
  y += 6

  // Table layout constants
  const tableX = MARGIN_LEFT
  const tableWidth = CONTENT_WIDTH
  const labelColWidth = tableWidth * 0.65
  const valueColWidth = tableWidth * 0.35
  const rowHeight = 9
  const cellPadding = 3

  // Table header
  y = checkPageBreak(doc, y, rowHeight)
  doc.setFillColor(...hexToRgb(COLOR_BLUE))
  doc.rect(tableX, y, tableWidth, rowHeight, 'F')
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(FONT_SIZE_SMALL)
  doc.setTextColor(255, 255, 255)
  doc.text('Position', tableX + cellPadding, y + 6)
  doc.text('Betrag', tableX + labelColWidth + cellPadding, y + 6)
  y += rowHeight

  // Table rows
  doc.setFontSize(FONT_SIZE_SMALL)

  for (const section of sections) {
    y = checkPageBreak(doc, y, rowHeight)

    // Row background
    if (section.highlight) {
      doc.setFillColor(...hexToRgb(COLOR_LIGHT_BLUE))
      doc.rect(tableX, y, tableWidth, rowHeight, 'F')
    }

    // Row border bottom
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.2)
    doc.line(tableX, y + rowHeight, tableX + tableWidth, y + rowHeight)

    // Label
    doc.setFont('Helvetica', section.highlight ? 'bold' : 'normal')
    doc.setTextColor(...hexToRgb(COLOR_DARK))

    const labelText = doc.getTextWidth(section.label) > labelColWidth - cellPadding * 2
      ? section.label.substring(0, Math.floor(section.label.length * 0.8)) + '...'
      : section.label
    doc.text(labelText, tableX + cellPadding, y + 6)

    // Value (right-aligned within value column)
    doc.setFont('Helvetica', section.highlight ? 'bold' : 'normal')
    doc.text(
      section.value,
      tableX + labelColWidth + valueColWidth - cellPadding,
      y + 6,
      { align: 'right' },
    )

    y += rowHeight
  }

  // GesamtBetrag row
  if (gesamtBetrag) {
    y += 2
    y = checkPageBreak(doc, y, rowHeight + 2)

    // Double line above total
    doc.setDrawColor(...hexToRgb(COLOR_DARK))
    doc.setLineWidth(0.5)
    doc.line(tableX, y, tableX + tableWidth, y)
    y += 1
    doc.setLineWidth(0.2)
    doc.line(tableX, y, tableX + tableWidth, y)
    y += 1

    // Total row with blue background
    doc.setFillColor(...hexToRgb(COLOR_BLUE))
    doc.rect(tableX, y, tableWidth, rowHeight + 2, 'F')

    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(FONT_SIZE_BODY)
    doc.setTextColor(255, 255, 255)
    doc.text(gesamtBetrag.label, tableX + cellPadding, y + 7)
    doc.text(
      gesamtBetrag.value,
      tableX + labelColWidth + valueColWidth - cellPadding,
      y + 7,
      { align: 'right' },
    )
  }

  // Apply footers to all pages
  applyFooters(doc)

  // Trigger download
  const filename = `bescheidboxer-rechner-${formatDateISO()}.pdf`
  doc.save(filename)
}
