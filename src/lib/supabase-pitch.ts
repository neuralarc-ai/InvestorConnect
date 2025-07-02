import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_PITCH_SUPABASE_URL!
const supabaseServiceKey = process.env.PITCH_SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Pitch Supabase environment variables')
}

// Create Supabase client with service role key for admin operations
export const supabasePitch = createClient(supabaseUrl, supabaseServiceKey, {
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

export async function storeInvestorPin({
  email,
  pin,
  expires_at
}: {
  email: string,
  pin: string,
  expires_at: string // ISO string or Date
}) {
  const { data, error } = await supabasePitch
    .from('investor_pins')
    .insert([{ email, pin, expires_at }])
    .select();
  return { data, error };
} 