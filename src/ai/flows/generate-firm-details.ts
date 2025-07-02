import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FirmDetailsInputSchema = z.object({
  investor_name: z.string(),
  website: z.string().optional(),
  location: z.string().optional(),
  investor_type: z.string().optional(),
  investment_score: z.string().optional(),
  practice_areas: z.string().optional(),
  overview: z.string().optional(),
});

const FirmDetailsOutputSchema = z.object({
  details: z.string(),
});

export type FirmDetailsInput = z.infer<typeof FirmDetailsInputSchema>;
export type FirmDetailsOutput = z.infer<typeof FirmDetailsOutputSchema>;

export async function generateFirmDetails(input: FirmDetailsInput): Promise<FirmDetailsOutput> {
  return firmDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFirmDetailsPrompt',
  input: { schema: FirmDetailsInputSchema },
  output: { schema: FirmDetailsOutputSchema },
  prompt: `
If a website is provided, research and summarize the investment firm using the website as the primary source. If no website is available, use the firm name to infer and summarize the business profile. Highlight location, type, investment score, practice areas, and overview if available. Write in a professional, business profile style.

Firm Name: {{{investor_name}}}
Website: {{{website}}}
Location: {{{location}}}
Investor Type: {{{investor_type}}}
Investment Score: {{{investment_score}}}
Practice Areas: {{{practice_areas}}}
Overview: {{{overview}}}
`,
});

const firmDetailsFlow = ai.defineFlow(
  {
    name: 'generateFirmDetailsFlow',
    inputSchema: FirmDetailsInputSchema,
    outputSchema: FirmDetailsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
); 