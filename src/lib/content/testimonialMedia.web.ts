// Testimonial media — WEB build.
//
// These requires live here rather than in landing.tsx so that Metro only ever
// sees them when bundling for web. The native counterpart
// (`testimonialMedia.ts`) returns nulls, which keeps ~100 MB of marketing media
// out of the iOS and Android binaries.
//
// NOTE: all ten videos are currently byte-identical (same MD5) — the same 9.6 MB
// placeholder copied ten times. Until real footage replaces them, they all point
// at one file, so the web bundle carries 9.6 MB instead of 96 MB. Swap the
// individual paths back in as genuine videos arrive.

import type { TestimonialMedia } from './testimonialMedia';

const PLACEHOLDER_VIDEO = require('../../../assets/videos/testimonials/rachel-video.mp4');

export const TESTIMONIAL_MEDIA: Record<string, TestimonialMedia> = {
  rachel: {
    thumbnail: require('../../../assets/images/testimonials/rachel-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  'tom-sarah': {
    thumbnail: require('../../../assets/images/testimonials/tom-sarah-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  priya: {
    thumbnail: require('../../../assets/images/testimonials/priya-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  marcus: {
    thumbnail: require('../../../assets/images/testimonials/marcus-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  jenny: {
    thumbnail: require('../../../assets/images/testimonials/jenny-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  'david-lisa': {
    thumbnail: require('../../../assets/images/testimonials/david-lisa-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  emma: {
    thumbnail: require('../../../assets/images/testimonials/emma-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  carlos: {
    thumbnail: require('../../../assets/images/testimonials/carlos-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  'chris-amina': {
    thumbnail: require('../../../assets/images/testimonials/chris-amina-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
  'james-claire': {
    thumbnail: require('../../../assets/images/testimonials/james-claire-thumbnail.jpeg'),
    video: PLACEHOLDER_VIDEO,
  },
};

export function testimonialMedia(key: string): TestimonialMedia {
  return TESTIMONIAL_MEDIA[key] ?? { thumbnail: null, video: null };
}
