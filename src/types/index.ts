export interface Organiser {
  id: string
  name: string
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
  ticket_price: number
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
  total_amount: number
  stripe_session_id: string | null
  status: 'pending' | 'paid' | 'cancelled'
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

export interface OrderWithTickets extends Order {
  tickets: Ticket[]
  event: Event
}
