import { NextRequest, NextResponse } from 'next/server'
import { sendInvestorAccessEmail } from '@/lib/email-utils'

export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // If PIN is provided, just save it to database (for email generation flow)
    if (pin) {
      const result = await sendInvestorAccessEmail(email, pin)
      return NextResponse.json(result)
    }

    // If no PIN provided, generate one and send email (for standalone access email flow)
    const result = await sendInvestorAccessEmail(email)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Access email sent successfully',
        pin: result.pin
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 