import logger from '../utils/logger';

/**
 * Character Consistency Service
 * Extracts and maintains character information across scenes
 */

export interface Character {
  name: string;
  description: string; // Physical appearance
  role: string; // protagonist, teacher, friend, etc.
  firstAppearance: number; // scene number
  appearances: number[]; // All scene numbers where character appears
}

export interface CharacterManifest {
  characters: Character[];
  mainCharacter?: Character;
  jobId: string;
  createdAt: string;
}

/**
 * Extract character names from script narration
 * Looks for proper nouns and common character indicators
 */
export function extractCharactersFromScript(script: any): Character[] {
  const characters: Map<string, Character> = new Map();
  
  // Common Indian names patterns (case-insensitive)
  const namePatterns = [
    // Hindi/North Indian
    /\b(Raju|Rani|Amit|Priya|Rahul|Anjali|Arjun|Meera|Krishna|Radha|Ganesh|Lakshmi)\b/gi,
    // South Indian
    /\b(Kumar|Lakshman|Ravi|Devi|Muthu|Chandra|Sundari|Venkat)\b/gi,
    // Common titles
    /\b(Raja|Rani|Pandit|Guru|Baba|Didi|Chacha|Mausi)\b/gi,
  ];
  
  // Generic character descriptors
  const rolePatterns = [
    /\b(boy|girl|child|student|teacher|farmer|merchant|king|queen|prince|princess)\b/gi,
    /\b(man|woman|villager|friend|helper|elder|youth)\b/gi,
  ];
  
  script.scenes.forEach((scene: any, index: number) => {
    const text = scene.narration || '';
    const imagePrompt = scene.image_prompt || '';
    const combined = `${text} ${imagePrompt}`;
    
    // Extract proper names
    namePatterns.forEach(pattern => {
      const matches = combined.matchAll(pattern);
      for (const match of matches) {
        const name = match[0];
        const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        
        if (!characters.has(normalized)) {
          characters.set(normalized, {
            name: normalized,
            description: extractCharacterDescription(combined, normalized),
            role: extractCharacterRole(combined, normalized),
            firstAppearance: index + 1,
            appearances: [index + 1]
          });
        } else {
          const char = characters.get(normalized)!;
          if (!char.appearances.includes(index + 1)) {
            char.appearances.push(index + 1);
          }
        }
      }
    });
    
    // Extract role-based characters (if no proper names found)
    if (characters.size === 0) {
      rolePatterns.forEach(pattern => {
        const matches = combined.matchAll(pattern);
        for (const match of matches) {
          const role = match[0];
          const normalized = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
          const characterName = `The ${normalized}`;
          
          if (!characters.has(characterName)) {
            characters.set(characterName, {
              name: characterName,
              description: extractCharacterDescription(combined, role),
              role: normalized,
              firstAppearance: index + 1,
              appearances: [index + 1]
            });
          } else {
            const char = characters.get(characterName)!;
            if (!char.appearances.includes(index + 1)) {
              char.appearances.push(index + 1);
            }
          }
        }
      });
    }
  });
  
  return Array.from(characters.values());
}

/**
 * Extract physical description from context around character name
 */
function extractCharacterDescription(text: string, _characterName: string): string {
  // Look for descriptors near the character name
  // Character name for future context-aware extraction
  const lowerText = text.toLowerCase();
  
  const descriptors = [];
  
  // Age descriptors
  if (lowerText.includes('young') || lowerText.includes('child') || lowerText.includes('boy') || lowerText.includes('girl')) {
    descriptors.push('young');
  } else if (lowerText.includes('old') || lowerText.includes('elder')) {
    descriptors.push('elderly');
  }
  
  // Clothing
  const clothingPatterns = [
    /wearing (a |an )?([\w\s]+)/i,
    /dressed in (a |an )?([\w\s]+)/i,
    /in (a |an )?(dhoti|kurta|saree|shirt|dress|turban)/i,
  ];
  
  clothingPatterns.forEach(pattern => {
    const match = lowerText.match(pattern);
    if (match && match[2]) {
      descriptors.push(match[2].trim());
    } else if (match && match[1]) {
      descriptors.push(match[1].trim());
    }
  });
  
  // Colors
  const colors = ['white', 'blue', 'red', 'yellow', 'green', 'orange', 'purple', 'black', 'brown', 'golden'];
  colors.forEach(color => {
    if (lowerText.includes(color)) {
      descriptors.push(color);
    }
  });
  
  return descriptors.length > 0 ? descriptors.join(', ') : 'simple clothing';
}

/**
 * Determine character role from context
 */
function extractCharacterRole(text: string, _characterName: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('hero') || lowerText.includes('protagonist') || lowerText.includes('main character')) {
    return 'protagonist';
  } else if (lowerText.includes('teacher') || lowerText.includes('guru') || lowerText.includes('mentor')) {
    return 'teacher';
  } else if (lowerText.includes('farmer') || lowerText.includes('cultivator')) {
    return 'farmer';
  } else if (lowerText.includes('king') || lowerText.includes('raja')) {
    return 'king';
  } else if (lowerText.includes('queen') || lowerText.includes('rani')) {
    return 'queen';
  } else if (lowerText.includes('friend')) {
    return 'friend';
  } else if (lowerText.includes('villager')) {
    return 'villager';
  }
  
  return 'character';
}

/**
 * Create character manifest for a job
 */
export function createCharacterManifest(script: any, jobId: string): CharacterManifest {
  const characters = extractCharactersFromScript(script);
  
  // Identify main character (most appearances)
  let mainCharacter: Character | undefined;
  if (characters.length > 0) {
    mainCharacter = characters.reduce((max, char) => 
      char.appearances.length > max.appearances.length ? char : max
    );
  }
  
  logger.info(`Extracted ${characters.length} characters from script`, {
    jobId,
    characters: characters.map(c => ({ name: c.name, appearances: c.appearances.length }))
  });
  
  return {
    characters,
    mainCharacter,
    jobId,
    createdAt: new Date().toISOString()
  };
}

/**
 * Enhance image prompt with character consistency
 * Adds character name and description to maintain visual consistency
 */
export function enhanceImagePromptWithCharacter(
  originalPrompt: string, 
  character: Character,
  sceneNumber: number
): string {
  // Check if this is the character's first appearance
  const isFirstAppearance = character.firstAppearance === sceneNumber;
  
  if (isFirstAppearance) {
    // First appearance: establish character
    return `${originalPrompt}. Main character: ${character.name} (${character.description}). Remember this character's appearance for future scenes.`;
  } else {
    // Subsequent appearances: reference previous
    return `${originalPrompt}. Same character from previous scenes: ${character.name} (${character.description}). Maintain consistent appearance: same face, same clothing, same style.`;
  }
}

/**
 * Process all scenes and enhance with character consistency
 */
export function enhanceScriptWithCharacterConsistency(script: any, manifest: CharacterManifest): any {
  const enhancedScenes = script.scenes.map((scene: any) => {
    let enhancedPrompt = scene.image_prompt;
    
    // Find characters that appear in this scene
    const sceneCharacters = manifest.characters.filter(char => 
      char.appearances.includes(scene.scene_number)
    );
    
    // If main character appears, prioritize them
    if (manifest.mainCharacter && sceneCharacters.includes(manifest.mainCharacter)) {
      enhancedPrompt = enhanceImagePromptWithCharacter(
        enhancedPrompt,
        manifest.mainCharacter,
        scene.scene_number
      );
    } else if (sceneCharacters.length > 0) {
      // Use the first character found
      enhancedPrompt = enhanceImagePromptWithCharacter(
        enhancedPrompt,
        sceneCharacters[0],
        scene.scene_number
      );
    }
    
    return {
      ...scene,
      image_prompt: enhancedPrompt,
      characters: sceneCharacters.map(c => c.name) // Add character metadata
    };
  });
  
  return {
    ...script,
    scenes: enhancedScenes,
    characterManifest: manifest
  };
}
