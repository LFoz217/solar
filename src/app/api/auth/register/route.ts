import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, firstName, lastName, dateOfBirth, phone } = body

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Create user with email pre-confirmed (skips email verification)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dateOfBirth,
      phone: phone || null,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Create organiser profile
  if (data.user) {
    await admin
      .from('organisers')
      .insert({ id: data.user.id, name: `${firstName} ${lastName}` })
  }

  return NextResponse.json({ user: data.user })
}
