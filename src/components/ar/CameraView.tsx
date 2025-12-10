import { FC, useEffect, useRef, useState, useCallback } from 'react';

interface CameraViewProps {
  isTracking: boolean;
  onTrackingChange: (isTracking: boolean) => void;
}

// Demo marker - a simple pattern for testing
const DEMO_MARKER_DATA = `
  This component simulates AR tracking for demo purposes.
  In production, you would use MindAR or similar library with real .mind target files.
`;

export const CameraView: FC<CameraViewProps> = ({ isTracking, onTrackingChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>();
  const [cameraReady, setCameraReady] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  // Simulated tracking state for demo
  const [simulatedTracking, setSimulatedTracking] = useState(false);
  const trackingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          const { videoWidth, videoHeight } = videoRef.current;
          setVideoSize({ width: videoWidth, height: videoHeight });
          setCameraReady(true);
          console.log('[Camera] Ready:', videoWidth, 'x', videoHeight);
        }
      } catch (error) {
        console.error('[Camera] Error:', error);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Demo: Simulate tracking when user taps screen
  const handleTap = useCallback(() => {
    // Toggle tracking for demo purposes
    const newTracking = !simulatedTracking;
    setSimulatedTracking(newTracking);
    onTrackingChange(newTracking);

    if (newTracking && overlayVideoRef.current) {
      overlayVideoRef.current.play().catch(console.error);
    } else if (overlayVideoRef.current) {
      overlayVideoRef.current.pause();
    }

    // Auto-stop tracking after 10 seconds for demo
    if (newTracking) {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
      trackingTimeoutRef.current = setTimeout(() => {
        setSimulatedTracking(false);
        onTrackingChange(false);
        if (overlayVideoRef.current) {
          overlayVideoRef.current.pause();
        }
      }, 30000);
    }
  }, [simulatedTracking, onTrackingChange]);

  // Render loop for drawing video overlay
  useEffect(() => {
    if (!cameraReady || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match viewport
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const render = () => {
      if (!ctx || !videoRef.current) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw camera feed (cover mode)
      const video = videoRef.current;
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (videoAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * videoAspect;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / videoAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

      // Draw video overlay if tracking
      if (simulatedTracking && overlayVideoRef.current) {
        const overlayVideo = overlayVideoRef.current;
        
        // Simulated marker position (center of screen, slightly above center)
        const markerWidth = canvas.width * 0.7;
        const markerHeight = markerWidth * (9 / 16); // 16:9 video
        const markerX = (canvas.width - markerWidth) / 2;
        const markerY = (canvas.height - markerHeight) / 2 - 50;

        // Add slight perspective transform for realism
        ctx.save();
        
        // Draw video on marker position
        ctx.drawImage(
          overlayVideo,
          markerX,
          markerY,
          markerWidth,
          markerHeight
        );

        // Add subtle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(markerX, markerY, markerWidth, markerHeight);

        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraReady, simulatedTracking]);

  return (
    <div className="ar-viewport" onClick={handleTap}>
      {/* Hidden video element for camera */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="hidden"
      />

      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />

      {/* Hidden video for AR overlay */}
      <video
        ref={overlayVideoRef}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        playsInline
        muted
        loop
        crossOrigin="anonymous"
        className="hidden"
        preload="auto"
      />

      {/* Demo instruction */}
      {!simulatedTracking && cameraReady && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10">
          <p className="text-xs text-muted-foreground bg-card/80 px-4 py-2 rounded-full backdrop-blur-sm">
            Tap screen to simulate tracking (demo)
          </p>
        </div>
      )}
    </div>
  );
};
