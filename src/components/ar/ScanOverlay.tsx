import { FC } from 'react';
import { Scan } from 'lucide-react';

interface ScanOverlayProps {
  isTracking: boolean;
}

export const ScanOverlay: FC<ScanOverlayProps> = ({ isTracking }) => {
  if (isTracking) return null;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex items-end justify-center pb-32">
      <div className="glass-panel px-6 py-4 flex items-center gap-3 fade-in">
        <div className="relative">
          <Scan className="w-6 h-6 text-primary" />
          <div className="absolute inset-0 animate-ping">
            <Scan className="w-6 h-6 text-primary opacity-50" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Point camera at any photo</p>
          <p className="text-xs text-muted-foreground">or scan QR code to download</p>
        </div>
      </div>
    </div>
  );
};
