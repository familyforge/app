-- Per-child visual preferences.
--
-- The Kids app is deliberately bright and saturated, which works for most
-- children and is actively unpleasant for some. Children with sensory
-- processing differences, autism, photosensitivity or migraine can find high
-- chroma and constant motion genuinely distressing.
--
-- This is set BY THE PARENT and stored per child, not per device: the need
-- belongs to the child, so it must follow them onto whatever handset they sign
-- in to rather than being re-toggled each time.

-- 'vivid' — the default bright palette
-- 'calm'  — dark, low-saturation, gentle contrast
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS visual_theme TEXT NOT NULL DEFAULT 'vivid';

ALTER TABLE public.children DROP CONSTRAINT IF EXISTS children_visual_theme_valid;
ALTER TABLE public.children ADD CONSTRAINT children_visual_theme_valid
  CHECK (visual_theme IN ('vivid', 'calm'));

-- Separate from the palette on purpose. Motion sensitivity and colour
-- sensitivity often occur together but not always, and a child who wants the
-- bright colours may still need the movement to stop.
ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS reduce_motion BOOLEAN NOT NULL DEFAULT false;
