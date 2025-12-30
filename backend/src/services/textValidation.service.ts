import axios from 'axios';
import logger from '../utils/logger';

/**
 * Text Validation Service using Gemini API
 * Validates OCR-extracted text and corrects errors, fills gaps, and improves readability
 */

// Helper function to get API key at runtime
function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return apiKey;
}

const GEMINI_MODEL = 'gemini-2.0-flash-exp';

export interface TextValidationParams {
  ocrText: string;
  language: string;
  dialect?: string;
  context?: string; // Optional context (e.g., "Educational textbook for grade 5")
  confidence?: number; // OCR confidence score
}

export interface ValidatedText {
  originalText: string;
  correctedText: string;
  changesMade: TextChange[];
  confidence: number;
  qualityScore: number; // 0-100
  suggestions: string[];
}

export interface TextChange {
  type: 'correction' | 'addition' | 'formatting' | 'grammar';
  original: string;
  corrected: string;
  position: number;
  reason: string;
}

/**
 * Validate and correct OCR-extracted text using Gemini
 */
export async function validateAndCorrectText(
  params: TextValidationParams
): Promise<ValidatedText> {
  try {
    logger.info('Validating OCR text with Gemini', {
      language: params.language,
      textLength: params.ocrText.length,
      confidence: params.confidence,
    });

    const apiKey = getGeminiApiKey();
    const prompt = createValidationPrompt(params);

    // Call Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.candidates || !response.data.candidates[0]) {
      throw new Error('No response from Gemini API');
    }

    const responseText = response.data.candidates[0].content.parts[0].text;

    // Parse the validation result
    const validatedText = parseValidationResponse(responseText, params.ocrText);

    logger.info('Text validation complete', {
      changesMade: validatedText.changesMade.length,
      qualityScore: validatedText.qualityScore,
    });

    return validatedText;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    logger.error('Text validation failed', {
      message: errorMessage,
      status: error.response?.status,
    });
    throw new Error(`Text validation failed: ${errorMessage}`);
  }
}

/**
 * Create validation prompt for Gemini
 */
function createValidationPrompt(params: TextValidationParams): string {
  const { ocrText, language, dialect, context, confidence } = params;

  let dialectInstructions = '';
  if (dialect) {
    dialectInstructions = `
- The text is in ${language} (${dialect} dialect)
- Preserve the regional dialect characteristics
- Use authentic ${dialect} expressions where appropriate`;
  }

  let contextInstructions = '';
  if (context) {
    contextInstructions = `
- Context: ${context}
- Ensure corrections are appropriate for this context`;
  }

  let confidenceInstructions = '';
  if (confidence !== undefined) {
    if (confidence < 60) {
      confidenceInstructions = `
- OCR confidence is LOW (${confidence.toFixed(1)}%) - expect many errors
- Be more aggressive with corrections`;
    } else if (confidence < 80) {
      confidenceInstructions = `
- OCR confidence is MODERATE (${confidence.toFixed(1)}%) - some errors expected
- Focus on obvious mistakes`;
    } else {
      confidenceInstructions = `
- OCR confidence is HIGH (${confidence.toFixed(1)}%) - minimal errors expected
- Only fix clear mistakes`;
    }
  }

  return `You are an expert text validation and correction AI specializing in Indian languages and educational content. Your task is to validate and correct OCR-extracted text.

**Original OCR Text:**
\`\`\`
${ocrText}
\`\`\`

**Validation Requirements:**
- Language: ${language}${dialect ? ` (${dialect} dialect)` : ''}${contextInstructions}${confidenceInstructions}${dialectInstructions}

**Your Tasks:**
1. **Correct OCR Errors**: Fix misrecognized characters, words, and punctuation
   - Common OCR mistakes: l vs I, O vs 0, rn vs m, etc.
   - Fix jumbled/broken words
   - Correct spelling mistakes

2. **Fill Missing Content**: If text appears incomplete or sentences are broken
   - Add missing words to complete sentences
   - Fill logical gaps (but mark these clearly as additions)
   - Ensure natural flow

3. **Improve Formatting**: Fix line breaks, spacing, and structure
   - Remove unnecessary line breaks within sentences
   - Fix paragraph breaks
   - Correct spacing issues

4. **Grammar & Syntax**: Fix grammatical errors
   - Subject-verb agreement
   - Tense consistency
   - Proper sentence structure

5. **Preserve Meaning**: Do NOT change the core meaning or intent
   - Keep technical terms intact
   - Preserve names, dates, numbers
   - Maintain original style and tone

**Output Format (JSON):**
{
  "correctedText": "The fully corrected text with all improvements",
  "changes": [
    {
      "type": "correction|addition|formatting|grammar",
      "original": "Text before correction",
      "corrected": "Text after correction",
      "reason": "Brief explanation of why this change was made"
    }
  ],
  "qualityScore": 85,
  "suggestions": [
    "Suggestion 1 for further improvement",
    "Suggestion 2..."
  ]
}

**Important:**
- qualityScore: Rate the CORRECTED text quality from 0-100 (0=unusable, 100=perfect)
- If text is completely unreadable (quality < 30), suggest re-scanning
- Be conservative with additions - only add what's clearly missing
- Preserve cultural and regional references
- For educational content, ensure age-appropriate language

Generate the validation result now:`;
}

/**
 * Parse Gemini validation response
 */
function parseValidationResponse(
  responseText: string,
  originalText: string
): ValidatedText {
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      originalText,
      correctedText: parsed.correctedText || originalText,
      changesMade: (parsed.changes || []).map((change: any, index: number) => ({
        type: change.type || 'correction',
        original: change.original || '',
        corrected: change.corrected || '',
        position: index,
        reason: change.reason || 'No reason provided',
      })),
      confidence: 100, // Gemini's confidence in its corrections
      qualityScore: parsed.qualityScore || 50,
      suggestions: parsed.suggestions || [],
    };
  } catch (error) {
    logger.error('Failed to parse validation response:', error);

    // Fallback: Return original text with minimal info
    return {
      originalText,
      correctedText: originalText,
      changesMade: [],
      confidence: 50,
      qualityScore: 50,
      suggestions: ['Unable to validate text. Using original OCR output.'],
    };
  }
}

/**
 * Quick validation check (simpler, faster)
 */
export async function quickValidate(
  ocrText: string,
  _language: string
): Promise<{ isValid: boolean; issues: string[] }> {
  const issues: string[] = [];
  let isValid = true;

  // Check text length
  if (ocrText.trim().length < 10) {
    isValid = false;
    issues.push('Text is too short');
  }

  // Check for excessive special characters (indicates OCR failure)
  const specialCharRatio =
    (ocrText.match(/[^a-zA-Z0-9\s\u0900-\u097F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/g) || []).length / ocrText.length;
  
  if (specialCharRatio > 0.3) {
    isValid = false;
    issues.push('Too many special characters - possible OCR error');
  }

  // Check for incomplete words (consecutive characters without spaces)
  if (ocrText.match(/[a-zA-Z\u0900-\u097F]{50,}/)) {
    isValid = false;
    issues.push('Very long words detected - possible OCR error');
  }

  return { isValid, issues };
}

/**
 * Batch validate multiple text extractions
 */
export async function validateMultipleTexts(
  texts: TextValidationParams[]
): Promise<ValidatedText[]> {
  const results: ValidatedText[] = [];

  for (const params of texts) {
    const result = await validateAndCorrectText(params);
    results.push(result);
  }

  return results;
}

/**
 * Generate a summary of changes made
 */
export function generateChangeSummary(validatedText: ValidatedText): string {
  const { changesMade, qualityScore } = validatedText;

  if (changesMade.length === 0) {
    return 'No changes were necessary. Text was already clean.';
  }

  const corrections = changesMade.filter((c) => c.type === 'correction').length;
  const additions = changesMade.filter((c) => c.type === 'addition').length;
  const formatting = changesMade.filter((c) => c.type === 'formatting').length;
  const grammar = changesMade.filter((c) => c.type === 'grammar').length;

  let summary = `Made ${changesMade.length} improvements:\n`;
  if (corrections > 0) summary += `- ${corrections} corrections\n`;
  if (additions > 0) summary += `- ${additions} additions\n`;
  if (formatting > 0) summary += `- ${formatting} formatting fixes\n`;
  if (grammar > 0) summary += `- ${grammar} grammar fixes\n`;
  summary += `\nQuality Score: ${qualityScore}/100`;

  return summary;
}
