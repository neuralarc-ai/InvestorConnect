'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized outreach emails based on investor data.
 * Includes UTF-8 encoding and character sanitization to prevent encoding issues.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// More aggressive sanitization function to prevent ByteString conversion errors
function sanitizeText(input: string | undefined) {
  if (!input) return '';
  try {
    // First normalize Unicode and remove combining characters
    let sanitized = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    
    // Remove all non-ASCII characters (keep only 0-127)
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
    
    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Additional check: ensure no characters above 127 remain
    let finalSanitized = '';
    for (let i = 0; i < sanitized.length; i++) {
      const charCode = sanitized.charCodeAt(i);
      if (charCode <= 127) {
        finalSanitized += sanitized[i];
      } else {
        console.warn(`Removing character with code ${charCode} at position ${i}`);
      }
    }
    
    return finalSanitized;
  } catch (error) {
    console.warn('Text sanitization error:', error);
    // Fallback: remove all non-ASCII characters
    return input.replace(/[^\x00-\x7F]/g, '');
  }
}

// UTF-8 encoding function to prevent ByteString conversion errors
function encodeToUtf8(input: string): string {
  try {
    // First sanitize the input
    const sanitized = sanitizeText(input);
    
    // Convert to UTF-8 buffer and back to string
    const buffer = Buffer.from(sanitized, 'utf8');
    const encoded = buffer.toString('utf8');
    
    // Final check: ensure the encoded string only contains ASCII characters
    let finalEncoded = '';
    for (let i = 0; i < encoded.length; i++) {
      const charCode = encoded.charCodeAt(i);
      if (charCode <= 127) {
        finalEncoded += encoded[i];
      } else {
        console.warn(`UTF-8 encoding removed character with code ${charCode} at position ${i}`);
      }
    }
    
    return finalEncoded;
  } catch (error) {
    console.warn('UTF-8 encoding error:', error);
    // Fallback to sanitized text
    return sanitizeText(input);
  }
}

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
  try {
    console.log('Original input:', JSON.stringify(input, null, 2));
    
    // Sanitize all input fields to prevent character encoding issues
    const sanitizedInput = {
      Contact_Person: sanitizeText(input.Contact_Person || ''),
      Designation: sanitizeText(input.Designation || ''),
      Investor_Name: sanitizeText(input.Investor_Name || ''),
      Location: sanitizeText(input.Location || ''),
      ourCompanyName: sanitizeText(input.ourCompanyName || ''),
      pitchSummary: sanitizeText(input.pitchSummary || ''),
    };
    
    console.log('After initial sanitization:', JSON.stringify(sanitizedInput, null, 2));
    
    // Additional safety check - ensure all values are clean and UTF-8 encoded
    Object.keys(sanitizedInput).forEach(key => {
      const value = sanitizedInput[key as keyof typeof sanitizedInput];
      if (typeof value === 'string' && value.length > 0) {
        // Double-check for any problematic characters
        for (let i = 0; i < value.length; i++) {
          const charCode = value.charCodeAt(i);
          if (charCode > 127) {
            console.warn(`Found problematic character at index ${i} in ${key}: ${charCode}`);
            sanitizedInput[key as keyof typeof sanitizedInput] = sanitizeText(value);
            break;
          }
        }
        // Ensure UTF-8 encoding
        sanitizedInput[key as keyof typeof sanitizedInput] = encodeToUtf8(sanitizedInput[key as keyof typeof sanitizedInput]);
      }
    });
    
    console.log('After final sanitization:', JSON.stringify(sanitizedInput, null, 2));
    
    return generatePersonalizedEmailFlow(sanitizedInput);
  } catch (error) {
    console.error('Error in generatePersonalizedEmail:', error);
    throw error;
  }
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedEmailPrompt',
  input: {schema: GeneratePersonalizedEmailInputSchema},
  output: {schema: GeneratePersonalizedEmailOutputSchema},
  prompt: encodeToUtf8(sanitizeText(`Generate only the email body content using this exact template format, replacing the placeholder text with appropriate personalized content. Do NOT include the subject line:

Dear {{{Contact_Person}}},

Neural Arc is a generative artificial intelligence company establishing the cognitive infrastructure for enterprises. Our intelligent agent systems integrate natively with existing data, allowing organisations to automate decisions, streamline workflows, and extract actionable insights without costly system replacement.

Key reasons to consider an investment in Neural Arc:
	1.	Strong Market Momentum: The enterprise artificial intelligence sector is shifting decisively toward agentic automation, and Neural Arc occupies a central position in this movement.
	2.	Interoperable Technology: Our proprietary AI agent framework connects effortlessly across diverse data stacks, ensuring rapid deployment and minimal integration friction.
	3.	Scalable Architecture: The platform supports accelerated product rollout across multiple verticals, enabling compounding growth.
	4.	Experienced Leadership: A founding team with successful exits and deep domain expertise guides strategy, execution, and market penetration.

Neural Arc is not merely developing standalone tools. We are constructing the foundation of enterprise cognition. We are currently raising a seed round and would value the opportunity to discuss how your partnership can accelerate our mission.

Please review our investor presentation and select a convenient time for a brief introductory call:
	•	Investor Deck: https://pitch.neuralarc.ai (PIN: [PIN_PLACEHOLDER])
	•	Schedule a Call: https://meet.neuralarc.ai/

Thank you for your consideration. I look forward to our conversation.

Kind regards,
Aniket Tapre
Founder and Chief Executive Officer, Neural Arc

Important: Do not use any contractions. Write out full forms (do not, cannot, will not, I am, you are, it is, they are, we are). Use proper formal business English throughout.`)),
});

const generatePersonalizedEmailFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedEmailFlow',
    inputSchema: GeneratePersonalizedEmailInputSchema,
    outputSchema: GeneratePersonalizedEmailOutputSchema,
  },
  async input => {
    try {
      console.log('Flow input received:', JSON.stringify(input, null, 2));
      
      // Ensure input is properly UTF-8 encoded before processing
      const utf8Input = {
        Contact_Person: encodeToUtf8(input.Contact_Person),
        Designation: encodeToUtf8(input.Designation),
        Investor_Name: encodeToUtf8(input.Investor_Name),
        Location: encodeToUtf8(input.Location),
        ourCompanyName: encodeToUtf8(input.ourCompanyName),
        pitchSummary: encodeToUtf8(input.pitchSummary),
      };
      
      console.log('UTF-8 encoded input:', JSON.stringify(utf8Input, null, 2));
      
      // Final validation before sending to AI
      Object.keys(utf8Input).forEach(key => {
        const value = utf8Input[key as keyof typeof utf8Input];
        for (let i = 0; i < value.length; i++) {
          const charCode = value.charCodeAt(i);
          if (charCode > 127) {
            console.error(`CRITICAL: Found character with code ${charCode} at position ${i} in ${key}`);
            throw new Error(`Invalid character found in ${key} at position ${i}: ${charCode}`);
          }
        }
      });
      
      const {output} = await prompt(utf8Input);
      return output!;
    } catch (error) {
      console.error('AI flow error:', error);
      // Return a fallback response if AI processing fails
      return {
        emailContent: `Dear ${encodeToUtf8(sanitizeText(input.Contact_Person))},

Neural Arc is a generative artificial intelligence company establishing the cognitive infrastructure for enterprises. Our intelligent agent systems integrate natively with existing data, allowing organisations to automate decisions, streamline workflows, and extract actionable insights without costly system replacement.

Key reasons to consider an investment in Neural Arc:
	1.	Strong Market Momentum: The enterprise artificial intelligence sector is shifting decisively toward agentic automation, and Neural Arc occupies a central position in this movement.
	2.	Interoperable Technology: Our proprietary AI agent framework connects effortlessly across diverse data stacks, ensuring rapid deployment and minimal integration friction.
	3.	Scalable Architecture: The platform supports accelerated product rollout across multiple verticals, enabling compounding growth.
	4.	Experienced Leadership: A founding team with successful exits and deep domain expertise guides strategy, execution, and market penetration.

Neural Arc is not merely developing standalone tools. We are constructing the foundation of enterprise cognition. We are currently raising a seed round and would value the opportunity to discuss how your partnership can accelerate our mission.

Please review our investor presentation and select a convenient time for a brief introductory call:
	•	Investor Deck: https://pitch.neuralarc.ai (PIN: [PIN_PLACEHOLDER])
	•	Schedule a Call: https://cal.neuralarc.ai/

Thank you for your consideration. I look forward to our conversation.

Kind regards,
Aniket Tapre
Founder and Chief Executive Officer, Neural Arc`
      };
    }
  }
);