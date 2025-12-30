import { createWorker, type Worker, type RecognizeResult } from 'tesseract.js';

/**
 * OCR Service using Tesseract.js
 * Supports multiple Indian languages and provides text extraction with preprocessing
 */

export interface OCRResult {
  text: string;
  confidence: number;
  detectedLanguage: string;
  lines: OCRLine[];
  rawResult: RecognizeResult;
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OCROptions {
  language?: string; // Language code: 'eng', 'hin', 'tam', 'tel', etc.
  preprocessImage?: boolean;
  enhanceContrast?: boolean;
  removeNoise?: boolean;
  onProgress?: (progress: number) => void; // Progress callback (0-1)
}

// Tesseract worker instance (singleton)
let worker: Worker | null = null;
let isInitializing = false;
let initializationPromise: Promise<Worker> | null = null;

/**
 * Language code mappings for Tesseract
 */
export const SUPPORTED_LANGUAGES = {
  english: 'eng',
  hindi: 'hin',
  tamil: 'tam',
  telugu: 'tel',
  kannada: 'kan',
  malayalam: 'mal',
  bengali: 'ben',
  marathi: 'mar',
  gujarati: 'guj',
  punjabi: 'pan',
  assamese: 'asm',
  oriya: 'ori',
} as const;

/**
 * Initialize Tesseract worker
 */
async function initializeWorker(language: string = 'eng+hin'): Promise<Worker> {
  // If already initializing, wait for that to complete
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  // If already initialized, return existing worker
  if (worker) {
    return worker;
  }

  // Start initialization
  isInitializing = true;
  initializationPromise = (async () => {
    try {
      console.log('[OCR] Initializing Tesseract worker with language:', language);
      
      const newWorker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        errorHandler: (err) => {
          console.error('[OCR] Tesseract error:', err);
        },
      });

      worker = newWorker;
      console.log('[OCR] Worker initialized successfully');
      return newWorker;
    } catch (error) {
      console.error('[OCR] Failed to initialize worker:', error);
      throw new Error('Failed to initialize OCR engine');
    } finally {
      isInitializing = false;
    }
  })();

  return initializationPromise;
}

/**
 * Preprocess image for better OCR accuracy
 */
async function preprocessImage(
  imageBlob: Blob,
  options: OCROptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply preprocessing filters
        if (options.enhanceContrast) {
          // Enhance contrast
          enhanceContrast(data);
        }

        if (options.removeNoise) {
          // Remove noise (simple median filter)
          removeNoise(data, canvas.width, canvas.height);
        }

        // Convert to grayscale for better OCR
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg; // Red
          data[i + 1] = avg; // Green
          data[i + 2] = avg; // Blue
        }

        // Apply adaptive thresholding
        applyAdaptiveThreshold(data, canvas.width, canvas.height);

        // Put processed image back
        ctx.putImageData(imageData, 0, 0);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/png',
          1.0
        );
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Enhance image contrast
 */
function enhanceContrast(data: Uint8ClampedArray): void {
  // Find min and max values
  let min = 255;
  let max = 0;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (avg < min) min = avg;
    if (avg > max) max = avg;
  }

  // Stretch contrast
  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        data[i + j] = ((data[i + j] - min) * 255) / range;
      }
    }
  }
}

/**
 * Remove noise using simple averaging
 */
function removeNoise(
  data: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Average with neighbors
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((y + dy) * width + (x + dx)) * 4;
            sum += copy[nIdx + c];
          }
        }
        data[idx + c] = sum / 9;
      }
    }
  }
}

/**
 * Apply adaptive thresholding for better text detection
 */
function applyAdaptiveThreshold(
  data: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const blockSize = 15;
  const C = 10;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate local average
      let sum = 0;
      let count = 0;

      for (let dy = -blockSize / 2; dy <= blockSize / 2; dy++) {
        for (let dx = -blockSize / 2; dx <= blockSize / 2; dx++) {
          const ny = y + dy;
          const nx = x + dx;

          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const nIdx = (ny * width + nx) * 4;
            sum += data[nIdx];
            count++;
          }
        }
      }

      const avg = sum / count;
      const threshold = avg - C;

      // Apply threshold
      const value = data[idx] > threshold ? 255 : 0;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
    }
  }
}

/**
 * Extract text from image using OCR
 */
export async function extractTextFromImage(
  imageBlob: Blob,
  options: OCROptions = {}
): Promise<OCRResult> {
  try {
    console.log('[OCR] Starting text extraction');

    // Default options
    const opts: OCROptions = {
      language: options.language || 'eng+hin', // Support English and Hindi by default
      preprocessImage: options.preprocessImage !== false,
      enhanceContrast: options.enhanceContrast !== false,
      removeNoise: options.removeNoise !== false,
    };

    // Preprocess image if enabled
    let processedBlob = imageBlob;
    if (opts.preprocessImage) {
      console.log('[OCR] Preprocessing image...');
      processedBlob = await preprocessImage(imageBlob, opts);
    }

    // Initialize worker with specified language
    const workerInstance = await initializeWorker(opts.language);

    // Perform OCR
    console.log('[OCR] Recognizing text...');
    const result = await workerInstance.recognize(processedBlob);

    // Extract structured data
    const data: any = result.data;
    const lines = data.lines || [];
    const ocrResult: OCRResult = {
      text: result.data.text.trim(),
      confidence: result.data.confidence,
      detectedLanguage: opts.language || 'unknown',
      lines: lines.map((line: any) => ({
        text: line.text || '',
        confidence: line.confidence || 0,
        bbox: line.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
      })),
      rawResult: result,
    };

    console.log('[OCR] Text extraction complete');
    console.log(`[OCR] Confidence: ${ocrResult.confidence.toFixed(2)}%`);
    console.log(`[OCR] Extracted ${ocrResult.lines.length} lines`);

    return ocrResult;
  } catch (error) {
    console.error('[OCR] Text extraction failed:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract text from multiple images (for multi-page documents)
 */
export async function extractTextFromImages(
  imageBlobs: Blob[],
  options: OCROptions = {}
): Promise<OCRResult[]> {
  const results: OCRResult[] = [];

  for (let i = 0; i < imageBlobs.length; i++) {
    console.log(`[OCR] Processing image ${i + 1}/${imageBlobs.length}`);
    const result = await extractTextFromImage(imageBlobs[i], options);
    results.push(result);
  }

  return results;
}

/**
 * Detect language from image automatically
 */
export async function detectLanguage(imageBlob: Blob): Promise<string> {
  try {
    // Try with script detection
    const workerInstance = await initializeWorker('script/Devanagari+script/Latin');
    const result = await workerInstance.recognize(imageBlob);

    // Analyze detected text to guess language
    const text = result.data.text;
    
    // Check for Devanagari script (Hindi, Marathi, etc.)
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hin'; // Hindi (most common Devanagari language)
    }
    
    // Check for Tamil script
    if (/[\u0B80-\u0BFF]/.test(text)) {
      return 'tam';
    }
    
    // Check for Telugu script
    if (/[\u0C00-\u0C7F]/.test(text)) {
      return 'tel';
    }
    
    // Check for Kannada script
    if (/[\u0C80-\u0CFF]/.test(text)) {
      return 'kan';
    }
    
    // Check for Malayalam script
    if (/[\u0D00-\u0D7F]/.test(text)) {
      return 'mal';
    }
    
    // Check for Bengali script
    if (/[\u0980-\u09FF]/.test(text)) {
      return 'ben';
    }
    
    // Check for Gujarati script
    if (/[\u0A80-\u0AFF]/.test(text)) {
      return 'guj';
    }
    
    // Default to English + Hindi
    return 'eng+hin';
  } catch (error) {
    console.error('[OCR] Language detection failed:', error);
    return 'eng+hin'; // Default fallback
  }
}

/**
 * Validate OCR quality and suggest re-scan if needed
 */
export function validateOCRQuality(result: OCRResult): {
  isGoodQuality: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let isGoodQuality = true;

  // Check confidence
  if (result.confidence < 60) {
    isGoodQuality = false;
    suggestions.push('Low confidence. Try better lighting.');
  }

  // Check if text is too short
  if (result.text.length < 10) {
    isGoodQuality = false;
    suggestions.push('Very little text detected. Ensure book page is clearly visible.');
  }

  // Check line consistency
  const avgLineConfidence =
    result.lines.reduce((sum, line) => sum + line.confidence, 0) /
    result.lines.length;

  if (avgLineConfidence < 70) {
    isGoodQuality = false;
    suggestions.push('Some text is unclear. Try holding camera steady.');
  }

  // Good quality
  if (isGoodQuality) {
    suggestions.push('Good quality! Text extracted successfully.');
  }

  return { isGoodQuality, suggestions };
}

/**
 * Clean up worker resources
 */
export async function terminateWorker(): Promise<void> {
  if (worker) {
    console.log('[OCR] Terminating worker');
    await worker.terminate();
    worker = null;
    initializationPromise = null;
  }
}

/**
 * Get language code from language name
 */
export function getLanguageCode(language: string): string {
  const langLower = language.toLowerCase();
  
  for (const [key, code] of Object.entries(SUPPORTED_LANGUAGES)) {
    if (langLower.includes(key)) {
      return code;
    }
  }
  
  // Default to English + Hindi
  return 'eng+hin';
}

/**
 * Combine multiple OCR results into one
 */
export function combineOCRResults(results: OCRResult[]): OCRResult {
  if (results.length === 0) {
    throw new Error('No results to combine');
  }

  if (results.length === 1) {
    return results[0];
  }

  const combinedText = results.map((r) => r.text).join('\n\n');
  const avgConfidence =
    results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const allLines = results.flatMap((r) => r.lines);

  return {
    text: combinedText,
    confidence: avgConfidence,
    detectedLanguage: results[0].detectedLanguage,
    lines: allLines,
    rawResult: results[0].rawResult, // Use first result's raw data
  };
}
