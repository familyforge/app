# Duplicate Rachel's video and thumbnail for all 9 other testimonials

Write-Host "Copying videos..." -ForegroundColor Green

Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\tom-sarah-video.mp4"
Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\priya-video.mp4"
Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\marcus-video.mp4"
Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\jenny-video.mp4"
Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\chris-amina-video.mp4"
Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\emma-video.mp4"
Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\david-lisa-video.mp4"
Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\carlos-video.mp4"
Copy-Item "assets\videos\testimonials\rachel-video.mp4" "assets\videos\testimonials\james-claire-video.mp4"

Write-Host "Copying thumbnails..." -ForegroundColor Green

Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\tom-sarah-thumbnail.jpeg"
Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\priya-thumbnail.jpeg"
Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\marcus-thumbnail.jpeg"
Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\jenny-thumbnail.jpeg"
Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\chris-amina-thumbnail.jpeg"
Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\emma-thumbnail.jpeg"
Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\david-lisa-thumbnail.jpeg"
Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\carlos-thumbnail.jpeg"
Copy-Item "assets\images\testimonials\rachel-thumbnail.jpeg" "assets\images\testimonials\james-claire-thumbnail.jpeg"

Write-Host "`nDone! Listing files..." -ForegroundColor Green
Write-Host "`nVideos:" -ForegroundColor Yellow
Get-ChildItem "assets\videos\testimonials\*.mp4" | Select-Object Name

Write-Host "`nThumbnails:" -ForegroundColor Yellow
Get-ChildItem "assets\images\testimonials\*.jpeg" | Select-Object Name

Write-Host "`nAll testimonial files created successfully!" -ForegroundColor Green
