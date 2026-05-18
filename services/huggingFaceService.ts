import { USE_GEMINI_CHATBOT } from '../constants';
import { HUGGING_FACE_API_TOKEN } from '../config';

interface HuggingFaceResponse {
  generated_text: string;
}

const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

export const sendMessageToHuggingFace = async (prompt: string): Promise<string> => {
  if (!HUGGING_FACE_API_TOKEN || HUGGING_FACE_API_TOKEN === 'YOUR_HUGGING_FACE_API_TOKEN') {
      return "The Hugging Face chatbot is not configured. Please add your API token to `config.ts`.";
  }

  try {
    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          return_full_text: false,
          temperature: 0.7,
          top_p: 0.95,
        }
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API error:", errorBody);
      throw new Error(`Hugging Face API request failed with status ${response.status}`);
    }

    const result: HuggingFaceResponse[] = await response.json();
    if (result && result.length > 0 && result[0].generated_text) {
      return result[0].generated_text.trim();
    }
    
    throw new Error('Invalid response from Hugging Face API');

  } catch (error) {
    console.error("Error sending message to Hugging Face:", error);
    return "Sorry, I'm having a little trouble right now. Please try again later.";
  }
};