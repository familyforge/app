// Testimonial media — NATIVE build.
//
// Deliberately empty. `landing.tsx` is a marketing page reachable only when
// Platform.OS === 'web' (see src/app/index.tsx), yet its `require()` calls were
// static, so Metro bundled every testimonial video into BOTH native apps:
//
//   10 videos x 9.6 MB = 92 MB
//   + 7.5 MB of thumbnails
//
// That was the bulk of a 142 MB Kids app that ships no video of its own.
//
// Metro resolves `testimonialMedia.web.ts` for web and this file for iOS and
// Android, so the requires simply do not exist in a native bundle. The videos
// are still served on the web landing page exactly as before.

export interface TestimonialMedia {
  thumbnail: number | null;
  video: number | null;
}

/** Native builds never render the landing page, so there is nothing to load. */
export const TESTIMONIAL_MEDIA: Record<string, TestimonialMedia> = {};

export function testimonialMedia(_key: string): TestimonialMedia {
  return { thumbnail: null, video: null };
}
