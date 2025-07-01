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
  investorName: z.string().describe('The name of the investor.'),
  companyName: z.string().describe('The name of the investor company.'),
  companyDescription: z.string().describe('A description of the investor company.'),
  investmentStage: z.string().describe('The investment stage of the investor company.'),
  pastInvestments: z.string().describe('The past investments of the investor company.'),
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
  prompt: `You are an expert email writer specializing in personalized outreach emails to investors.

  Based on the investor's data, write a personalized email to the investor. The email should be engaging, concise, and tailored to the investor's interests and investment strategy.

  Investor Name: {{{investorName}}}
  Company Name: {{{companyName}}}
  Company Description: {{{companyDescription}}}
  Investment Stage: {{{investmentStage}}}
  Past Investments: {{{pastInvestments}}}

  Our Company Name: {{{ourCompanyName}}}
  Pitch Summary: {{{pitchSummary}}}

  Write the email content:`,
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
