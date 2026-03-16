import { supabase } from "@/integrations/supabase/client";

/**
 * Create a signed URL for a file in a private storage bucket.
 * Returns the signed URL or null if generation fails.
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    console.error(`Failed to create signed URL for ${bucket}/${path}:`, error.message);
    return null;
  }
  return data.signedUrl;
}
