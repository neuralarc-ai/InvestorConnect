import nodemailer from 'nodemailer'
import { pitchSupabase } from './pitch-supabase-client'

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

  const { data, error } = await pitchSupabase
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
  const pitchUrl = 'https://pitch.neuralarc.ai'

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Investment Opportunity in Our Agile AI Solutions Company',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <p style="margin: 0 0 16px 0;">Dear Investor,</p>
        
        <p style="margin: 0 0 16px 0;">Neural Arc is a generative artificial intelligence company establishing the cognitive infrastructure for enterprises. Our intelligent agent systems integrate natively with existing data, allowing organisations to automate decisions, streamline workflows, and extract actionable insights without costly system replacement.</p>
        
        <p style="margin: 0 0 16px 0;"><strong>Key reasons to consider an investment in Neural Arc:</strong></p>
        <ol style="margin: 0 0 16px 0; padding-left: 20px;">
          <li style="margin: 0 0 8px 0;"><strong>Strong Market Momentum:</strong> The enterprise artificial intelligence sector is shifting decisively toward agentic automation, and Neural Arc occupies a central position in this movement.</li>
          <li style="margin: 0 0 8px 0;"><strong>Interoperable Technology:</strong> Our proprietary AI agent framework connects effortlessly across diverse data stacks, ensuring rapid deployment and minimal integration friction.</li>
          <li style="margin: 0 0 8px 0;"><strong>Scalable Architecture:</strong> The platform supports accelerated product rollout across multiple verticals, enabling compounding growth.</li>
          <li style="margin: 0 0 8px 0;"><strong>Experienced Leadership:</strong> A founding team with successful exits and deep domain expertise guides strategy, execution, and market penetration.</li>
        </ol>
        
        <p style="margin: 0 0 16px 0;">Neural Arc is not merely developing standalone tools. We are constructing the foundation of enterprise cognition. We are currently raising a seed round and would value the opportunity to discuss how your partnership can accelerate our mission.</p>
        
        <p style="margin: 0 0 16px 0;"><strong>Please review our investor presentation and select a convenient time for a brief introductory call:</strong></p>
        <ul style="margin: 0 0 16px 0; padding-left: 20px;">
          <li style="margin: 0 0 8px 0;"><strong>Investor Deck:</strong> <a href="${pitchUrl}" style="color: #007bff; text-decoration: none;">${pitchUrl}</a> (PIN: <span style="font-size: 18px; font-weight: bold; color: #28a745; letter-spacing: 2px;">${pin}</span>)</li>
          <li style="margin: 0 0 8px 0;"><strong>Schedule a Call:</strong> <a href="https://cal.neuralarc.ai/" style="color: #007bff; text-decoration: none;">https://cal.neuralarc.ai/</a></li>
        </ul>
        
        <p style="margin: 0 0 16px 0;">Thank you for your consideration. I look forward to our conversation.</p>
        
        <p style="margin: 16px 0 8px 0;"><strong>Kind regards,</strong></p>
        <p style="margin: 4px 0; color: #666;">Aniket Tapre</p>
        <p style="margin: 4px 0; color: #666;">Founder and Chief Executive Officer, Neural Arc</p>
      </div>
    `,
    text: `
Dear Investor,

Neural Arc is a generative artificial intelligence company establishing the cognitive infrastructure for enterprises. Our intelligent agent systems integrate natively with existing data, allowing organisations to automate decisions, streamline workflows, and extract actionable insights without costly system replacement.

Key reasons to consider an investment in Neural Arc:
1. Strong Market Momentum: The enterprise artificial intelligence sector is shifting decisively toward agentic automation, and Neural Arc occupies a central position in this movement.
2. Interoperable Technology: Our proprietary AI agent framework connects effortlessly across diverse data stacks, ensuring rapid deployment and minimal integration friction.
3. Scalable Architecture: The platform supports accelerated product rollout across multiple verticals, enabling compounding growth.
4. Experienced Leadership: A founding team with successful exits and deep domain expertise guides strategy, execution, and market penetration.

Neural Arc is not merely developing standalone tools. We are constructing the foundation of enterprise cognition. We are currently raising a seed round and would value the opportunity to discuss how your partnership can accelerate our mission.

Please review our investor presentation and select a convenient time for a brief introductory call:
• Investor Deck: https://pitch.neuralarc.ai (PIN: ${pin})
• Schedule a Call: https://ceo.neuralarc.ai/

Thank you for your consideration. I look forward to our conversation.

Kind regards,
Aniket Tapre
Founder and Chief Executive Officer, Neural Arc
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
  const { data, error } = await pitchSupabase
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