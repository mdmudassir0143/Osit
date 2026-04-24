import jsPDF from 'jspdf'
import { type InvoiceData } from './invoice'

const CHARCOAL = '#1a1a1a'
const TERRA = '#c44b2b'
const MUTED = '#888888'
const CREAM = '#f5f0e8'
const WHITE = '#ffffff'

function drawLine(doc: jsPDF, x1: number, y: number, x2: number, color = CHARCOAL, width = 0.5) {
  doc.setDrawColor(color)
  doc.setLineWidth(width)
  doc.line(x1, y, x2, y)
}

function drawRect(doc: jsPDF, x: number, y: number, w: number, h: number, fill: string) {
  doc.setFillColor(fill)
  doc.rect(x, y, w, h, 'F')
}

export function generatePayoutReceipt(data: InvoiceData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw = 210 // page width
  const margin = 20
  const cw = pw - margin * 2 // content width
  let y = margin

  // ─── Header bar ───
  drawRect(doc, 0, 0, pw, 38, CHARCOAL)

  // Alora branding
  doc.setTextColor(TERRA)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('ALORA', margin, 16)

  doc.setTextColor(WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Real-Time Payouts Infrastructure', margin, 22)

  // PAYOUT RECEIPT title
  doc.setTextColor(WHITE)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYOUT RECEIPT', pw - margin, 16, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(data.invoiceNumber, pw - margin, 23, { align: 'right' })
  doc.text(data.date, pw - margin, 29, { align: 'right' })

  y = 48

  // ─── Worker Details ───
  doc.setTextColor(MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('PAID TO', margin, y)

  y += 5
  doc.setTextColor(CHARCOAL)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(data.workerName, margin, y)

  y += 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(MUTED)
  const addrShort = data.workerAddress.slice(0, 8) + '...' + data.workerAddress.slice(-6)
  doc.text(addrShort, margin, y)

  y += 4.5
  if (data.workerPhone) doc.text(`Phone: ${data.workerPhone}`, margin, y)

  y += 4.5
  if (data.workerUpiId) doc.text(`UPI: ${data.workerUpiId}`, margin, y)

  // ─── Delivery Details (right column) ───
  const rightX = pw / 2 + 10
  let ry = 48

  doc.setTextColor(MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('DELIVERY DETAILS', rightX, ry)

  ry += 5
  doc.setTextColor(CHARCOAL)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Order #${data.deliveryId}`, rightX, ry)

  ry += 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(MUTED)
  doc.text(`Customer: ${data.customerName}`, rightX, ry)

  ry += 4.5
  doc.text(`Pickup: ${data.pickup}`, rightX, ry)

  ry += 4.5
  doc.text(`Dropoff: ${data.dropoff}`, rightX, ry)

  y = Math.max(y, ry) + 10

  // ─── Divider ───
  drawLine(doc, margin, y, pw - margin, CHARCOAL, 0.8)
  y += 8

  // ─── Amount Breakdown Table ───
  doc.setTextColor(MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYOUT BREAKDOWN', margin, y)
  y += 7

  // Table header
  drawRect(doc, margin, y - 3, cw, 8, CREAM)
  doc.setTextColor(CHARCOAL)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Description', margin + 3, y + 2)
  doc.text('USDC', pw - margin - 40, y + 2, { align: 'right' })
  doc.text('INR', pw - margin - 3, y + 2, { align: 'right' })
  y += 10

  // Rows
  const rows = [
    { label: 'Base Delivery Amount', usdc: data.baseAmountUSDC, inr: data.baseAmountUSDC * 83.5 },
    { label: `Rating Multiplier (${(data.ratingMultiplier * 100).toFixed(0)}%)`, usdc: data.finalAmountUSDC - data.baseAmountUSDC, inr: (data.finalAmountUSDC - data.baseAmountUSDC) * 83.5 },
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const row of rows) {
    doc.setTextColor(CHARCOAL)
    doc.text(row.label, margin + 3, y)
    doc.text(`$${row.usdc.toFixed(4)}`, pw - margin - 40, y, { align: 'right' })
    doc.text(`₹${row.inr.toFixed(2)}`, pw - margin - 3, y, { align: 'right' })
    y += 6
  }

  // Total row
  drawLine(doc, margin, y - 2, pw - margin, CHARCOAL, 0.3)
  y += 3
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(TERRA)
  doc.text('Total Payout', margin + 3, y)
  doc.text(`$${data.finalAmountUSDC.toFixed(4)}`, pw - margin - 40, y, { align: 'right' })
  doc.text(`₹${data.inrEquivalent.toFixed(2)}`, pw - margin - 3, y, { align: 'right' })
  y += 12

  // ─── GST Breakdown ───
  doc.setTextColor(MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('GST DETAILS (ON PLATFORM SERVICE FEE)', margin, y)
  y += 7

  drawRect(doc, margin, y - 3, cw, 8, CREAM)
  doc.setTextColor(CHARCOAL)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Component', margin + 3, y + 2)
  doc.text('Amount (INR)', pw - margin - 3, y + 2, { align: 'right' })
  y += 10

  const gstRows = [
    { label: 'Platform Service Fee (10%)', amount: data.gst.platformFee * 83.5 },
    { label: 'Taxable Value', amount: data.gst.taxableValue * 83.5 },
    { label: 'CGST @ 9%', amount: data.gst.cgst * 83.5 },
    { label: 'SGST @ 9%', amount: data.gst.sgst * 83.5 },
  ]

  doc.setFont('helvetica', 'normal')
  for (const row of gstRows) {
    doc.setTextColor(CHARCOAL)
    doc.text(row.label, margin + 3, y)
    doc.text(`₹${row.amount.toFixed(2)}`, pw - margin - 3, y, { align: 'right' })
    y += 6
  }

  drawLine(doc, margin, y - 2, pw - margin, CHARCOAL, 0.3)
  y += 3
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(TERRA)
  doc.text('Total GST', margin + 3, y)
  doc.text(`₹${(data.gst.totalGST * 83.5).toFixed(2)}`, pw - margin - 3, y, { align: 'right' })
  y += 15

  // ─── Transaction Hash ───
  if (data.txnHash) {
    doc.setTextColor(MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('ON-CHAIN REFERENCE', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(`Txn: ${data.txnHash}`, margin, y)
    y += 4
    doc.text('Verified on Algorand blockchain — immutable and auditable', margin, y)
    y += 10
  }

  // ─── Footer ───
  drawLine(doc, margin, 272, pw - margin, MUTED, 0.3)
  doc.setTextColor(MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Generated by Alora — Real-Time Payouts Infrastructure for Gig Platforms', margin, 278)
  doc.text('This is a system-generated document. No signature required.', margin, 282)
  doc.text(`Created: ${new Date().toLocaleDateString('en-IN')}`, pw - margin, 278, { align: 'right' })

  // Save
  doc.save(`alora_receipt_${data.invoiceNumber}.pdf`)
}
