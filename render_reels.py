import os
import sys
import shutil
import subprocess
from pathlib import Path
import imageio_ffmpeg
from playwright.sync_api import sync_playwright

def main():
    # Define directories
    base_dir = Path("c:/SUNUCU_PAKETI/TurTakip_Arayuz")
    dist_file = base_dir / "dist" / "reels_animation.html"
    temp_dir = base_dir / "temp_frames"
    output_video = base_dir / "zyronova_reels_final.mp4"
    
    # Check if reels_animation.html exists in dist
    if not dist_file.exists():
        print(f"Error: HTML file not found at {dist_file}")
        sys.exit(1)
        
    # Create temp directory
    if temp_dir.exists():
        shutil.rmtree(temp_dir)
    temp_dir.mkdir(parents=True, exist_ok=True)
    
    print("Initializing Playwright...")
    with sync_playwright() as p:
        # Launch Chromium with exact Reels aspect ratio
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(
            viewport={"width": 1080, "height": 1920},
            device_scale_factor=1.0
        )
        
        # Load local HTML file
        url = dist_file.absolute().as_uri()
        print(f"Loading local animation page: {url}")
        page.goto(url)
        
        # Wait for page fonts & icons to load
        print("Waiting for web fonts and assets to load...")
        page.evaluate("document.fonts.ready")
        page.wait_for_timeout(2000) # Additional safety wait for CSS animations to register
        
        # 32 seconds loop at 60 FPS = 1920 frames
        fps = 60
        duration_sec = 32
        total_frames = fps * duration_sec
        time_step_ms = 1000.0 / fps
        
        print("Pausing CSS animations for frame-by-frame render...")
        page.evaluate("document.getAnimations().forEach(anim => anim.pause())")
        
        print(f"Rendering {total_frames} frames at 60 FPS (1080x1920)...")
        
        # Loop and render each frame
        for frame in range(total_frames):
            time_ms = frame * time_step_ms
            
            # Step all animations to current frame timestamp
            page.evaluate(f"""
                document.getAnimations().forEach(anim => {{
                    anim.currentTime = {time_ms};
                }});
            """)
            
            # Take a high-quality screenshot
            frame_path = temp_dir / f"frame_{frame:04d}.jpg"
            page.screenshot(
                path=str(frame_path),
                type="jpeg",
                quality=100
            )
            
            if (frame + 1) % 60 == 0 or frame == 0:
                percent = ((frame + 1) / total_frames) * 100
                print(f"Render progress: {frame + 1}/{total_frames} frames ({percent:.1f}%)")
        
        browser.close()
    
    # Get imageio-ffmpeg executable
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    print(f"Using FFmpeg: {ffmpeg_exe}")
    
    # Check if there is an audio file in the folder to overlay
    audio_file = base_dir / "background_music.mp3"
    
    # Build FFmpeg command
    # -y: overwrite output
    # -framerate 60: read frames at 60 FPS
    # -i frame_%04d.jpg: input pattern
    # -c:v libx264: H.264 codec
    # -pix_fmt yuv420p: compatibility pixel format
    # -crf 17: high-quality rendering (lower is better quality)
    ffmpeg_cmd = [
        str(ffmpeg_exe),
        "-y",
        "-framerate", str(fps),
        "-i", str(temp_dir / "frame_%04d.jpg")
    ]
    
    # If audio file is found, add it
    if audio_file.exists():
        print(f"Found audio file: {audio_file}. Overlaying onto video...")
        ffmpeg_cmd.extend([
            "-i", str(audio_file),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-crf", "17",
            "-movflags", "+faststart",
            "-c:a", "aac",
            "-shortest", # stop video when audio ends (or vice versa)
            str(output_video)
        ])
    else:
        print("No background_music.mp3 found. Rendering silent video...")
        ffmpeg_cmd.extend([
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-crf", "17",
            "-movflags", "+faststart",
            str(output_video)
        ])
        
    print("Compiling video with FFmpeg...")
    result = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    if result.returncode != 0:
        print("FFmpeg compilation failed!")
        print(result.stderr)
        sys.exit(1)
        
    print(f"Successfully compiled 60 FPS video to: {output_video}")
    
    # Clean up temp frames
    print("Cleaning up temporary frame files...")
    shutil.rmtree(temp_dir)
    print("Render process complete!")

if __name__ == '__main__':
    main()
