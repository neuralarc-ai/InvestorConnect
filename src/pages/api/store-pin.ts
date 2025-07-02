import type { NextApiRequest, NextApiResponse } from 'next';
import { supabasePitch } from '@/lib/supabase-pitch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, pin, expires_at } = req.body;
  if (!email || !pin || !expires_at) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { data, error } = await supabasePitch
    .from('investor_pins')
    .insert([{ email, pin, expires_at }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
} 