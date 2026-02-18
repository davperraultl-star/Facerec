import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, createWriteStream } from 'fs'
import PDFDocument from 'pdfkit'
import { getDataDirectory } from '../database/connection'
import { getVisit } from '../database/repository/visit.repository'
import { getPatient } from '../database/repository/patient.repository'
import { listTreatmentsForVisit } from '../database/repository/treatment.repository'
import { listAreasForTreatment } from '../database/repository/treatment-area.repository'
import { listPhotosForVisit } from '../database/repository/photo.repository'
import { listConsentsForVisit } from '../database/repository/consent.repository'
import { getAnnotationsForTreatment } from '../database/repository/annotation.repository'
import { getMultipleSettings } from '../database/repository/settings.repository'
import { getUser } from '../database/repository/user.repository'
import { getPortfolio, listPortfolioItems } from '../database/repository/portfolio.repository'
import { resolvePhotoPath } from './photo.service'

export interface ExportResult {
  path: string
  filename: string
}

function getExportsDir(): string {
  const dir = join(getDataDirectory(), 'exports')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '-')
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function exportVisitReport(visitId: string): Promise<ExportResult> {
  const visit = getVisit(visitId)
  if (!visit) throw new Error('Visit not found')

  const patient = getPatient(visit.patientId)
  if (!patient) throw new Error('Patient not found')

  const treatments = listTreatmentsForVisit(visitId)
  const photoRows = listPhotosForVisit(visitId)
  const consents = listConsentsForVisit(visitId)

  const settings = getMultipleSettings([
    'clinic_name',
    'provincial_tax_label',
    'provincial_tax_rate',
    'federal_tax_label',
    'federal_tax_rate'
  ])

  const clinicName = settings['clinic_name'] || 'ApexRec'
  const practitioner = visit.practitionerId ? getUser(visit.practitionerId) : null

  // Build filename
  const patientName = sanitizeFilename(`${patient.firstName}-${patient.lastName}`)
  const filename = `visit-report-${patientName}-${visit.date}.pdf`
  const outputPath = join(getExportsDir(), filename)

  return new Promise<ExportResult>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    })

    const stream = createWriteStream(outputPath)
    doc.pipe(stream)

    // ── Page 1: Patient Info + Visit Summary ──
    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(clinicName, { align: 'center' })
    doc.moveDown(0.3)
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text('Visit Report', { align: 'center' })
    doc.moveDown(1)

    // Divider
    doc
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .moveTo(50, doc.y)
      .lineTo(562, doc.y)
      .stroke()
    doc.moveDown(0.8)

    // Patient Info
    doc.fillColor('#000000')
    doc.fontSize(14).font('Helvetica-Bold').text('Patient Information')
    doc.moveDown(0.4)
    doc.fontSize(10).font('Helvetica')

    const infoLines = [
      `Name: ${patient.firstName} ${patient.lastName}`,
      patient.birthday ? `Date of Birth: ${patient.birthday}` : null,
      patient.sex ? `Sex: ${patient.sex}` : null,
      patient.ethnicity ? `Ethnicity: ${patient.ethnicity}` : null,
      patient.email ? `Email: ${patient.email}` : null,
      patient.cellPhone ? `Phone: ${patient.cellPhone}` : null,
      patient.city ? `City: ${patient.city}${patient.province ? ', ' + patient.province : ''}` : null
    ].filter(Boolean)

    for (const line of infoLines) {
      doc.text(line!)
    }

    doc.moveDown(1)

    // Visit Details
    doc.fontSize(14).font('Helvetica-Bold').text('Visit Details')
    doc.moveDown(0.4)
    doc.fontSize(10).font('Helvetica')
    doc.text(`Date: ${visit.date}`)
    if (visit.time) doc.text(`Time: ${visit.time}`)
    if (practitioner) doc.text(`Practitioner: ${practitioner.name}`)

    doc.moveDown(1)

    // Clinical Notes
    if (visit.clinicalNotes) {
      doc.fontSize(14).font('Helvetica-Bold').text('Clinical Notes')
      doc.moveDown(0.4)
      doc.fontSize(10).font('Helvetica')
      const notes = stripHtml(visit.clinicalNotes)
      doc.text(notes, { width: 512 })
      doc.moveDown(1)
    }

    // ── Page 2: Photos Grid ──
    if (photoRows.length > 0) {
      doc.addPage()
      doc.fontSize(14).font('Helvetica-Bold').text('Photos')
      doc.moveDown(0.6)

      const photoWidth = 160
      const photoHeight = 120
      const colCount = 3
      const gapX = 16
      const gapY = 30
      let col = 0
      let startY = doc.y

      for (const photo of photoRows) {
        const absPath = resolvePhotoPath(photo.originalPath)
        if (!existsSync(absPath)) continue

        const x = 50 + col * (photoWidth + gapX)
        const y = startY

        try {
          doc.image(absPath, x, y, {
            width: photoWidth,
            height: photoHeight,
            fit: [photoWidth, photoHeight]
          })
        } catch {
          // Skip unreadable images
        }

        // Label
        const label = [photo.photoPosition, photo.photoState].filter(Boolean).join(' - ')
        doc.fontSize(7).font('Helvetica').text(label, x, y + photoHeight + 2, {
          width: photoWidth,
          align: 'center'
        })

        col++
        if (col >= colCount) {
          col = 0
          startY += photoHeight + gapY
          if (startY > 650) {
            doc.addPage()
            startY = 50
          }
        }
      }
    }

    // ── Page 3: Treatment Records ──
    if (treatments.length > 0) {
      doc.addPage()
      doc.fontSize(14).font('Helvetica-Bold').text('Treatment Records')
      doc.moveDown(0.6)

      let subtotal = 0

      for (const tx of treatments) {
        doc.fontSize(11).font('Helvetica-Bold')
        const productLabel = [tx.productName, tx.productBrand].filter(Boolean).join(' — ')
        doc.text(productLabel || tx.treatmentType || 'Treatment')
        doc.moveDown(0.2)

        doc.fontSize(9).font('Helvetica').fillColor('#444444')
        if (tx.treatmentType) doc.text(`Type: ${tx.treatmentType}`)
        if (tx.lotNumber) doc.text(`Lot #: ${tx.lotNumber}`)
        if (tx.expiryDate) doc.text(`Expiry: ${tx.expiryDate}`)

        // Areas
        const areas = listAreasForTreatment(tx.id)
        if (areas.length > 0) {
          doc.moveDown(0.2)
          for (const area of areas) {
            const areaLine = `  ${area.treatedAreaName || 'Area'}: ${area.units || 0} units — $${(area.cost || 0).toFixed(2)}`
            doc.text(areaLine)
          }
        }

        const txCost = tx.totalCost || 0
        subtotal += txCost
        doc.moveDown(0.2)
        doc.font('Helvetica-Bold').text(`Total: ${tx.totalUnits || 0} units — $${txCost.toFixed(2)}`)
        doc.fillColor('#000000')
        doc.moveDown(0.6)

        // Divider
        doc
          .strokeColor('#eeeeee')
          .lineWidth(0.5)
          .moveTo(50, doc.y)
          .lineTo(562, doc.y)
          .stroke()
        doc.moveDown(0.4)
      }

      // Cost Summary
      doc.moveDown(0.5)
      doc.fontSize(10).font('Helvetica')

      const provRate = parseFloat(settings['provincial_tax_rate'] || '0')
      const fedRate = parseFloat(settings['federal_tax_rate'] || '0')
      const provLabel = settings['provincial_tax_label'] || 'Provincial Tax'
      const fedLabel = settings['federal_tax_label'] || 'Federal Tax'
      const provTax = subtotal * (provRate / 100)
      const fedTax = subtotal * (fedRate / 100)
      const total = subtotal + provTax + fedTax

      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, { align: 'right' })
      if (provRate > 0) {
        doc.text(`${provLabel} (${provRate}%): $${provTax.toFixed(2)}`, { align: 'right' })
      }
      if (fedRate > 0) {
        doc.text(`${fedLabel} (${fedRate}%): $${fedTax.toFixed(2)}`, { align: 'right' })
      }
      doc.font('Helvetica-Bold').text(`Total: $${total.toFixed(2)}`, { align: 'right' })
    }

    // ── Page 4: Annotations (simplified summary) ──
    if (treatments.length > 0) {
      let hasAnnotations = false
      for (const tx of treatments) {
        const annotations = getAnnotationsForTreatment(tx.id)
        if (annotations.length > 0) {
          if (!hasAnnotations) {
            doc.addPage()
            doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Injection Site Maps')
            doc.moveDown(0.6)
            hasAnnotations = true
          }

          const productLabel = [tx.productName, tx.productBrand].filter(Boolean).join(' — ')
          doc.fontSize(11).font('Helvetica-Bold').text(productLabel || 'Treatment')
          doc.moveDown(0.3)
          doc.fontSize(9).font('Helvetica')

          for (const ann of annotations) {
            try {
              const data = JSON.parse(ann.dataJson || '{}')
              const views = Object.keys(data)
              if (views.length > 0) {
                doc.text(`Views: ${views.join(', ')}`)
                for (const view of views) {
                  const points = data[view]
                  if (Array.isArray(points) && points.length > 0) {
                    doc.text(`  ${view}: ${points.length} injection point(s)`)
                  }
                }
              }
            } catch {
              doc.text('Annotation data available')
            }
          }
          doc.moveDown(0.6)
        }
      }
    }

    // ── Page 5: Consents ──
    if (consents.length > 0) {
      doc.addPage()
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Consent Records')
      doc.moveDown(0.6)

      for (const consent of consents) {
        doc.fontSize(11).font('Helvetica-Bold').text(`Type: ${consent.type}`)
        doc.fontSize(9).font('Helvetica')
        if (consent.signedAt) doc.text(`Signed: ${consent.signedAt}`)

        // Embed signature image if available
        if (consent.signatureData && consent.signatureData.startsWith('data:image/png;base64,')) {
          const base64 = consent.signatureData.replace('data:image/png;base64,', '')
          const sigBuffer = Buffer.from(base64, 'base64')
          try {
            doc.image(sigBuffer, doc.x, doc.y + 8, { width: 200, height: 60 })
            doc.moveDown(5)
          } catch {
            doc.moveDown(0.3)
          }
        }
        doc.moveDown(0.8)
      }
    }

    // Footer on all pages
    doc.end()

    stream.on('finish', () => {
      resolve({ path: outputPath, filename })
    })

    stream.on('error', (err) => {
      reject(err)
    })
  })
}

export async function exportPortfolioReport(portfolioId: string): Promise<ExportResult> {
  const portfolio = getPortfolio(portfolioId)
  if (!portfolio) throw new Error('Portfolio not found')

  const items = listPortfolioItems(portfolioId)
  const title = sanitizeFilename(portfolio.title || 'portfolio')
  const filename = `portfolio-${title}.pdf`
  const outputPath = join(getExportsDir(), filename)

  return new Promise<ExportResult>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      layout: 'landscape',
      margins: { top: 40, bottom: 40, left: 40, right: 40 }
    })

    const stream = createWriteStream(outputPath)
    doc.pipe(stream)

    // Title page
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(portfolio.title, { align: 'center' })
    doc.moveDown(0.5)
    if (portfolio.category) {
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text(portfolio.category, { align: 'center' })
    }
    doc.moveDown(0.5)
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#999999')
      .text(`${items.length} comparison pair(s)`, { align: 'center' })

    // Each item = one page
    for (const item of items) {
      doc.addPage()
      doc.fillColor('#000000')

      // Patient name
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`${item.patientFirstName} ${item.patientLastName}`, { align: 'center' })
      doc.moveDown(0.3)

      const photoWidth = 330
      const photoHeight = 380
      const leftX = 40
      const rightX = 412

      // Before label + photo
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`Before: ${item.beforeDate || 'N/A'}`, leftX, doc.y)

      const photoY = doc.y + 4

      if (item.beforePhotoPath) {
        const absPath = resolvePhotoPath(item.beforePhotoPath)
        if (existsSync(absPath)) {
          try {
            doc.image(absPath, leftX, photoY, {
              width: photoWidth,
              height: photoHeight,
              fit: [photoWidth, photoHeight]
            })
          } catch {
            // skip
          }
        }
      }

      // After label + photo
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#666666')
        .text(`After: ${item.afterDate || 'N/A'}`, rightX, photoY - 14)

      if (item.afterPhotoPath) {
        const absPath = resolvePhotoPath(item.afterPhotoPath)
        if (existsSync(absPath)) {
          try {
            doc.image(absPath, rightX, photoY, {
              width: photoWidth,
              height: photoHeight,
              fit: [photoWidth, photoHeight]
            })
          } catch {
            // skip
          }
        }
      }

      // Position label at bottom
      if (item.photoPosition) {
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#999999')
          .text(item.photoPosition, 40, photoY + photoHeight + 8, {
            width: 732,
            align: 'center'
          })
      }
    }

    doc.end()

    stream.on('finish', () => {
      resolve({ path: outputPath, filename })
    })

    stream.on('error', (err) => {
      reject(err)
    })
  })
}
