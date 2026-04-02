/** Dummy worker data for demo. Merchant loads these into the WorkerRegistry on-chain. */
export interface DummyWorker {
  name: string
  phone: string
  upiId: string
  rating: number // 10-50 (1.0-5.0 stars)
}

export const DUMMY_WORKERS: DummyWorker[] = [
  { name: 'Rajesh Kumar', phone: '+91-9876543210', upiId: 'rajesh.k@paytm', rating: 45 },
  { name: 'Priya Sharma', phone: '+91-9123456789', upiId: 'priya.s@gpay', rating: 50 },
  { name: 'Amit Patel', phone: '+91-8765432109', upiId: 'amit.patel@phonepe', rating: 35 },
  { name: 'Sunita Devi', phone: '+91-7654321098', upiId: 'sunita.d@paytm', rating: 40 },
  { name: 'Mohammed Irfan', phone: '+91-6543210987', upiId: 'irfan.m@gpay', rating: 28 },
  { name: 'Kavitha Nair', phone: '+91-5432109876', upiId: 'kavitha.n@phonepe', rating: 48 },
]

/** Dummy orders for demo. Merchant creates deliveries from these on-chain. */
export interface DummyOrder {
  customerName: string
  pickup: string
  dropoff: string
  baseAmount: number // in USDC (human-readable, not micro)
}

export const DUMMY_ORDERS: DummyOrder[] = [
  { customerName: 'Vikram Singh', pickup: '12 MG Road, Bangalore', dropoff: '45 Koramangala, Bangalore', baseAmount: 0.25 },
  { customerName: 'Neha Gupta', pickup: '7 Park Street, Kolkata', dropoff: '22 Salt Lake, Kolkata', baseAmount: 0.18 },
  { customerName: 'Arjun Reddy', pickup: '5 Banjara Hills, Hyderabad', dropoff: '18 Madhapur, Hyderabad', baseAmount: 0.32 },
  { customerName: 'Meera Joshi', pickup: '33 FC Road, Pune', dropoff: '9 Hinjewadi, Pune', baseAmount: 0.20 },
  { customerName: 'Ravi Verma', pickup: '15 Connaught Place, Delhi', dropoff: '8 Saket, Delhi', baseAmount: 0.15 },
  { customerName: 'Ananya Das', pickup: '2 Lake Town, Kolkata', dropoff: '11 New Town, Kolkata', baseAmount: 0.10 },
  { customerName: 'Karthik Iyer', pickup: '9 Anna Nagar, Chennai', dropoff: '25 T Nagar, Chennai', baseAmount: 0.19 },
  { customerName: 'Deepa Menon', pickup: '18 Jubilee Hills, Hyderabad', dropoff: '6 Gachibowli, Hyderabad', baseAmount: 0.50 },
]

/** Rating multiplier explanation for display */
export function getRatingMultiplier(rating: number): number {
  // Matches contract: multiplier = 40 + (rating * 22) / 10
  return (40 + (rating * 22) / 10) / 100
}

export function calculatePayout(baseAmount: number, rating: number): number {
  const multiplier = 40 + (rating * 22) / 10
  return Math.floor((baseAmount * multiplier) / 100)
}
