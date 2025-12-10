import { FC, useState, useRef, useCallback } from 'react';
import { X, Upload, Image, Video, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (targetImage: string, videoUrl: string) => void;
}

export const UploadModal: FC<UploadModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTargetImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  }, []);

  const handleStartAR = useCallback(async () => {
    if (!targetImage || !videoUrl) return;

    setIsCompiling(true);
    setCompileProgress(0);

    // Simulate compilation progress
    const progressInterval = setInterval(() => {
      setCompileProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Small delay to show progress
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    clearInterval(progressInterval);
    setCompileProgress(100);

    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsCompiling(false);
    onUploadComplete(targetImage, videoUrl);
    onClose();
  }, [targetImage, videoUrl, onUploadComplete, onClose]);

  const resetUploads = useCallback(() => {
    setTargetImage(null);
    setVideoUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Add AR Content</h2>
          <button
            onClick={() => { resetUploads(); onClose(); }}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
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
                ${targetImage 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
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
                ${videoUrl 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
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
        <div className="p-4 border-t border-border flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { resetUploads(); onClose(); }}
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
              'Start AR'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
