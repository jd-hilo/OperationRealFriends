import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a profile picture to the photos bucket
 * @param file - The file to upload (can be File, Blob, or ArrayBuffer)
 * @param userId - The user's ID to create a unique filename
 * @returns Promise with upload result
 */
export async function uploadProfilePicture(
  file: File | Blob | ArrayBuffer,
  userId: string
): Promise<UploadResult> {
  try {
    const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { data, error } = await supabase.storage
      .from('photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete a profile picture from the photos bucket
 * @param filePath - The path of the file to delete
 * @returns Promise with deletion result
 */
export async function deleteProfilePicture(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('photos')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}

/**
 * Get a public URL for a file in the photos bucket
 * @param filePath - The path of the file
 * @returns The public URL
 */
export function getPhotoUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Extract file path from a full photo URL
 * @param url - The full URL
 * @returns The file path or null if not a valid photos bucket URL
 */
export function extractPhotoPath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Update user's avatar URL in the database
 * @param userId - The user's ID
 * @param avatarUrl - The new avatar URL
 * @returns Promise with update result
 */
export async function updateUserAvatar(userId: string, avatarUrl: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      console.error('Avatar update error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Avatar update exception:', error);
    return false;
  }
} 