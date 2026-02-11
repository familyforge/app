# Video Setup Guide

## 📁 Folder Structure
```
assets/
  ├── videos/
  │   └── testimonials/         ← Local testimonial videos
  └── images/
      └── testimonials/         ← Local testimonial thumbnails
```

---

## 🎬 **Local Testimonial Videos** (Current Setup)

All testimonial videos are stored **locally** in this codebase for faster loading and offline support.

### **How to Add Testimonial Videos:**

1. **Place your video files** in `assets/videos/testimonials/`:
   ```
   rachel-video.mp4
   tom-sarah-video.mp4
   marcus-video.mp4
   ... etc
   ```

2. **Place your thumbnail images** in `assets/images/testimonials/`:
   ```
   rachel-thumbnail.jpg
   tom-sarah-thumbnail.jpg
   marcus-thumbnail.jpg
   ... etc
   ```

3. **They're already configured!** The code in [landing.tsx](src/app/landing.tsx) uses:
   ```typescript
   thumbnailUrl: require("../../../assets/images/testimonials/rachel-thumbnail.jpg")
   videoUrl: require("../../../assets/videos/testimonials/rachel-video.mp4")
   ```

✅ **Benefits:**
- Faster loading (bundled with app)
- Works offline
- No CDN costs
- No external dependencies

---

## ☁️ **Using Cloudinary for Demo Video** (Optional)

If you want to host a **demo/promo video** on Cloudinary (separate from testimonials):

### **Option 1: Add to the same array**
```typescript
const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  // ... local testimonials above ...
  
  // Demo video from Cloudinary
  { 
    name: "App Demo", 
    role: "See FamilyForge in Action", 
    thumbnailColor: "#8b5cf6", 
    thumbnailUrl: "https://res.cloudinary.com/YOUR_CLOUD/image/upload/v123/demo-thumb.jpg",
    videoUrl: "https://res.cloudinary.com/YOUR_CLOUD/video/upload/v123/demo-video.mp4"
  }
];
```

### **Option 2: Create separate demo section**
```typescript
// For the main hero demo video
const DEMO_VIDEO = {
  thumbnailUrl: "https://res.cloudinary.com/YOUR_CLOUD/image/upload/v123/demo-thumb.jpg",
  videoUrl: "https://res.cloudinary.com/YOUR_CLOUD/video/upload/v123/demo-video.mp4"
};
```

---

## 🎥 **YouTube Videos** (Alternative)

To use YouTube instead of local/Cloudinary:

```typescript
{
  name: "Rachel H.",
  role: "Mum of 4, Bristol",
  thumbnailColor: "#f43f5e",
  thumbnailUrl: require("../../../assets/images/testimonials/rachel-thumbnail.jpg"),
  videoUrl: "dQw4w9WgXcQ",  // YouTube video ID only
  isYouTube: true            // Enable YouTube mode
}
```

---

## 🔀 **Mixing Local + Remote** (Best of Both Worlds)

You can mix local and remote sources in the same array:

```typescript
const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  // Local testimonials
  { 
    name: "Rachel H.", 
    thumbnailUrl: require("../../../assets/images/testimonials/rachel-thumbnail.jpg"),
    videoUrl: require("../../../assets/videos/testimonials/rachel-video.mp4")
  },
  
  // Cloudinary demo
  { 
    name: "App Demo", 
    thumbnailUrl: "https://res.cloudinary.com/cloud/image/upload/demo-thumb.jpg",
    videoUrl: "https://res.cloudinary.com/cloud/video/upload/demo-video.mp4"
  },
  
  // YouTube version
  { 
    name: "Marcus D.", 
    thumbnailUrl: require("../../../assets/images/testimonials/marcus-thumbnail.jpg"),
    videoUrl: "abc123xyz",
    isYouTube: true
  }
];
```

---

## 📊 **Recommended Approach**

✅ **Testimonials:** Local (already configured)  
☁️ **Demo/Promo:** Cloudinary (larger file, updated frequently)  
📺 **Social Proof:** YouTube (if already published there)

---

## 🛠️ **Video Optimization**

Before adding videos, optimize them:

```bash
# Optimize for web (H.264, smaller size)
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M -b:a 128k -movflags +faststart output.mp4

# Extract thumbnail from video
ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 -q:v 2 thumbnail.jpg

# Convert to 9:16 if needed
ffmpeg -i input.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" output.mp4
```

---

## 📝 **File Checklist**

Before deploying, ensure you have:

- [ ] 10 video files in `assets/videos/testimonials/`
- [ ] 10 thumbnail images in `assets/images/testimonials/`
- [ ] All files named correctly (matching code)
- [ ] All videos are 9:16 vertical format
- [ ] All videos are under 10MB each
- [ ] Thumbnails are under 500KB each

---

**Current setup:** Local testimonials only (no Cloudinary needed for testimonials)  
**To add demo video:** See "Option 1" or "Option 2" above
