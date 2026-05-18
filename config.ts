// -----------------------------------------------------------------------------
// API Keys & Configuration
// -----------------------------------------------------------------------------
// Please replace the placeholder values with your own API keys.
// You can obtain these keys for free from their respective websites.
//
// StyleSense.AI is configured to use these keys to power its features.
// If a key is missing or is the placeholder value, the corresponding feature
// will use fallback data or be disabled.
// -----------------------------------------------------------------------------
  
/** 
 * Your API key from WeatherAPI.com.
 * This is used to fetch real-time weather data to personalize recommendations.
 * @see https://www.weatherapi.com/
 */
export const WEATHER_API_KEY = '988f147385204f4b8da55435250712'; // <-- REPLACE THIS

/**
 * Your API token from HuggingFace.co.
 * This is used for the Style Chatbot as an alternative to Google Gemini.
 * It is only used if the `USE_GEMINI_CHATBOT` flag is set to `false`.
 * @see https://huggingface.co/settings/tokens
 */
export const HUGGING_FACE_API_TOKEN = 'YOUR_HUGGING_FACE_API_TOKEN'; // <-- REPLACE THIS
