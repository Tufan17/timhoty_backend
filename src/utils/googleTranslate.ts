import { Translate } from '@google-cloud/translate/build/src/v2';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize Google Translate client
const translate = new Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Path to service account key file
  // Alternative: use API key
  key: process.env.GOOGLE_TRANSLATE_API_KEY
});

export interface TranslateOptions {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

export interface TranslateResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Translates text using Google Translate API
 * @param options - Translation options
 * @returns Promise with translation result
 */
export const translateText = async (options: TranslateOptions): Promise<TranslateResult> => {
  try {
    const { text, targetLanguage, sourceLanguage } = options;

    // Configure translation options
    const translateOptions: any = {
      to: targetLanguage,
    };

    if (sourceLanguage) {
      translateOptions.from = sourceLanguage;
    }

    // Perform translation
    const [translation, metadata] = await translate.translate(text, translateOptions);

    return {
      translatedText: Array.isArray(translation) ? translation[0] : translation,
      sourceLanguage: metadata?.data?.translations?.[0]?.detectedSourceLanguage || sourceLanguage || 'auto',
      targetLanguage
    };
  } catch (error) {
    console.error('Google Translate Error:', error);
    throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Translates multiple texts at once
 * @param texts - Array of texts to translate
 * @param targetLanguage - Target language code
 * @param sourceLanguage - Source language code (optional)
 * @returns Promise with array of translation results
 */
export const translateMultiple = async (
  texts: string[],
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslateResult[]> => {
  try {
    const translateOptions: any = {
      to: targetLanguage,
    };

    if (sourceLanguage) {
      translateOptions.from = sourceLanguage;
    }

    // Perform batch translation
    const [translations, metadata] = await translate.translate(texts, translateOptions);

    return texts.map((originalText, index) => ({
      translatedText: Array.isArray(translations) ? translations[index] : translations,
      sourceLanguage: metadata?.data?.translations?.[index]?.detectedSourceLanguage || sourceLanguage || 'auto',
      targetLanguage
    }));
  } catch (error) {
    console.error('Google Translate Multiple Error:', error);
    throw new Error(`Batch translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Detects the language of the given text
 * @param text - Text to detect language for
 * @returns Promise with detected language code
 */
export const detectLanguage = async (text: string): Promise<string> => {
  try {
    const [detection] = await translate.detect(text);
    const detectionResult = Array.isArray(detection) ? detection[0] : detection;
    return detectionResult.language;
  } catch (error) {
    console.error('Language Detection Error:', error);
    throw new Error(`Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets list of supported languages
 * @param targetLanguage - Language to get the list in (optional)
 * @returns Promise with array of supported languages
 */
export const getSupportedLanguages = async (targetLanguage?: string) => {
  try {
    const [languages] = await translate.getLanguages(targetLanguage);
    return languages;
  } catch (error) {
    console.error('Get Supported Languages Error:', error);
    throw new Error(`Failed to get supported languages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export default translate function for convenience
export default translateText;
