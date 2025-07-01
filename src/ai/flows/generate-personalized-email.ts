'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized outreach emails based on investor data.
 *
 * - generatePersonalizedEmail - A function that generates a personalized outreach email.
 * - GeneratePersonalizedEmailInput - The input type for the generatePersonalizedEmail function.
 * - GeneratePersonalizedEmailOutput - The return type for the generatePersonalizedEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedEmailInputSchema = z.object({
  Contact_Person: z.string().describe("The name of the contact person at the investment firm."),
  Designation: z.string().describe("The designation or role of the contact person."),
  Investor_Name: z.string().describe("The name of the investment firm."),
  Location: z.string().describe("The location of the investment firm."),
  ourCompanyName: z.string().describe('The name of our company.'),
  pitchSummary: z.string().describe('A brief summary of our company and pitch.'),
});
export type GeneratePersonalizedEmailInput = z.infer<typeof GeneratePersonalizedEmailInputSchema>;

const GeneratePersonalizedEmailOutputSchema = z.object({
  emailContent: z.string().describe('The generated personalized email content.'),
});
export type GeneratePersonalizedEmailOutput = z.infer<typeof GeneratePersonalizedEmailOutputSchema>;

export async function generatePersonalizedEmail(
  input: GeneratePersonalizedEmailInput
): Promise<GeneratePersonalizedEmailOutput> {
  return generatePersonalizedEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedEmailPrompt',
  input: {schema: GeneratePersonalizedEmailInputSchema},
  output: {schema: GeneratePersonalizedEmailOutputSchema},
  prompt: `Write a personalized, concise outreach email to {{{Contact_Person}}}, who is a {{{Designation}}} at {{{Investor_Name}}}, located in {{{Location}}}.

Focus on introducing our AI startup, "{{{ourCompanyName}}}", and expressing interest in discussing synergies or funding. Our startup specializes in: {{{pitchSummary}}}.

Use a respectful and professional tone.`,
});

const generatePersonalizedEmailFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedEmailFlow',
    inputSchema: GeneratePersonalizedEmailInputSchema,
    outputSchema: GeneratePersonalizedEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
