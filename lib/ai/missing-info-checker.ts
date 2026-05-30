import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

export const missingInfoSchema = z.object({
  isComplete: z.boolean().describe("True if all required fields are present in the case notes for the specified work type."),
  missingFields: z.array(z.string()).describe("A list of required fields that are missing from the case notes. Empty if all are present."),
  extractedInfo: z.record(z.string(), z.any()).describe("A key-value map of the information that was successfully extracted from the notes."),
  recommendations: z.array(z.string()).describe("A list of recommended fields that are missing, or general suggestions for the case."),
});

export type MissingInfoResult = z.infer<typeof missingInfoSchema>;

/**
 * AI-powered missing information engine for Dental Lab Cases.
 * Analyzes case notes against specific work type requirements to flag missing information.
 */
export async function checkCaseForMissingInfo(
  caseNotes: string,
  workType: string
): Promise<MissingInfoResult> {
  
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasOpenAI && !hasClaude) {
    console.warn("No AI API Keys set. Skipping AI missing info check.");
    return {
      isComplete: false,
      missingFields: ["AI Check Disabled (Missing API Keys)"],
      extractedInfo: {},
      recommendations: ["Configure OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local."],
    };
  }

  // Prefer Claude 3.5 Sonnet if available, otherwise fallback to GPT-4o
  const model = hasClaude 
    ? anthropic('claude-3-5-sonnet-20240620')
    : openai('gpt-4o');

  // System prompt detailing the project's Missing Information Engine rules
  const systemPrompt = `
You are an AI Missing Information Assistant for a Dental Lab SaaS.
Your job is to read the doctor's case notes and determine if any required fields are missing based on the work type requested.

### Requirements per Work Type

1. **General (if not specified otherwise)**
   - Required: doctor, patient name, work type, units count, tooth numbers, due date, material, shade (when required by material), scan file or physical impression confirmation.

2. **Zircon Crown**
   - Required: doctor, patient name, shade, units count, tooth numbers, material, due date, STL/scan file OR physical impression marked true.

3. **Emax**
   - Required: doctor, patient name, shade, units count, tooth numbers, material, due date, STL/scan file OR physical impression marked true.
   - Recommended: preparation photo.

4. **Implant**
   - Required: implant system, scan body info, bite info, scan file.
   - Recommended: DICOM, photos.

5. **Night Guard**
   - Required: arch, bite info, due date, scan or impression.

Analyze the provided case notes for the specified work type.
- Extract any information that IS present.
- Identify what REQUIRED fields are missing.
- Identify what RECOMMENDED fields are missing.
- Set isComplete to true ONLY if ALL REQUIRED fields are present.
`;

  try {
    const { object } = await generateObject({
      model: model,
      schema: missingInfoSchema,
      system: systemPrompt,
      prompt: `Work Type: ${workType}\n\nCase Notes:\n${caseNotes}`,
    });

    return object;
  } catch (error) {
    console.error("Error generating missing info analysis:", error);
    // Graceful error fallback
    return {
      isComplete: false,
      missingFields: ["Error performing AI check"],
      extractedInfo: {},
      recommendations: ["An error occurred while communicating with the AI service. Please verify manually."],
    };
  }
}
