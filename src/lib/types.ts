export interface Organiser {
  id: string
  name: string
  stripe_account_id: string | null
  created_at: string
}

export interface Event {
  id: string
  organiser_id: string
  title: string
  description: string | null
  venue: string
  date: string
  capacity: number
  ticket_price: number // pence
  currency: string
  stripe_price_id: string | null
  stripe_product_id: string | null
  is_published: boolean
  created_at: string
}

export interface Order {
  id: string
  event_id: string
  customer_email: string
  customer_name: string
  quantity: number
  total_amount: number // pence
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  status: 'pending' | 'paid' | 'refunded'
  created_at: string
}

export interface Ticket {
  id: string
  order_id: string
  event_id: string
  ticket_number: string
  qr_code: string
  is_scanned: boolean
  scanned_at: string | null
  created_at: string
}
