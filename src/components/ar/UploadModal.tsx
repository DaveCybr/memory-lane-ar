import { FC, useState, useRef, useCallback, useEffect } from "react";
import {
  X,
  Upload,
  Image,
  Video,
  Loader2,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (targetImage: string, videoUrl: string) => void;
}

interface CachedContent {
  targetImage: string;
  videoUrl: string;
  timestamp: number;
}

const CACHE_KEY = "ar_content_cache";

export const UploadModal: FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadComplete,
}) => {
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [cachedContents, setCachedContents] = useState<CachedContent[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Load cached contents
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setCachedContents(Array.isArray(parsed) ? parsed : [parsed]);
      }
    } catch (error) {
      console.error("Error loading cache:", error);
    }
  }, [isOpen]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setTargetImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleVideoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
      }
    },
    []
  );

  const saveToCache = useCallback((targetImg: string, vidUrl: string) => {
    try {
      const newContent: CachedContent = {
        targetImage: targetImg,
        videoUrl: vidUrl,
        timestamp: Date.now(),
      };

      const cached = localStorage.getItem(CACHE_KEY);
      let contents: CachedContent[] = [];

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          contents = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          contents = [];
        }
      }

      // Add new content at the beginning
      contents.unshift(newContent);

      // Keep only last 5 items
      if (contents.length > 5) {
        contents = contents.slice(0, 5);
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(contents));
      setCachedContents(contents);
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  }, []);

  const handleStartAR = useCallback(async () => {
    if (!targetImage || !videoUrl) return;

    setIsCompiling(true);
    setCompileProgress(0);

    // Simulate compilation progress
    const progressInterval = setInterval(() => {
      setCompileProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Small delay to show progress
    await new Promise((resolve) => setTimeout(resolve, 1500));

    clearInterval(progressInterval);
    setCompileProgress(100);

    await new Promise((resolve) => setTimeout(resolve, 300));

    // Save to cache
    saveToCache(targetImage, videoUrl);

    setIsCompiling(false);
    onUploadComplete(targetImage, videoUrl);
    onClose();
  }, [targetImage, videoUrl, onUploadComplete, onClose, saveToCache]);

  const handleUseCached = useCallback(
    (content: CachedContent) => {
      onUploadComplete(content.targetImage, content.videoUrl);
      onClose();
    },
    [onUploadComplete, onClose]
  );

  const handleDeleteCached = useCallback(
    (index: number) => {
      const newContents = cachedContents.filter((_, i) => i !== index);
      setCachedContents(newContents);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newContents));
    },
    [cachedContents]
  );

  const resetUploads = useCallback(() => {
    setTargetImage(null);
    setVideoUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-semibold text-foreground">
            Add AR Content
          </h2>
          <button
            onClick={() => {
              resetUploads();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Cached Contents */}
          {cachedContents.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                Recent Content
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cachedContents.map((content, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <img
                      src={content.targetImage}
                      alt="Cached target"
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">
                        {new Date(content.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUseCached(content)}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/90"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => handleDeleteCached(index)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Or upload new content
                </p>
              </div>
            </div>
          )}

          {/* Target Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Image className="w-4 h-4" />
              Target Image (Marker)
            </label>
            <div
              onClick={() => imageInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                transition-all duration-200
                ${
                  targetImage
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              {targetImage ? (
                <div className="space-y-2">
                  <img
                    src={targetImage}
                    alt="Target"
                    className="w-24 h-24 object-cover mx-auto rounded-lg"
                  />
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Image uploaded</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload target image
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    JPG, PNG (high contrast works best)
                  </p>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video Content
            </label>
            <div
              onClick={() => videoInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                transition-all duration-200
                ${
                  videoUrl
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                }
              `}
            >
              {videoUrl ? (
                <div className="space-y-2">
                  <video
                    src={videoUrl}
                    className="w-32 h-20 object-cover mx-auto rounded-lg"
                    muted
                  />
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Video uploaded</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload video
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    MP4, WebM (16:9 recommended)
                  </p>
                </div>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Compile Progress */}
          {isCompiling && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-foreground">
                  Preparing AR target...
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${compileProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 sticky bottom-0 bg-card">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              resetUploads();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            disabled={!targetImage || !videoUrl || isCompiling}
            onClick={handleStartAR}
          >
            {isCompiling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Start AR"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
