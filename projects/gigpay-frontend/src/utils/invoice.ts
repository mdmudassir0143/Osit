export const INR_RATE = 83.5
const PLATFORM_FEE_RATE = 0.10 // 10% platform commission
const GST_RATE = 0.18 // 18% GST on services
const CGST_RATE = 0.09
const SGST_RATE = 0.09

export interface GSTBreakdown {
  platformFee: number
  taxableValue: number
  cgst: number
  sgst: number
  totalGST: number
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  // Worker
  workerName: string
  workerAddress: string
  workerPhone: string
  workerUpiId: string
  // Delivery
  deliveryId: number
  customerName: string
  pickup: string
  dropoff: string
  // Amounts
  baseAmountUSDC: number
  ratingMultiplier: number
  finalAmountUSDC: number
  inrEquivalent: number
  // GST
  gst: GSTBreakdown
  // Meta
  txnHash?: string
  createdAt: string
  deliveredAt: string
}

export function generateInvoiceNumber(deliveryId: number): string {
  const year = new Date().getFullYear()
  return `ALR-${year}-${String(deliveryId).padStart(6, '0')}`
}

export function computeMultiplier(rating: number): number {
  return (40 + (rating * 22) / 10) / 100
}

export function computeGST(finalAmountMicro: number): GSTBreakdown {
  const finalUSDC = finalAmountMicro / 1_000_000
  const platformFee = finalUSDC * PLATFORM_FEE_RATE
  const taxableValue = platformFee
  const cgst = taxableValue * CGST_RATE
  const sgst = taxableValue * SGST_RATE
  const totalGST = cgst + sgst
  return { platformFee, taxableValue, cgst, sgst, totalGST }
}

export function formatUSDC(micro: number): string {
  return (micro / 1_000_000).toFixed(2)
}

export function formatINR(usdcMicro: number, rate = INR_RATE): string {
  return ((usdcMicro / 1_000_000) * rate).toFixed(2)
}

export function formatDate(ts: number): string {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateISO(ts: number): string {
  if (!ts) return ''
  return new Date(ts * 1000).toISOString().split('T')[0]
}

export function buildInvoiceData(
  delivery: {
    id: number
    customerName: string
    pickup: string
    dropoff: string
    baseAmount: number
    finalAmount: number
    createdAt: number
    deliveredAt: number
  },
  worker: {
    name: string
    address: string
    phone: string
    upiId: string
    rating: number
  },
  txnHash?: string,
): InvoiceData {
  const multiplier = computeMultiplier(worker.rating)
  const gst = computeGST(delivery.finalAmount)

  return {
    invoiceNumber: generateInvoiceNumber(delivery.id),
    date: formatDate(delivery.deliveredAt || delivery.createdAt),
    workerName: worker.name,
    workerAddress: worker.address,
    workerPhone: worker.phone,
    workerUpiId: worker.upiId,
    deliveryId: delivery.id,
    customerName: delivery.customerName,
    pickup: delivery.pickup,
    dropoff: delivery.dropoff,
    baseAmountUSDC: delivery.baseAmount / 1_000_000,
    ratingMultiplier: multiplier,
    finalAmountUSDC: delivery.finalAmount / 1_000_000,
    inrEquivalent: (delivery.finalAmount / 1_000_000) * INR_RATE,
    gst,
    txnHash,
    createdAt: formatDate(delivery.createdAt),
    deliveredAt: formatDate(delivery.deliveredAt),
  }
}

// Indian financial year helpers
export function getFinancialYear(date: Date): string {
  const month = date.getMonth() // 0-indexed
  const year = date.getFullYear()
  if (month >= 3) return `${year}-${year + 1}`
  return `${year - 1}-${year}`
}

export function getFinancialQuarter(date: Date): string {
  const month = date.getMonth()
  if (month >= 3 && month <= 5) return 'Q1'
  if (month >= 6 && month <= 8) return 'Q2'
  if (month >= 9 && month <= 11) return 'Q3'
  return 'Q4'
}

export function getFinancialMonth(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}
