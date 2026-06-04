export type NavItem = 'Dashboard' | 'Virtual Try-On' | 'Outfit Generator' | 'Style Chatbot' | 'Style Quiz' | 'Feedback';

export interface Outfit {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  gender?: 'Men' | 'Women'; // optional — items without gender show for all users
  // Extended ML model fields
  style?: string;
  color?: string;
  pattern?: string;
  fabric?: string;
  fit?: string;
  occasion?: string;
  description?: string;
  cluster?: number;
}

export interface Garment {
  name:string;
  imageUrl: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface WeatherData {
    temp: number;
    description: string;
    icon: string;
}

export interface LocationData {
    name: string;
    country: string;
    region?: string;
}

export interface QuizDetails {
    vibe: 'Casual' | 'Classic' | 'Elegant' | 'Formal' | '';
    bodyType: 'Hourglass' | 'Pear' | 'Apple' | 'Rectangle' | '';
    gender: 'Men' | 'Women' | 'Prefer Not To Say' | '';
    heightFt?: number;
    heightIn?: number;
    bust?: number; // inches
    waist?: number; // inches
    hips?: number; // inches
    season: 'Summer' | 'Winter' | 'Spring' | 'Fall' | '';
    occasion: 'Streetwear' | 'Old Money' | 'Casual' | 'Formal' | '';
}

// --- Background Job Processing Types ---

export type JobStatus = 'processing' | 'completed' | 'failed';

export interface TryOnJob {
  id: string;
  status: JobStatus;
  personImage: string;
  garment: Garment;
  resultImage?: string;
  error?: string;
}
