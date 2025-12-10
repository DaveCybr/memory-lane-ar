import { FC, useEffect, useRef, useState, useCallback } from "react";

// Global type declarations for CDN libraries
declare global {
  interface Window {
    MINDAR: {
      IMAGE: {
        MindARThree: any;
        Compiler: any;
      };
    };
    THREE: any;
  }
}

interface MindARSceneProps {
  targetImageSrc: string;
  videoSrc: string;
  onTrackingChange: (isTracking: boolean) => void;
}

// Cache for compiled targets and videos
const arCache = {
  targets: new Map<string, Blob>(),
  videos: new Map<string, string>(),
};

export const MindARScene: FC<MindARSceneProps> = ({
  targetImageSrc,
  videoSrc,
  onTrackingChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const arVideoRef = useRef<HTMLVideoElement>(null);
  const mindarRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const compilerRef = useRef<any>(null);
  const [mindFileUrl, setMindFileUrl] = useState<string | null>(null);

  // Compile target image to .mind file with caching
  const compileTargetImage = useCallback(
    async (imageSrc: string): Promise<string> => {
      console.log("[MindAR] Compiling target image...");

      // Check if CDN is loaded
      if (typeof window.MINDAR === "undefined") {
        throw new Error("MindAR CDN not loaded. Please refresh the page.");
      }

      // Check cache first
      if (arCache.targets.has(imageSrc)) {
        console.log("[MindAR] Using cached compiled target");
        const cachedBlob = arCache.targets.get(imageSrc)!;
        return URL.createObjectURL(cachedBlob);
      }

      return new Promise((resolve, reject) => {
        try {
          // Use MindAR Compiler from CDN
          const { Compiler } = window.MINDAR.IMAGE;
          const compiler = new Compiler();
          compilerRef.current = compiler;

          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = async () => {
            try {
              console.log("[MindAR] Image loaded, starting compilation...");

              await compiler.compileImageTargets([img], (progress: number) => {
                console.log(
                  "[MindAR] Compile progress:",
                  Math.round(progress * 100) + "%"
                );
              });

              const exportedBuffer = await compiler.exportData();
              const blob = new Blob([exportedBuffer], {
                type: "application/octet-stream",
              });

              // Cache the compiled target
              arCache.targets.set(imageSrc, blob);

              const url = URL.createObjectURL(blob);
              console.log("[MindAR] Compilation complete and cached!");
              resolve(url);
            } catch (err) {
              console.error("[MindAR] Compilation error:", err);
              reject(err);
            }
          };

          img.onerror = () => {
            reject(new Error("Failed to load target image"));
          };

          img.src = imageSrc;
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );

  // Initialize MindAR
  const initAR = useCallback(
    async (mindFileUrl: string) => {
      if (!containerRef.current) return;

      try {
        console.log("[MindAR] Initializing AR scene...");

        // Check if CDN libraries are loaded
        if (typeof window.MINDAR === "undefined") {
          throw new Error("MindAR CDN not loaded. Please refresh the page.");
        }

        if (typeof window.THREE === "undefined") {
          throw new Error("Three.js CDN not loaded. Please refresh the page.");
        }

        // Use MindARThree and THREE from CDN
        const { MindARThree } = window.MINDAR.IMAGE;
        const THREE = window.THREE;

        const mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: mindFileUrl,
          uiLoading: "no",
          uiScanning: "no",
          uiError: "no",
        });

        mindarRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;

        // Add lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // Create video texture
        if (arVideoRef.current) {
          const videoTexture = new THREE.VideoTexture(arVideoRef.current);
          videoTexture.minFilter = THREE.LinearFilter;
          videoTexture.magFilter = THREE.LinearFilter;
          videoTexture.format = THREE.RGBAFormat;

          // 16:9 aspect ratio plane
          const geometry = new THREE.PlaneGeometry(1, 0.5625);
          const material = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.DoubleSide,
            transparent: false,
          });
          const videoPlane = new THREE.Mesh(geometry, material);

          // Create anchor for image target
          const anchor = mindarThree.addAnchor(0);
          anchor.group.add(videoPlane);

          // Handle target found/lost
          anchor.onTargetFound = () => {
            console.log("[MindAR] Target found!");
            onTrackingChange(true);
            if (arVideoRef.current) {
              arVideoRef.current.currentTime = 0;
              arVideoRef.current.play().catch(console.error);
            }
          };

          anchor.onTargetLost = () => {
            console.log("[MindAR] Target lost");
            onTrackingChange(false);
            if (arVideoRef.current) {
              arVideoRef.current.pause();
            }
          };
        }

        // Start AR
        console.log("[MindAR] Starting AR...");
        await mindarThree.start();
        setIsInitialized(true);
        console.log("[MindAR] AR started successfully!");

        // Animation loop
        renderer.setAnimationLoop(() => {
          renderer.render(scene, camera);
        });
      } catch (err) {
        console.error("[MindAR] Initialization error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize AR. Please try again."
        );
      }
    },
    [onTrackingChange]
  );

  // Load and initialize
  useEffect(() => {
    let mounted = true;

    const loadAndInit = async () => {
      try {
        console.log("[MindAR] Starting initialization...");

        // Wait for CDN to load (with timeout)
        const maxWaitTime = 5000;
        const startTime = Date.now();

        while (
          (typeof window.MINDAR === "undefined" ||
            typeof window.THREE === "undefined") &&
          Date.now() - startTime < maxWaitTime
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (
          typeof window.MINDAR === "undefined" ||
          typeof window.THREE === "undefined"
        ) {
          throw new Error(
            "Failed to load AR libraries. Please refresh the page."
          );
        }

        // Compile target image
        const url = await compileTargetImage(targetImageSrc);
        if (!mounted) return;

        setMindFileUrl(url);

        // Initialize AR
        await initAR(url);
      } catch (err) {
        console.error("[MindAR] Setup error:", err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to setup AR. Please refresh and try again."
          );
        }
      }
    };

    loadAndInit();

    return () => {
      mounted = false;
      if (mindarRef.current) {
        try {
          mindarRef.current.stop();
        } catch (e) {
          console.log("[MindAR] Stop error (expected):", e);
        }
      }
      if (mindFileUrl) {
        URL.revokeObjectURL(mindFileUrl);
      }
    };
  }, [targetImageSrc, compileTargetImage, initAR]);

  // Cache video src
  useEffect(() => {
    if (!arCache.videos.has(videoSrc)) {
      arCache.videos.set(videoSrc, videoSrc);
      console.log("[MindAR] Video cached");
    }
  }, [videoSrc]);

  return (
    <div className="ar-viewport">
      {/* MindAR Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0" />

      {/* Hidden video element for AR overlay */}
      <video
        ref={arVideoRef}
        src={videoSrc}
        playsInline
        muted
        loop
        crossOrigin="anonymous"
        className="hidden"
        preload="auto"
      />

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center p-6">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {!isInitialized && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Preparing AR experience...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
