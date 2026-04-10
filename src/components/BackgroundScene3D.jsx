'use client';
import { useEffect, useRef, useState } from 'react';

export default function BackgroundScene3D() {
  const canvasRef = useRef(null);
  const [images, setImages] = useState([]);
  const frameCount = 240;

  useEffect(() => {
    // Preload all images for smooth scrubbing
    const preloadedImages = [];
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      // Format number to 3 digits (e.g., 001, 002... 240)
      const frameNum = i.toString().padStart(3, '0');
      img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
      preloadedImages.push(img);
    }
    setImages(preloadedImages);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || images.length === 0) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;

    const render = () => {
      const scrollPos = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollFraction = Math.max(0, Math.min(1, scrollPos / maxScroll));
      
      const frameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
      const img = images[frameIndex];

      if (img && img.complete) {
        // Adjust canvas internal resolution to match screen
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        // Draw image with object-fit: cover logic
        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (imgRatio > canvasRatio) {
          drawHeight = canvas.height;
          drawWidth = img.width * (canvas.height / img.height);
          offsetX = (canvas.width - drawWidth) / 2;
        } else {
          drawWidth = canvas.width;
          drawHeight = img.height * (canvas.width / img.width);
          offsetY = (canvas.height - drawHeight) / 2;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [images]);

  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 w-full h-full object-cover -z-20 pointer-events-none" 
      />
      {/* Dark overlay to ensure white text remains readable over bright frames */}
      <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-[2px] -z-10 pointer-events-none mix-blend-multiply" />
    </>
  );
}
