import type { NextApiRequest, NextApiResponse } from 'next';
import { generateFirmDetails } from '@/ai/flows/generate-firm-details';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const details = await generateFirmDetails({
      investor_name: req.body.investor_name,
      website: req.body.website,
      location: req.body.location,
      investor_type: req.body.investor_type,
      investment_score: req.body.investment_score,
      practice_areas: req.body.practice_areas,
      overview: req.body.overview,
    });
    res.status(200).json(details);
  } catch (e) {
    res.status(500).json({ error: 'AI error' });
  }
} 