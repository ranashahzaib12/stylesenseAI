import { supabase } from '../lib/supabaseClient';
import type { QuizDetails } from '../types';

export const uploadTryOnImage = async (userId: string, imageBase64: string): Promise<string | null> => {
  try {
    // Convert Base64 to Blob
    const res = await fetch(imageBase64);
    const blob = await res.blob();
    
    const fileName = `${userId}/${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('tryons')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading image:', JSON.stringify(uploadError, null, 2));
      return null;
    }

    const { data } = supabase.storage
      .from('tryons')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Error processing upload:', error);
    return null;
  }
};

export const saveTryOnRecord = async (userId: string, imageUrl: string, garmentName: string, garmentImageUrl: string) => {
  const { error } = await supabase
    .from('tryon_history')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      garment_name: garmentName,
      garment_image_url: garmentImageUrl
    });

  if (error) {
    console.error('Error saving history record:', JSON.stringify(error, null, 2));
    throw error;
  }
};

export const fetchUserTryOnHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('tryon_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
      console.error('Error fetching history:', JSON.stringify(error, null, 2));
      return [];
  }
  return data || [];
};

// --- User Profile / Quiz Data ---

export const saveUserProfile = async (userId: string, quizDetails: QuizDetails) => {
    // FIX: The database error explicitely states "Perhaps you meant the table 'public.profiles'".
    // We are reverting to 'profiles'. Note: Ensure your 'profiles' table has a 'quiz_data' column (jsonb).
    // If your profiles table uses 'id' instead of 'user_id' as the primary key (common in Supabase), we map it here.
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: userId, // Mapping userId to 'id' which is standard for the profiles table
            quiz_data: quizDetails,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error saving user profile:', JSON.stringify(error, null, 2));
        // Fallback: If 'id' column fails, it might be 'user_id'. 
        // We log it but don't crash the app flow entirely for the user.
        throw error;
    }
};

export const fetchUserProfile = async (userId: string): Promise<QuizDetails | null> => {
    // FIX: Reverting to 'profiles' table.
    const { data, error } = await supabase
        .from('profiles')
        .select('quiz_data')
        .eq('id', userId) // Using 'id' to match standard profiles table
        .maybeSingle();

    if (error) {
        // If the error is about column 'id' not existing, we might need 'user_id', 
        // but 'profiles' usually uses 'id' as primary key linked to auth.users.
        console.error('Error fetching user profile:', JSON.stringify(error, null, 2));
        return null;
    }
    return data?.quiz_data || null;
};