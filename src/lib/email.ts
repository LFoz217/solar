import { Resend } from 'resend'
import QRCode from 'qrcode'
import type { Event, Ticket } from '@/types'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function ticketToQRDataUrl(qrCode: string): Promise<string> {
  return QRCode.toDataURL(qrCode, { width: 200, margin: 1 })
}

export async function sendTicketEmail({
  to,
  customerName,
  event,
  tickets,
  orderId,
}: {
  to: string
  customerName: string
  event: Event
  tickets: Ticket[]
  orderId: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const walletUrl = `${appUrl}/tickets/${orderId}`

  // Generate QR data URLs for each ticket
  const ticketQRs = await Promise.all(
    tickets.map(async (ticket) => ({
      ...ticket,
      qrDataUrl: await ticketToQRDataUrl(ticket.qr_code),
    }))
  )

  const ticketCards = ticketQRs
    .map(
      (ticket, i) => `
      <div style="background:#18181b;border:1px solid #3f3f46;border-radius:16px;padding:24px;margin-bottom:16px;text-align:center;">
        <p style="color:#a1a1aa;font-size:12px;margin:0 0 4px;">Ticket ${i + 1} of ${tickets.length}</p>
        <p style="color:#ffffff;font-weight:600;font-size:16px;margin:0 0 16px;">${event.title}</p>
        <img src="${ticket.qrDataUrl}" alt="QR Code" width="160" height="160" style="border-radius:8px;" />
        <p style="color:#d4d4d8;font-family:monospace;font-size:14px;margin:12px 0 4px;">${ticket.ticket_number}</p>
        <p style="color:#71717a;font-size:12px;margin:0;">${event.venue}</p>
      </div>
    `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body style="background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;">
      <div style="max-width:500px;margin:0 auto;padding:40px 24px;">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:32px;">
          <p style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 4px;">Solar</p>
          <p style="color:#71717a;font-size:13px;margin:0;">Your tickets are confirmed</p>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom:24px;">
          <p style="color:#e4e4e7;font-size:15px;margin:0 0 8px;">Hi ${customerName},</p>
          <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.6;">
            You&apos;re all set for <strong style="color:#ffffff;">${event.title}</strong>.
            Your ${tickets.length === 1 ? 'ticket is' : `${tickets.length} tickets are`} below.
            Show the QR code(s) at the door — each can only be scanned once.
          </p>
        </div>

        <!-- Event details -->
        <div style="background:#18181b;border:1px solid #3f3f46;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="color:#a1a1aa;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Event details</p>
          <p style="color:#ffffff;font-weight:600;font-size:15px;margin:0 0 4px;">${event.title}</p>
          <p style="color:#71717a;font-size:13px;margin:0 0 2px;">📅 ${formatDate(event.date)}</p>
          <p style="color:#71717a;font-size:13px;margin:0;">📍 ${event.venue}</p>
        </div>

        <!-- Tickets -->
        ${ticketCards}

        <!-- Wallet link -->
        <div style="text-align:center;margin-top:24px;">
          <a href="${walletUrl}" style="display:inline-block;background:#ffffff;color:#000000;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
            View tickets in app →
          </a>
        </div>

        <!-- Footer -->
        <p style="color:#3f3f46;font-size:11px;text-align:center;margin-top:40px;">
          Solar · No platform fees · Powered by Stripe
        </p>

      </div>
    </body>
    </html>
  `

  await getResend().emails.send({
    from: 'Solar Tickets <tickets@solar.fm>',
    to,
    subject: `Your tickets for ${event.title}`,
    html,
  })
}
