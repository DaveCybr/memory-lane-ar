import { FC, useState, useEffect, useCallback } from 'react';
import { LoadingScreen } from './LoadingScreen';
import { PermissionPrompt } from './PermissionPrompt';
import { ARHeader } from './ARHeader';
import { ScanOverlay } from './ScanOverlay';
import { ControlPanel } from './ControlPanel';
import { UploadModal } from './UploadModal';
import { MindARScene } from './MindARScene';
import { Plus } from 'lucide-react';

type AppState = 'loading' | 'permission' | 'upload' | 'running';

interface ARContent {
  targetImage: string;
  videoUrl: string;
}

export const ARExperience: FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [isTracking, setIsTracking] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [arContent, setARContent] = useState<ARContent | null>(null);

  // Loading animation
  useEffect(() => {
    const steps = [
      { progress: 30, message: 'Loading AR engine...' },
      { progress: 60, message: 'Preparing camera...' },
      { progress: 100, message: 'Ready!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingProgress(steps[currentStep].progress);
        setLoadingMessage(steps[currentStep].message);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => setAppState('permission'), 500);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleStartAR = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setAppState('upload');
    } catch (error) {
      console.error('Permission denied:', error);
      setAppState('upload');
    }
  }, []);

  const handleTrackingChange = useCallback((tracking: boolean) => {
    setIsTracking(tracking);
  }, []);

  const handleUploadComplete = useCallback((targetImage: string, videoUrl: string) => {
    setARContent({ targetImage, videoUrl });
    setAppState('running');
    setIsUploadOpen(false);
  }, []);

  const handleAddNew = useCallback(() => {
    setIsUploadOpen(true);
  }, []);

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Loading Screen */}
      {appState === 'loading' && (
        <LoadingScreen progress={loadingProgress} message={loadingMessage} />
      )}

      {/* Permission Prompt */}
      {appState === 'permission' && (
        <PermissionPrompt onStart={handleStartAR} />
      )}

      {/* Upload Screen */}
      {appState === 'upload' && (
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Create AR Experience
            </h1>
            <p className="text-muted-foreground mb-8">
              Upload a target image (marker) and a video. When you point your camera at the image, the video will appear on top of it.
            </p>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:bg-primary/90 transition-colors"
            >
              Upload Content
            </button>
          </div>
        </div>
      )}

      {/* AR Experience */}
      {appState === 'running' && arContent && (
        <>
          {/* MindAR Scene */}
          <MindARScene
            targetImageSrc={arContent.targetImage}
            videoSrc={arContent.videoUrl}
            onTrackingChange={handleTrackingChange}
          />

          {/* Header */}
          <ARHeader onMenuClick={() => setIsPanelOpen(true)} />

          {/* Scan Overlay (shown when not tracking) */}
          <ScanOverlay isTracking={isTracking} />

          {/* Add new button */}
          <button
            onClick={handleAddNew}
            className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>

          {/* Control Panel */}
          <ControlPanel 
            isOpen={isPanelOpen} 
            onClose={() => setIsPanelOpen(false)} 
          />
        </>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};
