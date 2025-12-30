import { Router, Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * POST /api/validate-text
 * Validates and optionally corrects teacher-edited text
 */
router.post('/validate-text', async (req: Request, res: Response): Promise<any> => {
	try {
		const { text, language, gradeLevel } = req.body;

		if (!text || !text.trim()) {
			return res.status(400).json({
				success: false,
				error: 'Text is required'
			});
		}

		const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

		const prompt = `You are an educational content validator helping teachers create quality video content.

Review this text for a Grade ${gradeLevel} educational video in ${language}.

Check for:
1. Grammar and spelling errors
2. Age-appropriateness for grade ${gradeLevel}
3. Clarity and structure
4. Sentence completeness
5. Educational value

Text to validate:
"""
${text}
"""

Provide your response in JSON format:
{
  "correctedText": "The corrected version (only if corrections needed, otherwise return original)",
  "hasErrors": true/false,
  "changes": [
    {"type": "grammar|spelling|clarity", "original": "...", "corrected": "...", "reason": "..."}
  ],
  "suggestions": ["List of improvement suggestions"],
  "isAppropriate": true/false,
  "appropriatenessNote": "Note about age-appropriateness"
}`;

		const result = await model.generateContent(prompt);
		const response = result.response.text();

		// Extract JSON from response
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		
		if (jsonMatch) {
			const validation = JSON.parse(jsonMatch[0]);
			
			res.json({
				success: true,
				correctedText: validation.correctedText || text,
				hasErrors: validation.hasErrors || false,
				changes: validation.changes || [],
				suggestions: validation.suggestions || [],
				isAppropriate: validation.isAppropriate !== false,
				appropriatenessNote: validation.appropriatenessNote || ''
			});
		} else {
			// Fallback: no corrections needed
			res.json({
				success: true,
				correctedText: text,
				hasErrors: false,
				changes: [],
				suggestions: [],
				isAppropriate: true,
				appropriatenessNote: 'Text appears appropriate'
			});
		}
	} catch (error) {
		console.error('Text validation error:', error);
		res.status(500).json({
			success: false,
			error: 'Validation service unavailable. Please try again.'
		});
	}
});

export default router;
