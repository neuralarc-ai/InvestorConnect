import { pitchSupabase } from './pitch-supabase-client'

// Generate a random 4-digit PIN
function generateRandomPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function sendInvestorAccessEmail(email: string, providedPin?: string) {
  try {
    console.log('🎯 Starting PIN email process for:', email)
    
    // Validate email
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email address')
    }

    // Use provided PIN or generate new one
    const pin = providedPin || generateRandomPin()
    console.log('🔐 Generated PIN:', pin)

    // Set expiration to 48 hours from now
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hrs

    console.log('💾 Saving PIN to Pitch database...')
    
    const { data, error } = await pitchSupabase
      .from('investors_pin')
      .upsert({
        email,
        pin,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'email'
      })

    if (error) {
      console.error('❌ Failed to save PIN in Pitch DB:', error)
      throw new Error(`Could not save PIN: ${error.message}`)
    }

    console.log('✅ PIN saved successfully in Pitch DB:', data)

    return { 
      success: true, 
      pin,
      expiresAt: expiresAt.toISOString()
    }

  } catch (error) {
    console.error('❌ Error in sendInvestorAccessEmail:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Utility function to check if PIN exists and is valid
export async function checkPinValidity(email: string, pin: string): Promise<boolean> {
  try {
    const { data, error } = await pitchSupabase
      .from('investors_pin')
      .select('*')
      .eq('email', email)
      .eq('pin', pin)
      .single()

    if (error || !data) {
      console.log('❌ PIN validation failed:', error)
      return false
    }

    const expiresAt = new Date(data.expires_at)
    const now = new Date()
    const isValid = expiresAt > now

    console.log(`🔍 PIN validation result: ${isValid ? 'VALID' : 'EXPIRED'}`)
    return isValid

  } catch (error) {
    console.error('❌ Error checking PIN validity:', error)
    return false
  }
} 