// Uploading profile photos.
//
// The image picker hands back a local sandbox URI:
//
//   file:///var/mobile/Containers/Data/Application/<uuid>/.../image.jpg
//
// Storing that is what broke photos across devices and apps — it is a path into
// one app's private container on one handset. These helpers upload the bytes to
// Supabase Storage and return a public URL that any app on any device can load.

import { File } from 'expo-file-system';
import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET = 'avatars';

/** A value that is already a usable URL rather than a device-local path. */
export function isRemoteUrl(value?: string | null): boolean {
  if (!value) return false;
  return value.startsWith('http://') || value.startsWith('https://');
}

function extensionFor(uri: string): { ext: string; contentType: string } {
  const lower = uri.split('?')[0].toLowerCase();
  if (lower.endsWith('.png')) return { ext: 'png', contentType: 'image/png' };
  if (lower.endsWith('.webp')) return { ext: 'webp', contentType: 'image/webp' };
  if (lower.endsWith('.heic')) return { ext: 'heic', contentType: 'image/heic' };
  return { ext: 'jpg', contentType: 'image/jpeg' };
}

/**
 * Upload a local image and return its public URL.
 *
 * Returns the input unchanged when it is already a remote URL, so callers can
 * pass a value through without checking first — re-saving a profile that was
 * not edited will not re-upload the same picture.
 *
 * Returns null on failure rather than throwing: a photo that will not upload
 * should never block saving the rest of a profile.
 */
export async function uploadAvatar(
  localUri: string | null | undefined,
  folder: 'children' | 'parents'
): Promise<string | null> {
  if (!localUri) return null;
  if (isRemoteUrl(localUri)) return localUri;
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    // The storage policy requires the first path segment to be the user id, so
    // without a session there is nowhere valid to write.
    if (!userId) return null;

    const { ext, contentType } = extensionFor(localUri);

    // React Native's fetch cannot reliably produce an ArrayBuffer from a file://
    // URI. expo-file-system v19's File.bytes() returns a Uint8Array directly,
    // which avoids a base64 round-trip that would inflate a 2 MB photo to ~2.7 MB
    // in memory before upload.
    const bytes = await new File(localUri).bytes();

    const path = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.warn('[storage] avatar upload failed:', error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl ?? null;
  } catch (err) {
    console.warn('[storage] avatar upload failed:', err);
    return null;
  }
}

/**
 * Resolve a stored value for display.
 *
 * Legacy rows still hold `file://` paths from before uploading existed. Those
 * are unusable anywhere except the device that created them, so they are
 * treated as absent — the caller falls back to initials rather than rendering a
 * broken image.
 */
export function displayableImage(value?: string | null): string | null {
  if (!value) return null;
  if (isRemoteUrl(value)) return value;
  return null;
}
