import { FC, useState, useEffect, useCallback } from 'react';
import { LoadingScreen } from './LoadingScreen';
import { PermissionPrompt } from './PermissionPrompt';
import { ARHeader } from './ARHeader';
import { ScanOverlay } from './ScanOverlay';
import { ControlPanel } from './ControlPanel';
import { CameraView } from './CameraView';

type AppState = 'loading' | 'permission' | 'running';

export const ARExperience: FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [isTracking, setIsTracking] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Simulate loading
  useEffect(() => {
    const steps = [
      { progress: 20, message: 'Loading AR engine...' },
      { progress: 50, message: 'Preparing camera...' },
      { progress: 80, message: 'Loading target images...' },
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
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const handleStartAR = useCallback(async () => {
    try {
      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setAppState('running');
    } catch (error) {
      console.error('Permission denied:', error);
      // Still allow to proceed, camera will show error
      setAppState('running');
    }
  }, []);

  const handleTrackingChange = useCallback((tracking: boolean) => {
    setIsTracking(tracking);
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

      {/* AR Experience */}
      {appState === 'running' && (
        <>
          {/* Camera View with AR overlay */}
          <CameraView 
            isTracking={isTracking} 
            onTrackingChange={handleTrackingChange}
          />

          {/* Header */}
          <ARHeader onMenuClick={() => setIsPanelOpen(true)} />

          {/* Scan Overlay (shown when not tracking) */}
          <ScanOverlay isTracking={isTracking} />

          {/* Control Panel */}
          <ControlPanel 
            isOpen={isPanelOpen} 
            onClose={() => setIsPanelOpen(false)} 
          />
        </>
      )}
    </div>
  );
};
