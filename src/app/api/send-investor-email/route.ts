import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Create email transporter
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('API: Starting email send request')
    
    const body = await request.json()
    console.log('API: Request body received:', { to: body.to, subject: body.subject, hasContent: !!body.content })
    
    const { to, subject, content, pin } = body

    if (!to || !subject || !content) {
      console.log('API: Missing required fields:', { to: !!to, subject: !!subject, content: !!content })
      return NextResponse.json(
        { error: 'To, subject, and content are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      console.log('API: Invalid email format:', to)
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.log('API: Checking SMTP configuration...')
    console.log('API: SMTP_HOST:', process.env.SMTP_HOST ? 'Set' : 'Missing')
    console.log('API: SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Missing')
    console.log('API: SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Missing')
    console.log('API: SMTP_FROM:', process.env.SMTP_FROM ? 'Set' : 'Missing')

    const transporter = createTransporter()
    const from = process.env.SMTP_FROM || process.env.SMTP_USER

    if (!from) {
      console.log('API: SMTP_FROM not configured')
      return NextResponse.json(
        { error: 'SMTP_FROM environment variable is not set' },
        { status: 500 }
      )
    }

    console.log('API: Creating mail options...')
    const mailOptions = {
      from: from,
      to: to,
      subject: subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    }

    console.log('API: Mail options created')
    console.log('API: Sending email to:', to)
    console.log('API: Subject:', subject)
    console.log('API: From:', from)

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('API: Email sent successfully:', info.messageId)
      
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      })
    } catch (sendError) {
      console.error('API: Transporter send error:', sendError)
      throw sendError
    }

  } catch (error) {
    console.error('API: Error in email send request:', error)
    console.error('API: Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 