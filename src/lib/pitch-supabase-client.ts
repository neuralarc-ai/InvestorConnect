import { createClient } from '@supabase/supabase-js'

const PITCH_SUPABASE_URL = process.env.NEXT_PUBLIC_PITCH_SUPABASE_URL!
const PITCH_SERVICE_ROLE = process.env.PITCH_SUPABASE_SERVICE_ROLE_KEY!

if (!PITCH_SUPABASE_URL || !PITCH_SERVICE_ROLE) {
  throw new Error('Missing Pitch Supabase environment variables')
}

export const pitchSupabase = createClient(PITCH_SUPABASE_URL, PITCH_SERVICE_ROLE, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Types for the investors_pin table
export interface InvestorPin {
  id?: string
  email: string
  pin: string
  expires_at: string
  created_at?: string
  updated_at?: string
} 