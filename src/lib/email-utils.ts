import nodemailer from 'nodemailer'
import { supabasePitch, type InvestorPin } from './supabase-pitch'

// Generate a random 4-digit PIN
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Create email transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Insert or upsert PIN in Supabase
async function upsertPin(email: string, pin: string): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48) // 48 hours from now

  console.log('Attempting to upsert PIN for email:', email)
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_PITCH_SUPABASE_URL ? 'Set' : 'Missing')
  console.log('Service Key:', process.env.PITCH_SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')

  const { data, error } = await supabasePitch
    .from('investors_pin')
    .upsert(
      {
        email,
        pin,
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'email',
      }
    )

  if (error) {
    console.error('Error upserting PIN:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw new Error(`Failed to save PIN: ${error.message || 'Unknown database error'}`)
  }

  console.log('PIN upserted successfully:', data)
}

// Send email with PIN
async function sendEmail(email: string, pin: string): Promise<void> {
  const transporter = createTransporter()
  const pitchUrl = process.env.PITCH_URL

  if (!pitchUrl) {
    throw new Error('PITCH_URL environment variable is not set')
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Your 48-Hour Access PIN to Our Pitch Deck',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Access Your Pitch Deck</h2>
        <p>Hello,</p>
        <p>You now have 48-hour access to our pitch deck. Please use the following information to access it:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Access Link:</strong> <a href="${pitchUrl}" style="color: #007bff;">${pitchUrl}</a></p>
          <p><strong>Your PIN:</strong> <span style="font-size: 24px; font-weight: bold; color: #28a745; letter-spacing: 4px;">${pin}</span></p>
        </div>
        
        <p><strong>Important:</strong></p>
        <ul>
          <li>This PIN expires in 48 hours</li>
          <li>Keep this PIN secure and don't share it</li>
          <li>If you need a new PIN, please contact us</li>
        </ul>
        
        <p>Best regards,<br>Your Team</p>
      </div>
    `,
    text: `
Access Your Pitch Deck

Hello,

You now have 48-hour access to our pitch deck. Please use the following information to access it:

Access Link: ${pitchUrl}
Your PIN: ${pin}

Important:
- This PIN expires in 48 hours
- Keep this PIN secure and don't share it
- If you need a new PIN, please contact us

Best regards,
Your Team
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Main function to send investor access email
export async function sendInvestorAccessEmail(email: string, providedPin?: string): Promise<{ success: boolean; pin?: string; error?: string }> {
  try {
    console.log('Starting sendInvestorAccessEmail for:', email)
    
    // Validate email
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address')
    }

    // Use provided PIN or generate new one
    const pin = providedPin || generatePin()
    console.log('Using PIN:', pin)

    // Save PIN to Supabase
    console.log('Attempting to save PIN to database...')
    await upsertPin(email, pin)
    console.log('PIN saved successfully')

    // Only send email if no PIN was provided (standalone access email flow)
    if (!providedPin) {
      console.log('Sending email...')
      await sendEmail(email, pin)
      console.log('Email sent successfully')
    }

    return { success: true, pin }
  } catch (error) {
    console.error('Error in sendInvestorAccessEmail:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Utility function to check if PIN exists and is valid
export async function checkPinValidity(email: string, pin: string): Promise<boolean> {
  const { data, error } = await supabasePitch
    .from('investors_pin')
    .select('*')
    .eq('email', email)
    .eq('pin', pin)
    .single()

  if (error || !data) {
    return false
  }

  const expiresAt = new Date(data.expires_at)
  const now = new Date()

  return expiresAt > now
} 