import { FC, useEffect, useRef, useState, useCallback } from 'react';

interface ARSceneProps {
  onTrackingChange: (isTracking: boolean) => void;
}

declare global {
  interface Window {
    MINDAR: any;
    THREE: any;
  }
}

export const ARScene: FC<ARSceneProps> = ({ onTrackingChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const arVideoRef = useRef<HTMLVideoElement>(null);
  const mindarRef = useRef<any>(null);
  const anchorRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initAR = useCallback(async () => {
    if (!containerRef.current || !window.MINDAR || !window.THREE) return;

    try {
      const { MindARThree } = window.MINDAR.IMAGE;
      const THREE = window.THREE;

      // Initialize MindAR with the container
      const mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: '/targets.mind', // We'll use a demo target
        uiLoading: 'no',
        uiScanning: 'no',
        uiError: 'no',
      });

      mindarRef.current = mindarThree;

      const { renderer, scene, camera } = mindarThree;

      // Create video texture
      if (arVideoRef.current) {
        const videoTexture = new THREE.VideoTexture(arVideoRef.current);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;

        // Create plane geometry for video (16:9 aspect ratio)
        const geometry = new THREE.PlaneGeometry(1, 0.5625); // 16:9 ratio
        const material = new THREE.MeshBasicMaterial({ 
          map: videoTexture, 
          side: THREE.DoubleSide 
        });
        const videoPlane = new THREE.Mesh(geometry, material);

        // Create anchor for image target
        const anchor = mindarThree.addAnchor(0);
        anchorRef.current = anchor;
        anchor.group.add(videoPlane);

        // Handle target found/lost
        anchor.onTargetFound = () => {
          console.log('[AR] Target found');
          onTrackingChange(true);
          if (arVideoRef.current) {
            arVideoRef.current.play().catch(console.error);
          }
        };

        anchor.onTargetLost = () => {
          console.log('[AR] Target lost');
          onTrackingChange(false);
          if (arVideoRef.current) {
            arVideoRef.current.pause();
          }
        };
      }

      // Start AR
      await mindarThree.start();
      setIsInitialized(true);

      // Animation loop
      renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
      });

    } catch (error) {
      console.error('[AR] Initialization error:', error);
    }
  }, [onTrackingChange]);

  useEffect(() => {
    // Load MindAR and Three.js scripts
    const loadScripts = async () => {
      // Check if already loaded
      if (window.MINDAR && window.THREE) {
        initAR();
        return;
      }

      // Load Three.js
      if (!window.THREE) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.min.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      // Load MindAR
      if (!window.MINDAR) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js';
          script.onload = () => resolve();
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      initAR();
    };

    loadScripts();

    return () => {
      if (mindarRef.current) {
        mindarRef.current.stop();
      }
    };
  }, [initAR]);

  return (
    <div className="ar-viewport">
      {/* MindAR Container */}
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0 }}
      />

      {/* Hidden video element for AR overlay */}
      <video
        ref={arVideoRef}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        playsInline
        muted
        loop
        crossOrigin="anonymous"
        className="hidden"
        preload="auto"
      />
    </div>
  );
};
