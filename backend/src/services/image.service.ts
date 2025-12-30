import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger';

export interface ImageGenerationParams {
  prompt: string;
  outputPath: string;
  width?: number;
  height?: number;
}

/**
 * Generate image using Imagen API (Google's image generation)
 * Note: This is a placeholder - actual Imagen API integration may vary
 */
export async function generateImageWithImagen(
  params: ImageGenerationParams
): Promise<string> {
  try {
    const { prompt, outputPath } = params;

    logger.info('Generating image with Imagen', { prompt: prompt.substring(0, 50) });

    // TODO: Implement actual Imagen API integration
    // This is a placeholder that falls back to Pexels
    
    if (process.env.ENABLE_IMAGEN === 'true' && process.env.IMAGEN_API_KEY) {
      // Imagen API call would go here
      logger.warn('Imagen API not yet implemented, falling back to Pexels');
    }

    // Fallback to Pexels
    return await searchAndDownloadImage(prompt, outputPath);
  } catch (error: any) {
    logger.error('Image generation with Imagen failed:', error);
    
    // Fallback to Pexels
    return await searchAndDownloadImage(params.prompt, params.outputPath);
  }
}

/**
 * Search and download image from Pexels
 */
export async function searchAndDownloadImage(
  query: string,
  outputPath: string
): Promise<string> {
  try {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      throw new Error('PEXELS_API_KEY not configured');
    }

    logger.info('Searching Pexels for image', { query: query.substring(0, 50) });

    // Search Pexels API
    const response = await axios.get('https://api.pexels.com/v1/search', {
      headers: {
        Authorization: apiKey,
      },
      params: {
        query: extractKeywords(query),
        per_page: 15,
        orientation: 'landscape',
      },
    });

    if (!response.data.photos || response.data.photos.length === 0) {
      throw new Error(`No images found for query: ${query}`);
    }

    // Get a random image from top results
    const randomIndex = Math.floor(Math.random() * Math.min(5, response.data.photos.length));
    const photo = response.data.photos[randomIndex];
    const imageUrl = photo.src.large;

    // Download the image
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Save the image
    await fs.writeFile(outputPath, imageResponse.data);

    logger.info(`Image downloaded from Pexels: ${outputPath}`);
    return outputPath;
  } catch (error: any) {
    logger.error('Failed to download image from Pexels:', error);
    throw new Error(`Pexels image download failed: ${error.message}`);
  }
}

/**
 * Generate images for multiple scenes
 */
export async function generateImagesForScenes(
  scenes: Array<{ visualDescription: string; sceneNumber: number }>,
  outputDir: string,
  useImagen: boolean = true
): Promise<string[]> {
  try {
    logger.info(`Generating images for ${scenes.length} scenes`);

    const imageFiles: string[] = [];

    // Process scenes with rate limiting (avoid API throttling)
    for (const scene of scenes) {
      const outputPath = path.join(outputDir, `scene_${scene.sceneNumber}.jpg`);

      try {
        if (useImagen && process.env.ENABLE_IMAGEN === 'true') {
          await generateImageWithImagen({
            prompt: scene.visualDescription,
            outputPath,
          });
        } else {
          await searchAndDownloadImage(scene.visualDescription, outputPath);
        }
        imageFiles.push(outputPath);
      } catch (error) {
        logger.error(`Failed to generate image for scene ${scene.sceneNumber}:`, error);
        // Create a placeholder image
        const placeholderPath = await createPlaceholderImage(outputPath);
        imageFiles.push(placeholderPath);
      }

      // Rate limiting: wait 1 second between API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    logger.info(`Generated ${imageFiles.length} images`);
    return imageFiles;
  } catch (error: any) {
    logger.error('Failed to generate images for scenes:', error);
    throw error;
  }
}

/**
 * Extract relevant keywords from a description for better image search
 */
function extractKeywords(description: string): string {
  // Remove common words and extract meaningful keywords
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const words = description.toLowerCase().split(/\s+/);
  const keywords = words.filter((word) => !stopWords.includes(word) && word.length > 3);
  
  // Take first 5 keywords
  return keywords.slice(0, 5).join(' ');
}

/**
 * Create a placeholder image when image generation fails
 */
async function createPlaceholderImage(outputPath: string): Promise<string> {
  try {
    // Download a generic educational placeholder image
    const placeholderUrl = 'https://via.placeholder.com/1024x768/4A90E2/FFFFFF?text=Educational+Content';
    
    const response = await axios.get(placeholderUrl, {
      responseType: 'arraybuffer',
    });

    await fs.writeFile(outputPath, response.data);
    logger.info(`Created placeholder image: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error('Failed to create placeholder image:', error);
    throw error;
  }
}

/**
 * Validate and resize image if needed
 */
export async function validateAndResizeImage(
  imagePath: string,
  _maxWidth: number = 1920,
  _maxHeight: number = 1080
): Promise<string> {
  // TODO: Implement image validation and resizing using sharp or similar library
  // For now, just return the original path
  return imagePath;
}
