import axios from 'axios';
import logger from '../utils/logger';

// Gemini API Configuration (using v1beta for gemini-1.5-flash)
// Read API key at runtime, not at import time
const GEMINI_MODEL = 'gemini-1.5-flash-001';

// Helper function to get API key at runtime
function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return apiKey;
}

export interface ScriptGenerationParams {
  topic: string;
  gradeLevel: string;
  language: string;
  duration: number;
  dialect?: string;
  state?: string;
  accentPreference?: string;
}

export interface GeneratedScript {
  title: string;
  script: string;
  scenes: ScriptScene[];
  estimatedDuration: number;
  language?: string;
  dialect?: string;
}

export interface ScriptScene {
  sceneNumber: number;
  narration: string;
  visualDescription: string;
  duration: number;
  ssml?: string;
}

// Indian Teacher Voice Characteristics
const indianTeacherStyle = `
**INDIAN TEACHER VOICE CHARACTERISTICS:**
1. **Warm & Encouraging Tone**: Like a caring Indian teacher who believes in every student
   - Use encouraging phrases: "बहुत अच्छा" (very good), "शाबाश" (well done), "चलो" (come on)
   - Address students warmly: "बच्चों" (children), "दोस्तों" (friends), "प्यारे बच्चों" (dear children)
   
2. **Repetition for Clarity**: Indian teaching style emphasizes repetition
   - Repeat key concepts in different words
   - Use "याद रखो" (remember), "ध्यान दो" (pay attention)
   
3. **Relatable Examples**: Use Indian daily life examples
   - "जैसे तुम्हारी माँ रोटी बनाती है..." (like your mother makes roti...)
   - "गर्मी की छुट्टियों में जब तुम गाँव जाते हो..." (when you visit village in summer vacation...)
   - Local context: markets, festivals, foods, games students know
   
4. **Interactive Teaching Style**:
   - Ask rhetorical questions: "क्या तुम जानते हो?" (do you know?)
   - Use "चलो देखें" (let's see), "आओ सीखें" (come, let's learn)
   - Include "समझे?" (understood?) at key points
   
5. **Moral & Values Integration**: Indian teachers often add life lessons
   - Connect topic to values: hard work, honesty, respect for nature/elders
   
6. **Patient Explanation**: Break complex concepts into simple steps
   - "पहले" (first), "फिर" (then), "अंत में" (finally)
`;

/**
 * Generate educational script using Gemini API
 */
export async function generateScript(
  params: ScriptGenerationParams
): Promise<GeneratedScript> {
  try {
    logger.info('Generating script with Gemini', params);

    // Get API key at runtime
    let apiKey: string;
    try {
      apiKey = getGeminiApiKey();
    } catch (e) {
      logger.warn('Gemini API key missing, using MOCK data for testing');
      return generateMockScript(params);
    }

    const prompt = createScriptPrompt(params);

    // Use v1beta API endpoint for gemini-2.0-flash-exp (confirmed working)
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        timeout: 60000, // 60 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.candidates || !response.data.candidates[0]) {
      throw new Error('No response from Gemini API');
    }

    const text = response.data.candidates[0].content.parts[0].text;

    // Parse the response into structured format
    const parsedScript = parseScriptResponse(text, params.duration);

    // Add metadata
    parsedScript.language = params.language;
    parsedScript.dialect = params.dialect;

    logger.info(`Script generated successfully: ${parsedScript.scenes.length} scenes`);
    return parsedScript;
  } catch (error: any) {
    // If it's an API key error (403), fallback to mock
    if (error.response?.status === 403 || error.message.includes('GEMINI_API_KEY')) {
      logger.warn('Gemini API 403 Forbidden (Invalid Key), using MOCK data for testing');
      return generateMockScript(params);
    }

    // Log only the error message and status, not the full axios error object
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    const errorStatus = error.response?.status || 'N/A';
    logger.error('Failed to generate script', {
      message: errorMessage,
      status: errorStatus,
      topic: params.topic
    });
    throw new Error(`Script generation failed: ${errorMessage}`);
  }
}

/**
 * Generate mock script for testing when API key is missing/invalid
 */
function generateMockScript(params: ScriptGenerationParams): GeneratedScript {
  const estimatedScenes = Math.ceil(params.duration / 30);

  // Create mock scenes
  const scenes: ScriptScene[] = [];
  for (let i = 1; i <= estimatedScenes; i++) {
    scenes.push({
      sceneNumber: i,
      narration: `(Mock Narration for Scene ${i}) This is a test script about ${params.topic} in ${params.language} (${params.dialect || 'Standard'}).`,
      visualDescription: `Educational illustration for ${params.topic}, scene ${i}`,
      duration: 30
    });
  }

  return {
    title: `${params.topic} - Mock Lesson`,
    script: `Mock script for ${params.topic}`,
    scenes: scenes,
    estimatedDuration: params.duration,
    language: params.language,
    dialect: params.dialect
  };
}

/**
 * Create a detailed prompt for script generation
 */
function createScriptPrompt(params: ScriptGenerationParams): string {
  const { topic, gradeLevel, language, duration, dialect, state, accentPreference } = params;
  const estimatedScenes = Math.ceil(duration / 30); // ~30 seconds per scene

  // Construct dialect instructions
  let dialectInstructions = '';
  if (dialect) {
    dialectInstructions = `
**IMPORTANT - Regional Dialect (${dialect}):**
- Use ${dialect} dialect/accent for the narration
- Include colloquial phrases and expressions natural to ${dialect} speakers
- Maintain authentic local flavor while keeping content educational
- Use informal, conversational tone that ${dialect} speakers use in daily life
${state ? `- Context: ${state} region` : ''}
`;
  }

  // Speaking style
  const speakingStyle = accentPreference === 'child-friendly'
    ? 'warm, encouraging, and simple - like a caring teacher speaking to young students'
    : 'conversational and friendly';

  return `You are an expert educational content creator. Generate an engaging educational lesson script.

**Requirements:**
- Topic: ${topic}
- Grade Level: ${gradeLevel}
- Language: ${language} ${dialect ? `(${dialect} dialect)` : ''}
- Target Duration: ${duration} seconds (approximately ${estimatedScenes} scenes)
- Each scene should be 20-40 seconds long

**SPEAKING STYLE:**
${speakingStyle}
${indianTeacherStyle}
${dialectInstructions}

**Output Format (JSON):**
{
  "title": "Lesson Title",
  "script": "Full script text",
  "scenes": [
    {
      "sceneNumber": 1,
      "narration": "What the narrator will say in this scene (in ${language}/${dialect})",
      "visualDescription": "Detailed description of what should be shown visually",
      "duration": 30
    }
  ]
}

**Guidelines:**
1. Make the content age-appropriate for grade ${gradeLevel}
2. Use simple, clear language in ${language}
3. Include real-world examples and analogies
4. Structure: Introduction -> Main Content -> Summary/Conclusion
5. Each scene's visual description should be specific enough for image generation
6. Keep narration conversational and engaging
7. Include questions or prompts to encourage thinking
8. **CRITICAL**: Ensure valid JSON output.

Generate the complete lesson script now:`;
}

/**
 * Parse Gemini API response into structured script
 */
function parseScriptResponse(
  responseText: string,
  targetDuration: number
): GeneratedScript {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and adjust durations
    let totalDuration = 0;
    const adjustedScenes = parsed.scenes.map((scene: any, index: number) => {
      const duration = scene.duration || 30;
      totalDuration += duration;
      return {
        sceneNumber: index + 1,
        narration: scene.narration,
        visualDescription: scene.visualDescription,
        duration,
        ssml: scene.ssml // Preserve SSML if present
      };
    });

    // Adjust scene durations if total doesn't match target
    if (totalDuration !== targetDuration) {
      const scaleFactor = targetDuration / totalDuration;
      adjustedScenes.forEach((scene: ScriptScene) => {
        scene.duration = Math.round(scene.duration * scaleFactor);
      });
    }

    return {
      title: parsed.title,
      script: parsed.script,
      scenes: adjustedScenes,
      estimatedDuration: targetDuration,
    };
  } catch (error) {
    logger.error('Failed to parse script response:', error);

    // Fallback: Create a simple single-scene script
    return {
      title: 'Educational Lesson',
      script: responseText,
      scenes: [
        {
          sceneNumber: 1,
          narration: responseText.substring(0, 500),
          visualDescription: 'Educational illustration related to the topic',
          duration: targetDuration,
        },
      ],
      estimatedDuration: targetDuration,
    };
  }
}

/**
 * Generate visual descriptions for scenes (can be used with Imagen)
 */
export function enhanceVisualDescriptions(scenes: ScriptScene[]): ScriptScene[] {
  return scenes.map((scene) => {
    // Add more specific prompts for better image generation
    const enhancedDescription = `Educational illustration: ${scene.visualDescription}. 
      Style: Clean, colorful, age-appropriate, pedagogical. 
      High quality, professional educational content.`;

    return {
      ...scene,
      visualDescription: enhancedDescription,
    };
  });
}
