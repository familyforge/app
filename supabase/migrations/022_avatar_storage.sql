-- Storage for profile photos.
--
-- Photos were being saved as the local URI the image picker returned:
--
--   file:///var/mobile/Containers/Data/Application/2277ACDC-.../image.jpg
--
-- That path is inside the parent app's own sandbox on one specific handset. It
-- is meaningless to the Kids app (a different bundle id, a different container),
-- meaningless on a second device, and breaks even on the same phone after a
-- reinstall because the container UUID changes.
--
-- Photos now upload here and the tables store a public URL instead.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,                                   -- public read: both apps display these
  5242880,                                -- 5 MB ceiling, well above a resized avatar
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

-- Anyone may READ. These are profile pictures rendered in two apps, and the
-- object names are random UUIDs rather than anything guessable.
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Writes are restricted to the owning parent's own folder. The first path
-- segment must be their user id, so one parent cannot overwrite another's
-- photos even though the bucket is publicly readable.
DROP POLICY IF EXISTS "avatars owner insert" ON storage.objects;
CREATE POLICY "avatars owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars owner update" ON storage.objects;
CREATE POLICY "avatars owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars owner delete" ON storage.objects;
CREATE POLICY "avatars owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
