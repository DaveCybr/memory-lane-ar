import { FC, useEffect, useRef, useState, useCallback } from "react";

interface MindARSceneProps {
  targetImageSrc: string;
  videoSrc: string;
  onTrackingChange: (isTracking: boolean) => void;
}

declare global {
  interface Window {
    MINDAR: any;
    THREE: any;
  }
}

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

  // Compile target image to .mind file
  const compileTargetImage = useCallback(
    async (imageSrc: string): Promise<string> => {
      console.log("[MindAR] Compiling target image...");

      return new Promise((resolve, reject) => {
        try {
          // Check if compiler is available
          if (!window.MINDAR?.IMAGE?.Compiler) {
            reject(new Error("MindAR Compiler not loaded"));
            return;
          }

          const compiler = new window.MINDAR.IMAGE.Compiler();
          compilerRef.current = compiler;

          // Load image
          const img = new Image();
          img.crossOrigin = "anonymous";

          img.onload = async () => {
            try {
              console.log("[MindAR] Image loaded, starting compilation...");

              // Compile the image
              await compiler.compileImageTargets([img], (progress: number) => {
                console.log(
                  "[MindAR] Compile progress:",
                  Math.round(progress * 100) + "%"
                );
              });

              // Export to buffer
              const exportedBuffer = await compiler.exportData();

              // Create blob URL
              const blob = new Blob([exportedBuffer], {
                type: "application/octet-stream",
              });
              const url = URL.createObjectURL(blob);

              console.log("[MindAR] Compilation complete!");
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
      if (!containerRef.current || !window.THREE) return;

      try {
        console.log("[MindAR] Initializing AR scene...");

        const { MindARThree } = window.MINDAR.IMAGE;
        const THREE = window.THREE;

        // Initialize MindAR
        const mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: mindFileUrl,
          uiLoading: "no",
          uiScanning: "no",
          uiError: "no",
        });

        mindarRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;

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
        setError("Failed to initialize AR. Please try again.");
      }
    },
    [onTrackingChange]
  );

  // Load scripts and initialize
  useEffect(() => {
    let mounted = true;

    const loadAndInit = async () => {
      try {
        // Load Three.js from UNPKG (UMD version)
        if (!window.THREE) {
          console.log("[MindAR] Loading Three.js...");
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/three@0.136.0/build/three.js";
            script.type = "text/javascript";
            script.onload = () => {
              console.log("[MindAR] Three.js loaded");
              resolve();
            };
            script.onerror = (e) => {
              console.error("[MindAR] Failed to load Three.js:", e);
              reject(e);
            };
            document.head.appendChild(script);
          });
        }

        // Load MindAR Image Compiler from UNPKG
        if (!window.MINDAR?.IMAGE?.Compiler) {
          console.log("[MindAR] Loading MindAR Compiler...");
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image.prod.js";
            script.type = "text/javascript";
            script.onload = () => {
              console.log("[MindAR] Compiler loaded");
              // Wait a bit for the module to initialize
              setTimeout(resolve, 200);
            };
            script.onerror = (e) => {
              console.error("[MindAR] Failed to load Compiler:", e);
              reject(e);
            };
            document.head.appendChild(script);
          });
        }

        // Load MindAR Three from UNPKG
        if (!window.MINDAR?.IMAGE?.MindARThree) {
          console.log("[MindAR] Loading MindAR Three...");
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src =
              "https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-three.prod.js";
            script.type = "text/javascript";
            script.onload = () => {
              console.log("[MindAR] MindAR Three loaded");
              // Wait a bit for the module to initialize
              setTimeout(resolve, 200);
            };
            script.onerror = (e) => {
              console.error("[MindAR] Failed to load MindAR Three:", e);
              reject(e);
            };
            document.head.appendChild(script);
          });
        }

        if (!mounted) return;

        // Wait a bit more to ensure everything is fully initialized
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Verify all libraries are loaded
        if (!window.THREE) {
          throw new Error("Three.js failed to load");
        }
        if (!window.MINDAR?.IMAGE?.Compiler) {
          throw new Error("MindAR Compiler failed to load");
        }
        if (!window.MINDAR?.IMAGE?.MindARThree) {
          throw new Error("MindAR Three failed to load");
        }

        console.log("[MindAR] All libraries loaded successfully");

        // Compile target image
        console.log("[MindAR] Starting compilation...");
        const url = await compileTargetImage(targetImageSrc);
        if (!mounted) return;

        setMindFileUrl(url);

        // Initialize AR
        await initAR(url);
      } catch (err) {
        console.error("[MindAR] Setup error:", err);
        if (mounted) {
          setError("Failed to setup AR. Please refresh and try again.");
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
