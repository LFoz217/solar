import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, bio, website, logo_url, notify_on_sale, notify_on_refund } = body

  const { error } = await supabase
    .from('organisers')
    .update({ name, bio, website, logo_url, notify_on_sale, notify_on_refund })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
