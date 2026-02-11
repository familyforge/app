# Testimonial Videos

Place all testimonial video files in this folder.

## File Naming Convention:
- `rachel-video.mp4` - Rachel H. testimonial
- `tom-sarah-video.mp4` - Tom & Sarah W. testimonial
- `priya-video.mp4` - Priya K. testimonial
- `marcus-video.mp4` - Marcus D. testimonial
- `jenny-video.mp4` - Jenny L. testimonial
- `chris-amina-video.mp4` - Chris & Amina S. testimonial
- `emma-video.mp4` - Emma R. testimonial
- `david-lisa-video.mp4` - David & Lisa T. testimonial
- `carlos-video.mp4` - Carlos M. testimonial
- `james-claire-video.mp4` - James & Claire H. testimonial

## Format Requirements:
- **Aspect Ratio:** 9:16 (vertical/portrait)
- **Format:** MP4 (H.264 codec)
- **Resolution:** 1080x1920 or 720x1280
- **Duration:** 12-15 seconds each
- **File Size:** Optimize for web (aim for <10MB per video)

## Optimization:
Use FFmpeg to optimize videos for web:
```bash
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M -b:a 128k -movflags +faststart output.mp4
```
