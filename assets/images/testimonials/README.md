# Testimonial Thumbnails

Place all testimonial thumbnail images in this folder.

## File Naming Convention:
- `rachel-thumbnail.jpg` - Rachel H. thumbnail
- `tom-sarah-thumbnail.jpg` - Tom & Sarah W. thumbnail
- `priya-thumbnail.jpg` - Priya K. thumbnail
- `marcus-thumbnail.jpg` - Marcus D. thumbnail
- `jenny-thumbnail.jpg` - Jenny L. thumbnail
- `chris-amina-thumbnail.jpg` - Chris & Amina S. thumbnail
- `emma-thumbnail.jpg` - Emma R. thumbnail
- `david-lisa-thumbnail.jpg` - David & Lisa T. thumbnail
- `carlos-thumbnail.jpg` - Carlos M. thumbnail
- `james-claire-thumbnail.jpg` - James & Claire H. thumbnail

## Format Requirements:
- **Aspect Ratio:** 9:16 (vertical/portrait)
- **Format:** JPG or PNG
- **Resolution:** 1080x1920 or 720x1280 (same as video)
- **File Size:** <500KB per image

## How to Extract from Video:
Use FFmpeg to extract a frame from the video at 1 second:
```bash
ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 -q:v 2 thumbnail.jpg
```
