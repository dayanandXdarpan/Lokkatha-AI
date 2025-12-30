import logger from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Provides semantic search and context retrieval for folklore and educational content
 * 
 * NOTE: This is a lightweight implementation using keyword matching and TF-IDF
 * For production, consider upgrading to ChromaDB, Pinecone, or Weaviate
 */

export interface FolkloreStory {
  id: string;
  title: string;
  content: string;
  region: string;
  state: string;
  language: string;
  dialect?: string;
  gradeLevel: number[];
  moral: string;
  keywords: string[];
  characters: string[];
  themes: string[];
  culturalContext?: string;
}

export interface SearchResult {
  story: FolkloreStory;
  score: number;
  relevance: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
}

// In-memory folklore database (will be loaded from JSON)
let folkloreDatabase: FolkloreStory[] = [];
let isInitialized = false;

/**
 * Initialize RAG system - load folklore database
 */
export async function initializeRAG(): Promise<void> {
  try {
    const folkloreDataPath = path.join(__dirname, '../data/folklore.json');
    
    // Check if file exists
    try {
      await fs.access(folkloreDataPath);
    } catch {
      logger.warn('Folklore database not found, creating empty database');
      folkloreDatabase = [];
      isInitialized = true;
      return;
    }

    const data = await fs.readFile(folkloreDataPath, 'utf-8');
    const parsed = JSON.parse(data);
    folkloreDatabase = parsed.stories || [];

    logger.info('RAG system initialized', {
      storiesLoaded: folkloreDatabase.length,
      regions: [...new Set(folkloreDatabase.map(s => s.region))].length,
      languages: [...new Set(folkloreDatabase.map(s => s.language))].length
    });

    isInitialized = true;
  } catch (error: any) {
    logger.error('Failed to initialize RAG system', { error: error.message });
    folkloreDatabase = [];
    isInitialized = true; // Continue with empty database
  }
}

/**
 * Search folklore database using keyword matching and TF-IDF scoring
 */
export async function searchFolklore(
  query: string,
  filters?: {
    state?: string;
    region?: string;
    language?: string;
    gradeLevel?: number;
    theme?: string;
  },
  limit: number = 5
): Promise<SearchResult[]> {
  if (!isInitialized) {
    await initializeRAG();
  }

  if (folkloreDatabase.length === 0) {
    logger.warn('Folklore database is empty');
    return [];
  }

  // Extract keywords from query
  const queryKeywords = extractKeywords(query);

  // Filter stories by criteria
  let filteredStories = folkloreDatabase;

  if (filters?.state) {
    filteredStories = filteredStories.filter(s => 
      s.state.toLowerCase() === filters.state!.toLowerCase()
    );
  }

  if (filters?.region) {
    filteredStories = filteredStories.filter(s => 
      s.region.toLowerCase().includes(filters.region!.toLowerCase())
    );
  }

  if (filters?.language) {
    filteredStories = filteredStories.filter(s => 
      s.language.toLowerCase() === filters.language!.toLowerCase()
    );
  }

  if (filters?.gradeLevel) {
    filteredStories = filteredStories.filter(s => 
      s.gradeLevel.includes(filters.gradeLevel!)
    );
  }

  if (filters?.theme) {
    filteredStories = filteredStories.filter(s => 
      s.themes.some(t => t.toLowerCase().includes(filters.theme!.toLowerCase()))
    );
  }

  // Score each story
  const scoredResults = filteredStories.map(story => {
    const score = calculateRelevanceScore(queryKeywords, story);
    const matchedKeywords = getMatchedKeywords(queryKeywords, story);
    
    let relevance: 'high' | 'medium' | 'low' = 'low';
    if (score >= 0.7) relevance = 'high';
    else if (score >= 0.4) relevance = 'medium';

    return {
      story,
      score,
      relevance,
      matchedKeywords
    };
  });

  // Sort by score and return top results
  const results = scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  logger.info('Folklore search completed', {
    query,
    filters,
    resultsFound: results.length,
    topScore: results[0]?.score
  });

  return results;
}

/**
 * Get folklore context for Gemini prompt enhancement (Multi-language support)
 */
export async function getFolkloreContext(
  topic: string,
  gradeLevel: number,
  state?: string,
  language?: string
): Promise<string> {
  const results = await searchFolklore(topic, {
    state,
    language,
    gradeLevel
  }, 3); // Get top 3 results

  if (results.length === 0) {
    // Try without language filter if no results
    const fallbackResults = await searchFolklore(topic, {
      state,
      gradeLevel
    }, 3);
    
    if (fallbackResults.length === 0) {
      logger.info(`No folklore found for topic: ${topic}, state: ${state}, language: ${language}`);
      return '';
    }
    
    logger.info(`Using fallback folklore (any language) for: ${topic}`);
    return formatFolkloreContext(fallbackResults, language || 'English');
  }

  return formatFolkloreContext(results, language || 'English');
}

/**
 * Format folklore context for Gemini prompt
 */
function formatFolkloreContext(results: SearchResult[], targetLanguage: string): string {
  const languageInstructions: Record<string, string> = {
    'Hindi': 'कृपया इन लोककथाओं के तत्वों को पाठ में स्वाभाविक रूप से शामिल करें।',
    'Tamil': 'இந்த நாட்டுப்புறக் கதைகளின் கூறுகளை இயற்கையாகப் பாடத்தில் இணைக்கவும்.',
    'Telugu': 'దయచేసి ఈ జానపద కథల అంశాలను పాఠంలో సహజంగా చేర్చండి.',
    'Bengali': 'এই লোককাহিনীগুলির উপাদানগুলি পাঠে স্বাভাবিকভাবে অন্তর্ভুক্ত করুন।',
    'Marathi': 'कृपया या लोककथांचे घटक धड्यात नैसर्गिकरित्या समाविष्ट करा।',
    'English': 'Please incorporate elements from these folklore stories naturally into the lesson.'
  };
  
  const instruction = languageInstructions[targetLanguage] || languageInstructions['English'];

  const contextParts = results.map((result, index) => {
    const { story, relevance, matchedKeywords } = result;
    return `
### Folklore Reference ${index + 1}: ${story.title} (${relevance} relevance)
**Region**: ${story.region}, ${story.state}
**Language**: ${story.language}${story.dialect ? ` (${story.dialect} dialect)` : ''}
**Moral Lesson**: ${story.moral}
**Keywords Matched**: ${matchedKeywords.join(', ')}
**Story Summary**: ${story.content.substring(0, 300)}...
**Characters**: ${story.characters.join(', ')}
**Themes**: ${story.themes.join(', ')}
**Cultural Context**: ${story.culturalContext || 'Traditional folklore'}
**Educational Use**: ${getEducationalUseInLanguage(story, targetLanguage)}
`;
  });

  return `
## RELEVANT FOLKLORE CONTEXT FOR ${targetLanguage.toUpperCase()} LESSON

The following folklore stories are culturally relevant to the topic:

${contextParts.join('\n')}

**Instructions for ${targetLanguage} Output**: 
${instruction}

- Use similar storytelling patterns and moral lessons
- Reference local characters, places, or cultural elements when appropriate
- Maintain authenticity to the regional culture
- **CRITICAL**: Write ALL narration in ${targetLanguage} language
- Adapt the folklore context naturally - don't translate literally
- Make cultural references clear and grade-appropriate
`;
}

/**
 * Get educational use instructions in target language
 */
function getEducationalUseInLanguage(story: FolkloreStory, language: string): string {
  const templates: Record<string, string> = {
    'Hindi': `इस कहानी से ${story.moral} सिखाया जा सकता है। पात्र: ${story.characters.join(', ')}`,
    'Tamil': `இந்தக் கதையிலிருந்து ${story.moral} கற்பிக்கலாம். பாத்திரங்கள்: ${story.characters.join(', ')}`,
    'Telugu': `ఈ కథ నుండి ${story.moral} నేర్పవచ్చు। పాత్రలు: ${story.characters.join(', ')}`,
    'Bengali': `এই গল্প থেকে ${story.moral} শেখানো যায়। চরিত্র: ${story.characters.join(', ')}`,
    'Marathi': `या कथेतून ${story.moral} शिकवता येते। पात्र: ${story.characters.join(', ')}`,
    'English': `This story teaches ${story.moral}. Characters: ${story.characters.join(', ')}`
  };
  
  return templates[language] || templates['English'];
}

/**
 * Extract keywords from text (simple tokenization)
 */
function extractKeywords(text: string): string[] {
  // Remove punctuation and convert to lowercase
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
    'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
    'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'so', 'to', 'up',
    'we', 'by', 'do', 'as', 'at', 'be', 'an', 'am', 'no'
  ]);
  
  return words.filter(w => !stopWords.has(w));
}

/**
 * Calculate relevance score using TF-IDF-like approach
 */
function calculateRelevanceScore(
  queryKeywords: string[],
  story: FolkloreStory
): number {
  let score = 0;
  const storyText = `${story.title} ${story.content} ${story.keywords.join(' ')} ${story.themes.join(' ')}`.toLowerCase();

  // Keyword matching
  for (const keyword of queryKeywords) {
    // Exact match in keywords (high weight)
    if (story.keywords.some(k => k.toLowerCase().includes(keyword))) {
      score += 0.3;
    }
    
    // Match in themes (high weight)
    if (story.themes.some(t => t.toLowerCase().includes(keyword))) {
      score += 0.25;
    }
    
    // Match in title (medium weight)
    if (story.title.toLowerCase().includes(keyword)) {
      score += 0.2;
    }
    
    // Match in content (low weight)
    if (storyText.includes(keyword)) {
      score += 0.1;
    }
  }

  // Normalize score to 0-1 range
  return Math.min(score / queryKeywords.length, 1);
}

/**
 * Get list of matched keywords
 */
function getMatchedKeywords(
  queryKeywords: string[],
  story: FolkloreStory
): string[] {
  const matched: string[] = [];
  const allStoryKeywords = [
    ...story.keywords,
    ...story.themes,
    ...story.title.toLowerCase().split(/\s+/)
  ];

  for (const queryKw of queryKeywords) {
    for (const storyKw of allStoryKeywords) {
      if (storyKw.toLowerCase().includes(queryKw) || queryKw.includes(storyKw.toLowerCase())) {
        matched.push(storyKw);
        break;
      }
    }
  }

  return [...new Set(matched)]; // Remove duplicates
}

/**
 * Get all stories by region
 */
export function getStoriesByRegion(region: string): FolkloreStory[] {
  return folkloreDatabase.filter(s => 
    s.region.toLowerCase().includes(region.toLowerCase())
  );
}

/**
 * Get all stories by state
 */
export function getStoriesByState(state: string): FolkloreStory[] {
  return folkloreDatabase.filter(s => 
    s.state.toLowerCase() === state.toLowerCase()
  );
}

/**
 * Get random story (for inspiration)
 */
export function getRandomStory(filters?: {
  language?: string;
  gradeLevel?: number;
}): FolkloreStory | null {
  let pool = folkloreDatabase;

  if (filters?.language) {
    pool = pool.filter(s => s.language === filters.language);
  }

  if (filters?.gradeLevel) {
    pool = pool.filter(s => s.gradeLevel.includes(filters.gradeLevel!));
  }

  if (pool.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Get statistics about the folklore database
 */
export function getFolkloreStats() {
  return {
    totalStories: folkloreDatabase.length,
    regions: [...new Set(folkloreDatabase.map(s => s.region))],
    states: [...new Set(folkloreDatabase.map(s => s.state))],
    languages: [...new Set(folkloreDatabase.map(s => s.language))],
    themes: [...new Set(folkloreDatabase.flatMap(s => s.themes))],
    gradeLevels: [...new Set(folkloreDatabase.flatMap(s => s.gradeLevel))].sort()
  };
}
